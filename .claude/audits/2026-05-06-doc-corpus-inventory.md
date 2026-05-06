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
| `.claude/core/selective-activation-architecture.md` | Active Data Layer/Router guide | Medium | Keep active; avoid reintroducing old Echo/Offline-Prep terms except as history notes. |
| `.claude/core/policy-architecture.md` | Active Service Layer/policy guide | Medium | Keep active; verify import paths when touched. |
| `.claude/core/time.md` | Active time/date guide | Medium | Keep active; web/FormData examples should be treated as pattern examples, not copy-paste code. |
| `.claude/core/typescript.md` | Active TypeScript/Zod guide | Medium | Keep active; prefer React Native/Expo examples. |
| `.claude/core/api-data.md` | Active API/data guide | High | Keep active, but continue replacing legacy web/custom-error examples with current Noline examples. |
| `.claude/core/components.md` | Mixed active component principles + legacy web examples | High | Keep active for principles; split or archive web-heavy sections in a later pass. |
| `.claude/core/error-handling.md` | Current error-handling baseline | Low | Keep active and short; archived blueprint owns old central-error design. |
| `.claude/features/activation-system.md` | Mixed current feature guide + rollout/history checklist | High | Split candidate: current guide vs rollout/history notes. |
| `.claude/features/offline-map.md` | Active feature guide | Medium | Keep active; verify paths against code when touched. |
| `.claude/features/offline-routing.md` | Active feature guide | Medium | Keep active; verify map component names against code when touched. |
| `.claude/features/currency.md` | Active feature guide | Medium | Keep active; web display examples may need RN rewrite later. |
| `.claude/features/manual-input.md` | Active feature guide | Medium | Keep active; status wording already refreshed once. |
| `.claude/features/form.md` | Active form guide, short/generic | Medium | Keep active; verify examples before expanding. |
| `.claude/commands/` | Claude-only command references | High | Add/keep labels; do not use as active Codex workflow. |
| `.claude/audits/` | Audit/test evidence | Low | Preserve; never read as active policy. |
| `.claude/decisions/` | Decision evidence | Low | Preserve; update only with new decisions or explicit corrections. |
| `.claude/sessions/` | Session history | Low | Preserve. |
| `.claude/implementation/` | Trackers/test history | Medium | Preserve; verify completion status against code. |
| `.claude/references/` | Product/source material | Medium | Preserve; active policy wins on implementation conflicts. |
| `.claude/_archive/` | Deprecated historical guidance | Low | Preserve; do not reactivate without explicit decision. |

## Recommended Next Passes

### Pass 1. Label Mixed Active Documents

- Add a short status note to high-risk active documents.
- Make clear whether a document is current baseline, extension candidate, rollout history, or pattern-only example.
- Do not move large sections until the labels make the split obvious.

### Pass 2. Split Candidates

- `features/activation-system.md`: keep current Activation Router behavior in place; move rollout/checklist history to a separate history or archive file if it keeps confusing active work.
- `core/components.md`: keep React Native component principles; archive or rewrite web/Next-heavy examples.
- Resolved: `core/error-handling.md` is now a short current baseline guide, and the old long blueprint is preserved as `_archive/client-error-infra-blueprint.md`.

### Pass 3. Claude Command Hygiene

- Add a `commands/README.md` explaining Claude-only status.
- Mark command examples as templates that can contain historical paths.
- Update command source lists only if Claude commands are still actively used.

## Archive Rule

Use `_archive/` when a document or section is no longer safe as current guidance but still contains useful history. Prefer a small stub in the original location only if many links point there. Use `audits/` when the content is a test, critique, inventory, or verification note rather than product/architecture history.
