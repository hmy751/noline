# 책임과 의존을 함께 정한다

**언제 쓰나:** client 모듈을 새로 배치하거나 재사용·의존 방향을 바꿀 때 읽는다. 공통 시작은 [개발 기준](INDEX.md)이다.

**핵심 기준:** 화면 조립에서 기능, entity, 공통 기반을 사용하고 하위 책임에서 상위 workflow를 알지 않게 한다. Noline은 feature와 widget 역할을 `features`에 함께 두는 실용적 FSD 구성을 사용한다. 아래는 새 변경의 기준이며 전체 코드가 엄격한 FSD를 만족한다는 인증이 아니다.

| 위치 | 맡길 책임과 경계 |
| --- | --- |
| `app/` | Expo Router의 경로·그룹·navigation 옵션과 앱 구성의 연결. 일반 route는 screen을 렌더링한다. Root layout은 provider와 인증 후 효과를 연결하므로 모든 파일이 단순 re-export라는 설명은 맞지 않는다. |
| `src/application/` | DB·인증 준비, 실패·재시도, 앱 수명에 따른 실행의 조합. 개별 여행 선택 규칙·DB 구현을 다시 소유하지 않는다. |
| `src/screens/` | 화면 layout, 작성 단계·수명과 feature 조립. 복잡한 데이터 처리·사용자 작업은 아래 책임에 위임한다. |
| `src/features/` | 생성·수정·조회 조합 등 사용자 목표 단위. 단순 action과 여러 요소의 조합을 모두 포함한다. |
| `src/entities/` | Trip·Schedule·Expense 등의 model, 데이터 접근·query, entity 표시와 전용 계산. |
| `src/shared/` | client 공통 기반과 앱 전용 integration. 모든 내용이 domain과 무관한 순수 함수라는 뜻은 아니다. |
| `packages/ui` | Trip·인증·DB·Policy를 모르는 React Native primitive와 shell. |
| `packages/schema` | client/server 공유 Zod 계약. client의 실행 계층이나 DB 구현을 의존하지 않는다. |

`application`은 screens 위에 모든 기능을 모으는 새 필수 단계를 뜻하지 않는다. 현재 [AppInitialization](../../../../apps/client/src/application/AppInitialization.tsx)은 DB와 인증 복원을 조율하고, [useTripListRefresh](../../../../apps/client/src/application/useTripListRefresh.ts)는 네트워크·인증 변화에 query 갱신을 연결한다. [Root layout](../../../../apps/client/app/_layout.tsx)은 navigation과 provider를 조립한다. 준비와 인증 후 작업의 완료 차이는 [앱 실행](../../current/app-runtime/INDEX.md)을 따른다.

## Entity를 바꾸면 저장·조회 경계를 따라간다

