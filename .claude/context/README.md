# Noline Context Map

Context documents preserve deeper explanations, implementation background, edge cases, and historical rationale. They are opened on demand; they are not startup memory.

## Reading Model

- Use [rules](../rules/README.md) for compact, verifiable instructions.
- Use [runbooks](../runbooks/README.md) for repeated task flow.
- Use this context map when a rule or runbook needs deeper explanation.
- Verify behavior-sensitive context against code before changing current guidance.

## Current Context Sources

During this pass, the existing `core/` and `features/` paths remain in place to avoid link churn. Treat them as deep context and compatibility sources rather than the center of the harness.

| Topic | Context source | Start with rule/runbook |
| --- | --- | --- |
| Architecture and FSD | [core/architecture.md](../core/architecture.md) | [Runbooks](../runbooks/README.md) |
| <a id="selective-activation-and-router"></a>Selective Activation and Router | [core/selective-activation-architecture.md](../core/selective-activation-architecture.md), [features/activation-system.md](../features/activation-system.md) | [Activation Router rule](../rules/activation-router.md) |
| API/Data/query key/repository | [core/api-data.md](../core/api-data.md) | [Add API Endpoint](../runbooks/README.md#api-endpoint) |
| <a id="policy-layer"></a>Policy Layer | [core/policy-architecture.md](../core/policy-architecture.md) | [Policy UI rule](../rules/policy-ui.md) |
| <a id="time-and-date"></a>Time and date | [core/time.md](../core/time.md) | [ISO Time rule](../rules/iso-time.md) |
| TypeScript and Zod | [core/typescript.md](../core/typescript.md) | [Schema First rule](../rules/schema-first.md) |
| <a id="components"></a>Components | [core/components.md](../core/components.md) | [Build UI Components](../runbooks/README.md#component-guide) |
| Error handling | [core/error-handling.md](../core/error-handling.md) | Workspace guide for the code owner |
| <a id="offline-map"></a>Offline map | [features/offline-map.md](../features/offline-map.md) | Client workspace guide |
| <a id="offline-routing"></a>Offline routing | [features/offline-routing.md](../features/offline-routing.md) | [Debug Sync Issues](../runbooks/README.md#sync-debug) if sync-owned data is involved |
| <a id="currency"></a>Currency | [features/currency.md](../features/currency.md) | [Display Currency/Amounts](../runbooks/README.md#currency-utils) |
| <a id="forms-and-manual-input"></a>Forms and manual input | [features/form.md](../features/form.md), [features/manual-input.md](../features/manual-input.md) | [Implement Forms](../runbooks/README.md#form-pattern) |

## Archive Boundary

Use [_archive](../_archive/) when a document or section is useful history but unsafe as current guidance. Prefer a small compatibility note at the old path if many active links still point there.

Do not move common context into `.agents/` or `.codex/` just to make the path look tool-neutral. Create those surfaces only when a concrete bridge or tool behavior requires them.
