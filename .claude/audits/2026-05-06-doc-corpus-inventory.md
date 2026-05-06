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
| `.claude/rules/README.md` | Compact task/path rule map | Low | Keep short and verifiable; link to context for deeper detail. |
| `.claude/guards/README.md` | High-cost guard map | Low | Keep concise; link to source docs. |
| `.claude/runbooks/README.md` | Repeated task entrypoints | Low | Keep concise; link to rules/context/source docs. |
| `.claude/context/README.md` | Deep context map | Low | Keep as the entrypoint for deep architecture and feature context. |
| `.claude/workflows/README.md` | Compatibility redirect for old workflow links | Low | Do not add new workflow content; point to `runbooks/`. |
| `.claude/context/architecture.md` | FSD/root architecture context | Medium | Preserve as deep context; examples should use real Noline paths. |
| `.claude/context/selective-activation-architecture.md` | Data Layer/Router context | Low | Preserve as deep context; compact rule lives in `rules/`. |
| `.claude/context/policy-architecture.md` | Policy Layer context | Low | Preserve as deep context; compact rule lives in `rules/`. |
| `.claude/context/time.md` | Time/date context | Low | Preserve as deep context; compact rule lives in `rules/`. |
| `.claude/context/typescript.md` | TypeScript/Zod context | Medium | Preserve as deep context; compact rule lives in `rules/`. |
| `.claude/context/api-data.md` | API/data context | Low | Preserve as deep context; runbooks link to it when needed. |
| `.claude/context/components.md` | React Native component context | Low | Preserve as deep context; workspace guide owns local specifics. |
| `.claude/context/error-handling.md` | Error-handling context | Low | Preserve as deep context. |
| `.claude/context/activation-system.md` | Activation System context | Low | Preserve as deep context; archived rollout history owns phase/checklist notes. |
| `.claude/context/offline-map.md` | Offline map feature context | Medium | Preserve as deep context; verify paths against code when touched. |
| `.claude/context/offline-routing.md` | Offline routing feature context | Medium | Preserve as deep context; verify map component names against code when touched. |
| `.claude/context/currency.md` | Currency policy context | Low | Preserve as deep context; archived guide owns legacy display examples. |
| `.claude/context/manual-input.md` | Manual input context | Low | Preserve as deep context; archived rollout owns phase history. |
| `.claude/context/form.md` | React Native form context | Low | Preserve as deep context; archived guide owns legacy web phrasing. |
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
- Resolved: `context/error-handling.md` is now a short current baseline guide, and the old long blueprint is preserved as `_archive/client-error-infra-blueprint.md`.

### Pass 3. Claude Command Hygiene

- Complete. `commands/README.md` explains Claude-only status and warns that examples may contain historical paths.
- Command source lists should only be updated if Claude commands are still actively used.

### Pass 4. Layer Model Follow-Up

- Complete. `rules/`, `runbooks/`, and `context/` now define the active harness entry layers.
- Former `core/` and `features/` docs were moved into `context/`, so deep context has a single owner directory.
- `workflows/` is retained as a compatibility redirect while `runbooks/` owns repeated task entrypoints.
- The temporary root follow-up plan was removed after preserving continuity context in [2026-05-06-harness-layer-followup-handoff.md](2026-05-06-harness-layer-followup-handoff.md).

## Archive Rule

Use `_archive/` when a document or section is no longer safe as current guidance but still contains useful history. Prefer updating links into `context/`; leave a compatibility stub only when a live path is intentionally kept. Use `audits/` when the content is a test, critique, inventory, or verification note rather than product/architecture history.
