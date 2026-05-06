# Noline `.claude` Corpus Inventory

> 2026-05-06 follow-up audit for the Noline harness restructure branch.
> This file is an audit/planning artifact, not active policy.

## Working Rule

- History is preserved. `sessions/`, `decisions/`, `implementation/`, `CHANGELOG.md`, `references/`, `_archive/`, and `audits/` are evidence/source/history unless an active guide explicitly promotes a rule.
- Old material is not deleted outright. If it is no longer safe as active guidance, move it to `_archive/` or classify it under `audits/`.
- Active documents may be edited when they conflict with code, current terminology, or the role model.
- Claude commands remain Claude-only references. They can be labeled or archived, but they are not copied into Codex rules.

## Current Corpus Roles

| Area | Current role | Stale risk | Default action |
| --- | --- | --- | --- |
| `CLAUDE.md` | Root navigation hub | Low | Keep short; link out to owner docs. |
| workspace `CLAUDE.md` files | App/package owner guides | Medium | Keep active; verify examples against code when touched. |
| `.claude/README.md` | Document map | Low | Keep as entrypoint for role decisions. |
| `.claude/harness/README.md` | AI/developer harness ownership | Low | Update when bridge or layer ownership changes. |
| `.claude/guards/README.md` | High-cost guard map | Low | Keep concise; link to source docs. |
| `.claude/workflows/README.md` | Repeated task entrypoints | Low | Keep concise; link to source docs. |
| `.claude/core/architecture.md` | Active FSD/root architecture guide | Medium | Keep active; examples should use real Noline paths. |
| `.claude/core/selective-activation-architecture.md` | Current Data Layer/Router guide | Low | Keep active and short; archived v2 guide owns long rollout/history notes. |
| `.claude/core/policy-architecture.md` | Current Policy Layer guide | Low | Keep active and short; archived v3 rollout owns phase/checklist history. |
| `.claude/core/time.md` | Current time/date guide | Low | Keep active and short; archived complete guide owns web/input history. |
| `.claude/core/typescript.md` | Active TypeScript/Zod guide | Medium | Keep active; prefer React Native/Expo examples. |
| `.claude/core/api-data.md` | Current API/data guide | Low | Keep active and short; archived legacy guide owns web/custom-error examples. |
| `.claude/core/components.md` | Current React Native component guide | Low | Keep active and short; archived legacy guide owns web/Next examples. |
| `.claude/core/error-handling.md` | Current error-handling baseline | Low | Keep active and short; archived blueprint owns old central-error design. |
| `.claude/features/activation-system.md` | Current Activation System guide | Low | Keep active and short; archived rollout history owns phase/checklist notes. |
| `.claude/features/offline-map.md` | Active feature guide | Medium | Keep active; verify paths against code when touched. |
| `.claude/features/offline-routing.md` | Active feature guide | Medium | Keep active; verify map component names against code when touched. |
| `.claude/features/currency.md` | Current currency policy guide | Low | Keep active and short; archived guide owns legacy display examples. |
| `.claude/features/manual-input.md` | Current manual input guide | Low | Keep active and short; archived rollout owns phase history. |
| `.claude/features/form.md` | Current React Native form guide | Low | Keep active and short; archived guide owns legacy web phrasing. |
| `.claude/commands/` | Claude-only command references | High | Add/keep labels; do not use as active Codex workflow. |
| `.claude/audits/` | Audit/test evidence | Low | Preserve; never read as active policy. |
| `.claude/decisions/` | Decision evidence | Low | Preserve; update only with new decisions or explicit corrections. |
| `.claude/sessions/` | Session history | Low | Preserve. |
| `.claude/implementation/` | Trackers/test history | Medium | Preserve; verify completion status against code. |
| `.claude/references/` | Product/source material | Medium | Preserve; active policy wins on implementation conflicts. |
| `.claude/_archive/` | Deprecated historical guidance | Low | Preserve; do not reactivate without explicit decision. |

## Recommended Next Passes

### Pass 1. Label Mixed Active Documents

- Complete. High-risk active documents were first labeled before moving large legacy sections.

### Pass 2. Split Candidates

- Complete. The active paths now contain short current guides, while the older long guides are preserved in `_archive/`.
- Split docs: activation-system, selective-activation, policy-architecture, api-data, components, time, manual-input, form, currency.
- Resolved: `core/error-handling.md` is now a short current baseline guide, and the old long blueprint is preserved as `_archive/client-error-infra-blueprint.md`.

### Pass 3. Claude Command Hygiene

- Complete. `commands/README.md` explains Claude-only status and warns that examples may contain historical paths.
- Command source lists should only be updated if Claude commands are still actively used.

## Archive Rule

Use `_archive/` when a document or section is no longer safe as current guidance but still contains useful history. Prefer a small stub in the original location only if many links point there. Use `audits/` when the content is a test, critique, inventory, or verification note rather than product/architecture history.
