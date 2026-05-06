# Noline 런북

런북은 반복 작업의 진입점이다. 전체 아키텍처 가이드를 복사하지 않고, 작업을 시작할 때 먼저 확인할 순서와 링크만 제공한다.

## 읽는 방식

1. 아래에서 작업 유형을 고른다.
2. 연결된 규칙과 workspace guide를 연다.
3. 수정 전후에 [Guard Map](../guards/README.md)을 확인한다.
4. 규칙만으로 부족할 때만 [맥락 지도](../context/README.md)을 읽는다.

## 빠른 작업표

| 작업 | 먼저 볼 규칙 | workspace/context |
| --- | --- | --- |
| [새 Entity 추가](#add-entity) | [Schema First](../rules/schema-first.md), [Client-Side ID](../rules/client-side-id.md), [Activation Router](../rules/activation-router.md) | [packages/schema](../../packages/schema/CLAUDE.md), [client](../../apps/client/CLAUDE.md), [server](../../apps/server/CLAUDE.md) |
| [동기화 문제 디버깅](#sync-debug) | [Activation Router](../rules/activation-router.md), [Transaction + Sync Queue](../rules/transaction-sync-queue.md) | [Selective Activation context](../context/README.md#selective-activation-and-router) |
| [API endpoint 추가](#api-endpoint) | [Schema First](../rules/schema-first.md), [Auth/User Scope](../rules/auth-user-scope.md), [Client-Side ID](../rules/client-side-id.md) | [server](../../apps/server/CLAUDE.md), [schema](../../packages/schema/CLAUDE.md) |
| [Form 구현](#form-pattern) | [Schema First](../rules/schema-first.md), [Policy UI](../rules/policy-ui.md), [ISO Time](../rules/iso-time.md) | [Form context](../context/README.md#forms-and-manual-input) |
| [날짜/시간 처리](#datetime-utils) | [ISO Time](../rules/iso-time.md) | [Time context](../context/README.md#time-and-date) |
| [통화/금액 표시](#currency-utils) | hard rule 없음. context 먼저 확인 | [Currency context](../context/README.md#currency) |
| [UI 컴포넌트 작성](#component-guide) | [Policy UI](../rules/policy-ui.md) | [packages/ui](../../packages/ui/CLAUDE.md), [Component context](../context/README.md#components) |

## <a id="add-entity"></a>새 Entity 추가

Trip/Schedule/Expense처럼 sync-owned Data Entity를 추가하거나 확장할 때 사용한다.

1. `packages/schema`에서 Zod schema를 먼저 정의하거나 갱신한다.
2. schema에서 type을 추론하고, 별도 DTO를 중복 작성하지 않는다.
3. create payload와 server route가 client-created ID를 수용하는지 확인한다.
4. client model, local datasource, remote API, repository routing, data hook 경계를 잡는다.
5. local DB mutation과 `sync_queue` insert를 같은 transaction 안에 둔다.
6. delete/list 동작이 `deletedAt`과 pending sync safety를 지키는지 확인한다.
7. server route가 인증과 user ownership을 확인하는지 본다.

## <a id="sync-debug"></a>동기화 문제 디버깅

local/remote state, pending sync, activation, deletion path가 어긋날 때 사용한다.

1. 문제가 난 trip, entity, activation state, user를 확인한다.
2. Data Layer 코드가 Activation Router를 우회했는지 확인한다.
3. local write와 `sync_queue` insert가 같은 transaction 안에 있는지 본다.
4. queue row와 local row, server payload가 서로 맞는지 비교한다.
5. delete/deactivation 문제라면 soft delete와 cleanup safety를 확인한다.
6. server drift라면 auth와 user ownership filter를 확인한다.

## <a id="api-endpoint"></a>API endpoint 추가

server route와 client-facing API contract를 바꿀 때 사용한다.

1. `packages/schema` request/response schema에서 시작한다.
2. route boundary에서 Zod로 request를 parse한다.
3. row를 읽거나 쓰기 전에 auth와 user ownership을 확인한다.
4. sync-owned create flow에서는 client-created ID를 보존한다.
5. client API hook/repository를 갱신하되 Data Layer routing을 우회하지 않는다.

## <a id="form-pattern"></a>Form 구현

client form과 manual input flow에 사용한다.

1. 기존 codebase가 쓰는 위치에서는 React Hook Form과 Zod resolver를 사용한다.
2. form-only state는 local로 두고, submit 시 request shape으로 변환한다.
3. 날짜/시간과 통화 표시는 shared utility를 사용한다.
4. offline/active/inactive 제한은 policy primitive로 표현한다.
5. mutation hook은 data work에 집중하고, screen은 UX와 policy display를 맡는다.

## <a id="datetime-utils"></a>날짜/시간 처리

1. 저장/전송 값은 timezone이 있는 ISO 8601 datetime string으로 유지한다.
2. format은 표시 boundary에서만 적용한다.
3. 새 formatter를 만들기 전에 shared datetime utility를 찾는다.
4. 분리된 form date/time field는 submit 시 ISO 값으로 결합한다.
5. persistence를 만질 때 SQLite/PostgreSQL field 의미를 확인한다.

## <a id="currency-utils"></a>통화/금액 표시

1. 표시는 `formatCurrencyDisplay`를 사용한다.
2. 통화별 묶음은 `groupExpensesByCurrency`를 사용한다.
3. 대표 통화가 필요할 때만 `getPrimaryCurrency`를 사용한다.
4. 새 제품 정책 없이 exchange-rate conversion을 추가하지 않는다.

## <a id="component-guide"></a>UI 컴포넌트 작성

1. 재사용 primitive는 `packages/ui`, domain component는 owning client slice에 둔다.
2. 외부 margin은 부모가 제어한다.
3. props type을 명시한다.
4. 날짜/통화 표시는 shared helper를 사용한다.
5. 새 blocked-state component를 만들기 전에 policy UI 패턴을 확인한다.

## 호환성

기존 [workflow map](../workflows/README.md)은 링크 호환성 때문에 남겨둔다. 새 반복 작업 안내는 이 런북에 추가한다.
