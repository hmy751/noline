# Noline Workflow Map

이 문서는 자주 하는 작업의 시작점을 모아둔 지도다. 상세 기준의 원천은 각 source 문서와 workspace guide이며, 이 파일은 작업자가 처음 1-5분 안에 무엇을 확인할지 정한다.

## 사용 방식

1. 작업 유형을 고른다.
2. 관련 guard를 먼저 훑는다.
3. 코드 위치에 맞는 workspace guide를 연다.
4. 판단이 애매하면 source 문서로 내려간다.
5. 정책 자체가 바뀌면 workflow만 고치지 말고 source 문서와 decision record를 함께 본다.

## 빠른 작업표

| 작업 | 시작점 | 먼저 볼 guard | Source |
| --- | --- | --- | --- |
| 동기화 버그 수정 | [Debug Sync Issues](#sync-debug) | Activation Router, Transaction + sync_queue, Soft Delete | [selective-activation-architecture.md](../core/selective-activation-architecture.md) |
| 새 Entity 추가 | [Add New Entity](#add-entity) | Schema-first, Client-Side ID, Activation Router | [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md) |
| 날짜/시간 처리 | [Work with Dates/Times](#datetime-utils) | ISO 8601 time | [time.md](../core/time.md) |
| 통화 표시 | [Display Currency/Amounts](#currency-utils) | 없음. source 문서 우선 | [currency.md](../features/currency.md) |
| Form 구현 | [Implement Forms](#form-pattern) | Schema-first, Policy UI | [form.md](../features/form.md) |
| UI 컴포넌트 | [Build UI Components](#component-guide) | Policy UI | [components.md](../core/components.md) |
| API 추가 | [Add API Endpoint](#api-endpoint) | Auth/user scope, Client-Side ID | [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md) |

## 공통 흐름

- 코드 수정 전: [Noline Guard Map](../guards/README.md)에서 관련 보호 정책을 확인한다.
- 작업 위치 확정: `apps/client`, `apps/server`, `packages/schema`, `packages/ui` 중 실제 owner의 `CLAUDE.md`를 먼저 연다.
- 구현 중: root guide의 불변식보다 더 구체적인 workspace/source 문서가 있으면 그 문서를 우선한다.
- 구현 후: guard를 다시 훑고, 정책/용어/하네스가 바뀐 경우 [decisions/](../decisions/)에 남긴다.

## <a id="add-entity"></a>Add New Entity

Trip/Schedule/Expense처럼 sync 대상이 되는 Data Entity를 추가하거나 확장할 때 사용한다.

체크 순서:

1. `packages/schema`에서 Zod schema를 먼저 정의한다. 타입은 schema에서 `z.infer`로 추론한다.
2. client model, remote API, local datasource를 분리한다.
3. repository에서 `routeTripQuery`/`routeTripMutation`으로 Local/Remote 분기를 캡슐화한다.
4. local mutation은 `withTransaction` 안에서 DB 변경과 `sync_queue` 추가를 함께 처리한다.
5. 생성 ID는 `generateId()` wrapper를 사용하고, 서버는 클라이언트 ID를 그대로 수용한다.
6. 삭제나 목록 조회가 있으면 `deletedAt`과 `deletedAt IS NULL` 정책을 확인한다.
7. server route는 인증과 user ownership을 확인한다.

함께 볼 문서:

- [Noline Guard Map](../guards/README.md)
- [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md)
- [apps/client/CLAUDE.md](../../apps/client/CLAUDE.md)
- [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md)
- [architecture.md](../core/architecture.md)
- [api-data.md](../core/api-data.md)

## <a id="sync-debug"></a>Debug Sync Issues

대부분의 동기화 문제는 Router 우회, transaction 누락, 활성화 상태 오해에서 시작한다.

체크 순서:

1. 문제가 발생한 trip/entity와 활성화 상태를 확인한다.
2. Data Layer에서 직접 DB/API를 선택하는 코드가 있는지 찾는다. Data hook과 UI는 Router를 우회하지 않는다.
3. local mutation에서 DB 변경과 `sync_queue` 추가가 같은 `withTransaction` 안에 있는지 확인한다.
4. `sync_queue`의 status, operation, entity id가 실제 local row와 맞는지 본다.
5. delete flow라면 soft delete와 cleanup 조건을 확인한다.
6. 서버 전송/조회 문제라면 auth와 user ownership 필터를 확인한다.

함께 볼 문서:

- [Noline Guard Map](../guards/README.md)
- [selective-activation-architecture.md](../core/selective-activation-architecture.md)
- [api-data.md](../core/api-data.md)
- [deactivation-sync-queue-safety.md](../decisions/2025-11-20-deactivation-sync-queue-safety.md)

## <a id="datetime-utils"></a>Work with Dates/Times

시간 데이터는 저장과 표시를 분리한다.

체크 순서:

1. 저장/전송 값은 ISO 8601 datetime with timezone으로 유지한다.
2. 표시할 때만 `formatISOToLocalDate`, `formatISOToLocalTime`, `formatISOToLocalDateTime` 같은 shared util을 쓴다.
3. form의 date/time 필드는 submit 직전에 `combineDateTimeToISO` 계열로 결합한다.
4. `new Date(...).toLocaleDateString(...)` 중복 formatter를 새로 만들지 않는다.
5. DB type을 만질 때는 SQLite `TEXT`, PostgreSQL `TIMESTAMPTZ` 기준을 확인한다.

함께 볼 문서:

- [time.md](../core/time.md)
- [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md)

## <a id="currency-utils"></a>Display Currency/Amounts

통화는 환율 변환이 아니라 통화별 독립 표시가 기본이다.

체크 순서:

1. 표시에는 `formatCurrencyDisplay`를 사용한다.
2. 통화별 묶음이 필요하면 `groupExpensesByCurrency`를 사용한다.
3. 대표 통화가 필요하면 `getPrimaryCurrency`를 사용한다.
4. KRW/JPY는 소수점 없이, USD/EUR은 소수점 2자리 기준을 지킨다.
5. 환율 변환이나 단일 기준 통화 합산은 별도 정책이 있을 때만 추가한다.

함께 볼 문서:

- [currency.md](../features/currency.md)
- [manual-input.md](../features/manual-input.md)

## <a id="form-pattern"></a>Implement Forms

Form은 검증, 변환, mutation 호출의 경계를 분명히 둔다.

체크 순서:

1. React Hook Form과 Zod resolver를 기본으로 쓴다.
2. 가능한 경우 `@repo/schema`를 기준으로 form schema를 만든다.
3. form-only 필드는 submit 직전에 request shape으로 변환한다.
4. offline/manual 상태에 따라 입력 가능 여부가 달라지면 `useAppPolicy`와 기존 policy UI를 먼저 확인한다.
5. mutation hook은 데이터 작업만 맡기고, 화면은 policy와 form UX를 맡는다.

함께 볼 문서:

- [form.md](../features/form.md)
- [policy-architecture.md](../core/policy-architecture.md)
- [manual-input.md](../features/manual-input.md)

## <a id="component-guide"></a>Build UI Components

컴포넌트는 재사용 가능한 내부 간격과 도메인 책임을 분리한다.

체크 순서:

1. 공통 컴포넌트는 `packages/ui`, 도메인 컴포넌트는 client entity/feature 영역에 둔다.
2. props 타입을 명시하고 외부 margin은 부모가 제어한다.
3. 날짜/통화 표시는 shared util을 사용한다.
4. 정책 제한 상태는 새 UI를 만들기 전에 `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 패턴을 확인한다.
5. domain data fetch/mutation은 component 내부에서 Router를 직접 다루지 말고 data hook/repository를 통한다.

함께 볼 문서:

- [packages/ui/CLAUDE.md](../../packages/ui/CLAUDE.md)
- [components.md](../core/components.md)
- [policy-architecture.md](../core/policy-architecture.md)

## <a id="api-endpoint"></a>Add API Endpoint

API endpoint는 schema contract, auth/user scope, client-side ID 전략을 함께 본다.

체크 순서:

1. request/response schema를 `packages/schema`에서 먼저 확인하거나 추가한다.
2. server route에서 Zod parse, 인증, user ownership 검증을 수행한다.
3. create endpoint는 클라이언트가 만든 ID를 수용하는지 확인한다.
4. response shape은 client hook과 query key 사용처를 함께 확인한다.
5. client mutation은 Router, `withTransaction`, `sync_queue`, invalidation 기준을 함께 맞춘다.

함께 볼 문서:

- [apps/server/CLAUDE.md](../../apps/server/CLAUDE.md)
- [packages/schema/CLAUDE.md](../../packages/schema/CLAUDE.md)
- [api-data.md](../core/api-data.md)
- [auth-axios-factory.md](../decisions/2025-12-23-auth-axios-factory.md)

## Workflow 변경 기준

workflow는 반복 작업의 진입점을 빠르게 만드는 데만 쓴다. source 문서의 정책을 복사해 두껍게 만들지 않는다.

새 workflow를 추가하는 기준:

- 같은 작업 유형을 여러 번 반복한다.
- 시작할 때 열어야 할 문서가 3개 이상으로 흩어져 있다.
- 실수 비용이 크지만 guard map만으로는 실행 순서를 알기 어렵다.

한 기능의 상세 설계나 구현 이력은 `.claude/features/`, `.claude/core/`, `.claude/decisions/`, `.claude/implementation/` 중 해당 owner에 둔다.
