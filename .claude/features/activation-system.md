# Activation System Guide

> 문서 상태: active source.
> 과거 구현 계획, phase checklist, rollback 메모는 [_archive/activation-system-rollout-history.md](../_archive/activation-system-rollout-history.md)에 보존되어 있다. 이 문서는 현재 코드에서 바로 작업할 때 읽는 짧은 기준이다.

## 현재 모델

Activation은 특정 여행을 오프라인에서도 사용할 수 있게 준비하는 상태다.

- 활성화된 여행: Data Entity는 로컬 SQLite와 `sync_queue`를 우선 사용한다.
- 비활성 여행: Data Entity는 서버 API를 우선 사용하고, 오프라인이면 차단한다.
- 한 사용자 기준으로 동시에 활성화된 여행은 하나만 둔다.
- 활성화 상태의 단일 진실 공급원은 `tripActivations` 테이블이다.

코드 경로명은 과거 구현 이력 때문에 `offline-prep`로 남아 있다. 문서와 커뮤니케이션에서는 `Activation Router`를 우선 사용한다.

## 현재 코드 경로

| 책임 | 현재 위치 |
| --- | --- |
| Router | `apps/client/src/shared/services/offline-prep/router.ts` |
| Activation metadata | `apps/client/src/shared/services/offline-prep/metadata.ts` |
| Activate hook | `apps/client/src/entities/trip/data/useActivateTrip.ts` |
| Deactivate hook | `apps/client/src/entities/trip/data/useDeactivateTrip.ts` |
| Active trip query | `apps/client/src/entities/trip/data/useGetTripActivation.ts` |
| DB schema | `apps/client/src/shared/db/schema.ts` |
| Offline map download | `apps/client/src/shared/services/offline-map/download.ts` |
| Route download | `apps/client/src/shared/services/directions/route-downloader.ts` |
| Sync cleanup | `apps/client/src/shared/services/sync/cleanup-job.ts` |

## Router 함수

`router.ts`의 네 함수가 Data Entity의 Local/Remote 분기를 소유한다.

| 함수 | 사용 대상 | 분기 기준 |
| --- | --- | --- |
| `routeTripQuery` | Trip 목록/상세 조회 | 현재 사용자에게 활성화된 여행이 하나라도 있는가 |
| `routeTripMutation` | Trip 생성/수정/삭제 | 현재 사용자에게 활성화된 여행이 하나라도 있는가 |
| `routeChildQuery` | Schedule/Expense 조회 | 해당 `tripId`가 활성화되어 있는가 |
| `routeChildMutation` | Schedule/Expense 생성/수정/삭제 | 해당 `tripId`가 활성화되어 있는가 |

Entity hook이나 화면에서 직접 DB/API를 선택하지 않는다. `entities/*/repository/*`에서 Router를 호출하고, `data/` hook은 repository만 사용한다.

## Metadata 함수

`metadata.ts`는 활성화 상태 조회의 얇은 API다.

- `getTripActivationStatus(tripId)`: Schedule/Expense 라우팅용 boolean.
- `getTripActivationStatusDetail(tripId)`: UI badge용 `online | preparing | ready`.
- `hasAnyActivatedTrip()`: Trip 자체 라우팅용. 현재 `authStore.userId` 필터를 포함한다.
- `getActivatedTripInfo()`: TripSelector 같은 UI에서 활성 여행 표시.
- `getTripMetadata(tripId)`: 로컬 Trip 메타데이터 조회.
- `getMapDownloadProgress(tripId)`: 지도 다운로드 진행률 조회.

## Activate Flow

`useActivateTrip`의 현재 흐름:

1. 이미 활성화된 여행이면 로컬 schedules를 기준으로 누락된 route download만 재시도한다.
2. `/api/trips/:id/activate`로 서버의 Trip/Schedule/Expense 데이터를 pull한다.
3. 트랜잭션 안에서 모든 Trip 메타데이터를 upsert한다.
4. 기존 활성화 레코드는 `isActivated=false`로 내린다.
5. 선택한 여행의 `tripActivations` 레코드를 upsert하고 `syncStatus='COMPLETED'`, `dataDownloaded=true`, `mapDownloaded=false`로 둔다.
6. pull된 schedules/expenses를 local DB에 upsert한다.
7. UI를 막지 않고 offline map download와 route download를 백그라운드로 시작한다.
8. Trip, activeTrip, Schedule, Expense, Route query key를 invalidation한다.

## Deactivate Flow

`useDeactivateTrip`의 현재 흐름:

1. 로컬 Trip과 `tripActivations` 상태를 확인한다.
2. `sync_queue`에 pending 작업이 있는지 확인한다.
3. `tripActivations.isActivated=false`와 `deactivatedAt`을 기록한다.
4. `cleanupData=true`이고 pending 작업이 없으면 schedules/expenses를 soft delete한다.
5. pending 작업이 있으면 `cleanupPending=true`로 두고 sync cleanup job에 넘긴다.
6. 즉시 cleanup이 실행된 경우에만 offline map도 정리한다.
7. 서버 deactivation 알림은 best-effort로 보낸다. 실패해도 로컬 비활성화는 되돌리지 않는다.

## Policy와의 경계

Activation Router는 데이터를 어디서 읽고 쓸지 결정한다. Policy Layer는 기능을 사용할 수 있는지와 어떤 UI 모드를 보여줄지 결정한다.

- Data Entity: Router 사용.
- Service Layer(Map/Search/Directions): Router를 쓰지 않고 Policy 기반 Network-First로 다룬다.
- UI 제한: `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 패턴을 우선한다.

## 작업 체크리스트

- [ ] Trip/Schedule/Expense의 repository에서 Router를 우회하지 않았는가?
- [ ] Service Layer에 Router를 새로 적용하지 않았는가?
- [ ] 활성화 상태 조회에 현재 사용자 기준이 필요한 경우 `userId` 필터를 빠뜨리지 않았는가?
- [ ] 로컬 mutation은 client-generated ID와 `sync_queue`를 함께 고려했는가?
- [ ] 비활성화 cleanup에서 pending sync 데이터를 hard delete하지 않았는가?
- [ ] `offline-prep`는 코드 경로명이고 현재 용어는 `Activation Router`로 유지했는가?
