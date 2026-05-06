# Noline Runbooks

Runbooks are repeated task entry points. They give the first checks and links for a task, without copying full architecture guides.

## Reading Model

1. Pick the task shape below.
2. Open the linked rule and workspace guide.
3. Use [Guard Map](../guards/README.md) before and after editing.
4. Read [Context Map](../context/README.md) only when the compact rule is not enough.

## Quick Task Table

| Task | First rules | Workspace/context |
| --- | --- | --- |
| [Add New Entity](#add-entity) | [Schema First](../rules/schema-first.md), [Client-Side ID](../rules/client-side-id.md), [Activation Router](../rules/activation-router.md) | [packages/schema](../../packages/schema/CLAUDE.md), [client](../../apps/client/CLAUDE.md), [server](../../apps/server/CLAUDE.md) |
| [Debug Sync Issues](#sync-debug) | [Activation Router](../rules/activation-router.md), [Transaction + Sync Queue](../rules/transaction-sync-queue.md) | [Selective Activation context](../context/README.md#selective-activation-and-router) |
| [Add API Endpoint](#api-endpoint) | [Schema First](../rules/schema-first.md), [Auth/User Scope](../rules/auth-user-scope.md), [Client-Side ID](../rules/client-side-id.md) | [server](../../apps/server/CLAUDE.md), [schema](../../packages/schema/CLAUDE.md) |
| [Implement Forms](#form-pattern) | [Schema First](../rules/schema-first.md), [Policy UI](../rules/policy-ui.md), [ISO Time](../rules/iso-time.md) | [Form context](../context/README.md#forms-and-manual-input) |
| [Work With Dates/Times](#datetime-utils) | [ISO Time](../rules/iso-time.md) | [Time context](../context/README.md#time-and-date) |
| [Display Currency/Amounts](#currency-utils) | No hard rule; use context first | [Currency context](../context/README.md#currency) |
| [Build UI Components](#component-guide) | [Policy UI](../rules/policy-ui.md) | [packages/ui](../../packages/ui/CLAUDE.md), [Component context](../context/README.md#components) |

## <a id="add-entity"></a>Add New Entity

Use for Trip/Schedule/Expense-like sync-owned Data Entities.

1. Define or update the Zod schema in `packages/schema`.
2. Infer types from the schema; avoid parallel DTOs.
3. Confirm create payload and server route accept client-created IDs.
4. Add client model, local datasource, remote API, repository routing, and data hook boundaries.
5. Put local DB mutation and `sync_queue` insert in the same transaction.
6. Check delete/list behavior for `deletedAt` and pending sync safety.
7. Verify server routes authenticate and scope user-owned data.

## <a id="sync-debug"></a>Debug Sync Issues

Use when a local/remote state, pending sync, activation, or deletion path is wrong.

1. Identify the trip, entity, activation state, and user.
2. Check whether Data Layer code bypassed the Activation Router.
3. Check local writes and `sync_queue` inserts share one transaction.
4. Compare queue rows with local rows and server payloads.
5. For delete/deactivation, check soft delete and cleanup safety.
6. For server drift, check auth and user ownership filters.

## <a id="api-endpoint"></a>Add API Endpoint

Use for server route changes and client-facing API contracts.

1. Start from `packages/schema` request/response schemas.
2. Parse requests with Zod at the route boundary.
3. Verify auth and user ownership before reading or mutating rows.
4. Preserve client-created IDs for sync-owned create flows.
5. Update client API hooks/repositories without bypassing Data Layer routing.

## <a id="form-pattern"></a>Implement Forms

Use for client forms and manual input flows.

1. Use React Hook Form and Zod resolver where the existing codebase does.
2. Keep form-only state local, then convert to request shape at submit.
3. Use shared date/time and currency utilities.
4. Use policy primitives for offline/active/inactive restrictions.
5. Keep mutation hooks focused on data work; screens own UX and policy display.

## <a id="datetime-utils"></a>Work With Dates/Times

1. Store/transmit ISO 8601 datetime strings with timezone.
2. Format only at display boundaries.
3. Use shared datetime utilities before adding new formatting code.
4. Convert separate form date/time fields into ISO at submit.
5. Check SQLite/PostgreSQL field semantics when touching persistence.

## <a id="currency-utils"></a>Display Currency/Amounts

1. Use `formatCurrencyDisplay` for display.
2. Use `groupExpensesByCurrency` when grouping by currency.
3. Use `getPrimaryCurrency` only when a representative currency is needed.
4. Do not add exchange-rate conversion without a new product policy.

## <a id="component-guide"></a>Build UI Components

1. Put reusable primitives in `packages/ui`; keep domain components in the owning client slice.
2. Let parents control external margin.
3. Type props explicitly.
4. Use shared date/currency display helpers.
5. Use policy UI patterns before adding new blocked-state components.

## Compatibility

The older [workflow map](../workflows/README.md) is kept as a compatibility entry while links migrate. New repeated-task guidance should be added here.
