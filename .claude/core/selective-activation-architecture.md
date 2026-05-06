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
| Trip 자체 | `routeTripQuery` | `routeTripMutation` |
| Schedule/Expense | `routeChildQuery(tripId, ...)` | `routeChildMutation(tripId, ...)` |

Trip 자체 라우팅은 "현재 사용자에게 활성화된 여행이 하나라도 있는가"를 본다. Schedule/Expense는 해당 `tripId`의 활성화 여부를 본다.

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
