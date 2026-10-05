# Selective Activation Data Layer Guide

> 문서 상태: active source.
> 긴 v2 실전 가이드와 반복 이슈 기록은 [_archive/selective-activation-architecture-v2-guide.md](../_archive/selective-activation-architecture-v2-guide.md)에 보존되어 있다.

이 문서는 Trip/Schedule/Expense 같은 Data Entity를 수정할 때의 현재 기준이다. Service Layer(Map/Search/Directions)는 [Policy Architecture](./policy-architecture.md)를 따른다.

## 핵심 모델

Selective Activation의 현재 의미는 "활성화된 여행만 오프라인 보험을 가진다"이다.

- 활성화된 여행: Local SQLite + `sync_queue`.
- 비활성 여행: Server API.
- 활성화 여부 판단: `tripActivations`.
- Local/Remote 분기: Activation Router.
- 권한과 UI 모드: Policy Layer.

## Entity Layer 구조

현재 Data Entity는 다음 구조를 기본값으로 둔다.

```text
apps/client/src/entities/{entity}/
├── model/       # @repo/schema에서 z.infer로 타입 추출
├── api/         # remote API 함수
├── lib/         # local SQLite data source
├── repository/  # Activation Router로 local/remote 분기
├── data/        # React Query keys/hooks
├── ui/          # entity UI
└── index.ts     # public export
```

`data/` hook은 repository를 호출한다. 화면, feature, data hook에서 local DB와 server API를 직접 선택하지 않는다.

## Router 사용 기준

| 대상 | Query | Mutation |
| --- | --- | --- |
| Trip 목록 | `routeTripQuery` | — |
| Trip 생성 | — | `routeTripCreation(remote)` |
| Trip 단건·Schedule/Expense | `routeChildQuery(tripId, ...)` | `routeChildMutation(tripId, ...)` |

새 Trip은 비활성 상태로 서버에서 생성한다. 다른 활성 여행의 존재는 생성 위치를 바꾸지 않는다. Trip 단건 조회·수정·삭제는 Schedule/Expense와 같이 대상 여행의 활성화 여부로 분기한다.

Trip 목록은 실제 온라인·서버 인증 상태에서 서버의 전체 목록을 조회한다. Repository가 Local datasource에 목록 반영을 맡기며, 활성 여행과 미전송 Trip/Schedule/Expense 작업의 부모 여행은 로컬 값을 보존한다. 큐의 PENDING·IN_PROGRESS·FAILED를 모두 보존 대상으로 본다. 서버에서 사라진 나머지 비활성 사본은 soft delete로 숨긴다. 목록 반영은 하나의 transaction이고 `sync_queue`를 추가·삭제하지 않는다.

이전 세션이나 취소된 Query 응답은 목록을 저장하지 않는다. 조회 출처는 서버만 반영한 `remote`, 보존할 로컬 여행이 섞인 `mixed`, 연결·인증 제한 중 활성 여행의 사본을 읽은 `local`로 구별한다. 여행 선택은 성공한 remote/mixed 결과에서만 사라진 선택을 정리한다.

생성·수정·삭제와 활성화 변경 뒤에는 기존 `cancelAndInvalidateQueries`로 이전 조회를 취소하고 목록을 갱신한다. 최초 조회도 취소해야 변경 전 응답이 나중에 목록을 덮지 않는다. `useGetTrips`는 다른 Entity 조회와 같이 Repository·Query key·유효기간만 연결한다. 목록은 연결 상태와 무관하게 단일 key를 사용하고 기존 5분 staleTime을 유지한다.

계정 전체 여행 목록은 여러 탭과 앱의 여행 선택에서 공유한다. `application/useTripListRefresh`를 로그인 후 작업 연결부에서 한 번 장착해 실제 네트워크·인증 상태가 바뀌면 같은 목록을 취소·갱신한다. 이 연결은 서버 접근 가능 여부를 계산하지 않으며 실제 DB/API 선택은 Router가 맡는다. 화면 강제값·확인 진행 상태만 바뀌면 목록을 갱신하지 않고, 해제 시 Store 구독을 정리한다. 일정·경비의 내용 접근은 기존 feature의 정책 조회 조합을 유지한다. 여행 목록은 연결이 끊겨도 이미 아는 기본 정보를 유지해야 하므로, 활성 여행 없이 재조회가 거부돼도 기존 Query 데이터를 그대로 제공한다.

오프라인/unknown 또는 재인증 대기 중에는 활성 여행이 있어야 로컬 목록을 제공한다. 온라인으로 감지됐어도 API의 네트워크 오류·시간 초과·5xx 응답이면 같은 세션의 활성 여행이 있을 때 `local` 목록을 제공한다. 인증·응답 계약·미분류 오류나 로컬 반영 실패는 Query 오류로 전달한다. 로컬 목록은 서버의 최신 상태를 보장하지 않으며, 이미 성공한 서버 mutation을 재조회 실패로 되돌려 보고하지 않는다.

변경 이유와 검증 범위는 [비활성 Trip 생성과 목록 캐시 결정](../decisions/2026-10-04-inactive-trip-creation.md)을 참고한다.

## Local Mutation 기준

활성화된 여행에서 local mutation을 만들 때는 다음을 함께 지킨다.

- 클라이언트에서 ID를 생성한다. 현재 기본은 `generateId()`/ULID다.
- local DB 변경과 `sync_queue` 추가는 가능한 한 `withTransaction` 안에서 묶는다.
- `createdAt`, `updatedAt`, `version`, `deletedAt` 같은 sync 필드를 유지한다.
- 삭제는 기본적으로 soft delete를 우선한다.
- 네트워크 복구 후 push는 Sync Engine이 처리한다.

## Sync Engine과 Cleanup

Sync Engine은 Router가 아니다. Router는 지금 읽고 쓸 위치를 정하고, Sync Engine은 로컬 변경을 서버와 맞춘다.

현재 관련 경로:

- `apps/client/src/shared/services/sync/engine.ts`
- `apps/client/src/shared/services/sync/queue.ts`
- `apps/client/src/shared/services/sync/cleanup-job.ts`
- `apps/client/src/shared/services/sync/provider.tsx`

비활성화 cleanup은 pending sync 작업을 먼저 확인한다. pending 작업이 있으면 `cleanupPending=true`로 남기고, sync 완료 후 cleanup job이 정리한다.

## Service Layer 경계

Map/Search/Directions는 사용자가 소유한 Data Entity가 아니라 외부 서비스 호출과 표시 책임이다.

- Service Layer에는 Activation Router를 새로 적용하지 않는다.
- 온라인/오프라인, 활성/비활성 상태에 따른 서비스 사용 가능 여부는 `useAppPolicy`가 결정한다.
- 오프라인 지도와 경로 다운로드는 활성화 플로우의 부가 작업이지만 Data Entity routing의 일부는 아니다.

## 작업 체크리스트

- [ ] 새 Entity가 Trip/Schedule/Expense와 같은 sync 대상 Data Entity인가?
- [ ] `model/api/lib/repository/data` 책임이 분리되어 있는가?
- [ ] repository가 Router를 호출하고 data hook은 repository만 보는가?
- [ ] local mutation에서 ID, timestamps, version, `sync_queue`가 함께 처리되는가?
- [ ] Service Layer 기능을 Data Router에 넣지 않았는가?
- [ ] 오래된 `Local-First` 표현을 비활성 여행 전체 정책으로 확대하지 않았는가?