Sync 소유 entity의 기본 흐름은 `data hook → repository → local lib / remote api`다. `model`은 공유 schema에서 타입을 연결하고 `data`는 query key와 React Query 설정을 소유한다. `repository`가 Activation Router를 사용하므로 feature나 화면이 네트워크 상태로 SQLite/API를 직접 선택하지 않는다. Local mutation과 queue의 원자성은 [Local 변경·queue 계약](../data-lifecycle/INDEX.md#local-변경과-queue를-같이-확정한다)을 지킨다.

`model/api/lib/repository/data/ui/utils`는 필요한 책임을 찾는 지도이지 새 entity마다 빈 폴더를 만들라는 양식이 아니다. 예를 들어 [Expense API](../../../../apps/client/src/entities/expense/api/expenses.ts)는 request parse·HTTP·response parse를 맡고, Local 저장과 Router는 별도 구현이다. 지도 pack이나 외부 장소 검색에 동일한 sync-owned entity 구조를 강제하지 않는다.

## Shared에서는 상태·실행·정책의 주 책임을 구별한다

| 책임 | 배치와 판단 |
| --- | --- |
| 입력을 계산·변환하는 공통 함수 | `shared/lib`. 순수 계산이 기본이지만 현재 queryClient·query-refresh 같은 side effect 모듈도 있으므로 폴더명으로 순수성을 보장하지 않는다. |
| 작업 수행과 외부·저장 integration | `shared/services`. sync, offline prep, auth, 지도·경로·Places가 속한다. |
| 런타임 상태와 그 상태의 변경·구독 | `shared/store`. 전역 Store의 상태 관리 도구는 기존 결정대로 Zustand를 사용한다. 상태에 필요한 갱신·기기 저장·감지 수명을 포함할 수 있다. |
| 조건별 허용·이유 선택 | `shared/policy`. 네트워크·세션·활성 상태로 사용 가능 여부를 정하고 데이터 저장이나 workflow 전체를 수행하지 않는다. |

Store를 단순 변수함으로 만들거나 모든 side effect를 파일 밖으로 옮기는 기준이 아니다. Network Store는 관측 세션의 시작·재확인·해제를 상태와 함께 소유한다. Auth Store는 계정·인증 상태와 기기 기록 적용을, auth service는 로그인·로그아웃의 전체 절차를 맡는다. 같은 상태를 다루는 hook·비React 접근은 한 소유 위치에서 찾게 하되, 다른 실행 책임까지 한 파일에 누적하지 않는다.

## 기존 의존 예외는 현재 범위로 읽는다

[useAppPolicy](../../../../apps/client/src/shared/policy/useAppPolicy.ts)는 entity 활성 query를 참조한다. 지도 UI의 route/offline-city hook, 지도 cleanup·route downloader의 entity query key, currency helper의 Expense 타입 참조도 현재 shared에서 entity를 향한다. 이 사실은 새 역방향 참조를 허용하는 일반 규칙이 아니다. 해당 부분을 변경할 때 실제 순환 의존과 책임을 확인하고, 더 낮은 계약·입력 전달로 나눌 수 있는지 비교한다. 이번 문서 이관은 그 코드를 재배치하지 않았다.

일정·경비의 조회 feature는 entity query와 `shared/services/policy-query`를 조합한다. 현재 일정·경비 폼은 일정 조회 feature의 공개 index를 통해 훅을 재사용한다. 이 선택은 다음 조건의 한정된 조회 조합으로 유지한다.

- 재사용 훅은 UI·폼 입력·저장 작업을 소유하지 않고 entities/shared만 참조한다.
- 조회 feature가 소비 폼이나 다른 feature를 역으로 참조하지 않는다. 폼끼리의 의존을 만들지 않는다.
- 공개 index로 경계를 드러내며, index 사용만으로 모든 같은 계층 의존을 허용하지 않는다.

이 배치는 폼마다 Policy와 query 조합을 복제하지 않고 entity data hook에 UI 접근 정책을 밀어 넣지 않으려는 선택이다. 대신 같은 계층 간 결합이 남는다. 다른 feature로 확대하거나 일반 FSD 규칙을 바꾸는 근거로 자동 사용하지 않는다. [일정 조회 훅](../../../../apps/client/src/features/schedule/read-schedules/useTripSchedulesReadQuery.ts)과 실제 소비 폼을 함께 확인한다.

## 라우트와 화면을 추가하면 기존 그룹과 작업 수명을 확인한다

일반 route는 screen을 연결하고 복잡한 UI·업무 처리를 넣지 않는다. `(group)`과 `_layout.tsx`는 공통 navigation shell을 구성하며, 탭 바에서 벗어날 모달·전체 화면은 해당 그룹 밖에 배치한다. 여행 생성의 실제 흐름은 [route](../../../../apps/client/app/create-trip.tsx), [screen](../../../../apps/client/src/screens/CreateTripScreen.tsx), [feature](../../../../apps/client/src/features/trip/create-trip/)에서 확인한다. 그룹명 자체를 URL segment로 취급하지 않는다.
