# Noline Guard Map

이 문서는 Noline에서 깨지면 비용이 큰 보호 정책을 빠르게 찾기 위한 지도다. 상세 기준의 원천은 각 source 문서이며, 이 파일은 작업 전후 체크용이다.

## 사용 방식

- 관련 코드를 수정하기 전에 해당 guard를 먼저 훑는다.
- 판단이 애매하면 source 문서를 열어 상세 맥락을 본다.
- guard와 source 문서가 충돌하면 source 문서를 기준으로 수정하고, 이 guard map도 함께 갱신한다.

## Active Guards

| Guard | 적용 영역 | 지켜야 할 것 | Source |
| --- | --- | --- | --- |
| Activation Router | `apps/client/src/entities/**`, data hooks, repository | Trip/Schedule/Expense 같은 Data Layer는 활성화 상태에 따라 Local/Remote를 분기한다. Hook이나 UI에서 직접 DB/API를 선택하지 않는다. | [selective-activation-architecture.md](../core/selective-activation-architecture.md), [api-data.md](../core/api-data.md), [apps/client/CLAUDE.md](../../apps/client/CLAUDE.md) |
| Data/Service 분리 | Data: Trip/Schedule/Expense, Service: Map/Search/Directions | Data Layer는 Router와 sync_queue 책임을 갖고, Service Layer는 Policy 기반 Network-First로 다룬다. | [data-service-separation.md](../decisions/2025-11-20-data-service-separation.md), [policy-architecture.md](../core/policy-architecture.md) |
| Transaction + sync_queue | Local mutation, offline input, activation/deactivation | 로컬 DB 변경과 sync_queue 추가는 `withTransaction`으로 원자성을 보장한다. | [selective-activation-architecture.md](../core/selective-activation-architecture.md), [deactivation-sync-queue-safety.md](../decisions/2025-11-20-deactivation-sync-queue-safety.md), [apps/client/CLAUDE.md](../../apps/client/CLAUDE.md) |
| Client-Side ID | Entity create, request schema, server create route | 클라이언트가 `generateId()`로 ID를 만들고, 서버는 클라이언트 ID를 수용한다. `ulid()` 직접 호출은 피한다. | [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md), [apps/client/CLAUDE.md](../../apps/client/CLAUDE.md), [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md) |
| Schema-first | `packages/schema/**`, client/server type contract | `@repo/schema`는 schema가 원천이다. 타입은 schema import 후 `z.infer`로 추론한다. | [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md), [typescript.md](../core/typescript.md) |
| ISO 8601 time | 날짜/시간 필드, DB schema, request/response | 모든 시간 데이터는 ISO 8601 datetime with timezone으로 통일한다. | [time.md](../core/time.md), [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md), [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md) |
| Soft Delete | delete flow, list query, sync pull/push | 데이터는 `deletedAt`으로 숨기고 조회에서는 `deletedAt IS NULL` 필터를 유지한다. hard delete는 sync 안전 조건을 확인한 뒤 제한적으로만 한다. | [apps/client/CLAUDE.md](../../apps/client/CLAUDE.md), [deactivation-sync-queue-safety.md](../decisions/2025-11-20-deactivation-sync-queue-safety.md) |
| Auth/user scope | server routes, local data filtering, sync | 보호된 서버 route는 인증과 user ownership을 확인하고, 로컬 데이터는 userId 기준으로 분리한다. | [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md), [auth-axios-factory.md](../decisions/2025-12-23-auth-axios-factory.md), [CLAUDE.md](../../CLAUDE.md) |
| Policy UI | offline/online, active/inactive 상태에 따른 UI | 컴포넌트는 임의 조건보다 `useAppPolicy` 결과를 우선 확인하고, 제한 상태는 `PolicyErrorDisplay` 등 기존 UX 패턴으로 안내한다. | [policy-architecture.md](../core/policy-architecture.md), [manual-input.md](../features/manual-input.md) |

## 자주 걸리는 실패 패턴

| 실패 패턴 | 확인할 guard | 빠른 확인 |
| --- | --- | --- |
| Router 없이 DB/API를 직접 선택 | Activation Router | Data hook, repository, UI에서 `db.select`나 `api.get`으로 Local/Remote를 직접 고르지 않는다. |
| `sync_queue`를 transaction 밖에 둠 | Transaction + sync_queue | local mutation은 DB 변경과 queue 추가를 같은 `withTransaction` 안에서 처리한다. |
| 날짜 formatter를 새로 만듦 | ISO 8601 time | `formatDate` 같은 로컬 formatter보다 shared datetime util을 먼저 찾는다. |
| `ulid()`를 직접 호출 | Client-Side ID | React Native 호환 wrapper인 `generateId()`를 사용한다. |
| 비활성화 cleanup에서 hard delete | Transaction + sync_queue, Soft Delete | pending sync를 확인하고 `cleanupPending`, soft delete, vacuum 흐름을 지킨다. |

## Guard 추가 기준

아래 중 하나에 해당할 때만 새 guard를 추가한다.

- 같은 실수가 2회 이상 반복됐다.
- 한 번의 실수 비용이 크다. 예: 데이터 손실, sync_queue 누락, 계정 데이터 노출.
- 이미 합의된 정책인데 여러 문서에 흩어져 작업자가 놓치기 쉽다.

단일 기능 설명이나 참고 팁은 guard가 아니라 `.claude/core/`, `.claude/features/`, workspace guide에 둔다.
