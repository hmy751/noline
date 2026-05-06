# Noline Harness Restructure Plan

> Temporary planning document for the Noline AI/developer harness restructure.
> Created on branch `docs/noline-harness-plan`, based on `main` (`503a4a5`).

## Purpose

This document is a handoff/checklist for future sessions. It exists so that a later Codex/Claude session, or a compacted conversation, does not misunderstand the intended work.

The goal is not to replace Noline's existing `.claude` materials with a new harness copied from another project. The goal is to add a safer reading structure on top of the existing materials, then gradually reduce the old root guide once the destination layers exist.

## Progress Log

2026-05-06 branch progress on `docs/noline-harness-plan`:

- `a834082` - added this restructure plan from `main` (`503a4a5`).
- `7c19516` - added `.claude` document map, harness map, guard map, and workflow map.
- `ea4a433` - added root/workspace `AGENTS.md -> CLAUDE.md` symlink bridges.
- `144db24` - refreshed current-guide contradictions and broken active references.
- `53f35ee` - reduced root `CLAUDE.md` to a navigation hub and recorded the harness decision.
- `af34a1c` - updated this plan's progress log after the first restructure pass.
- `fb7d95b` - fixed archived reference links without rewriting archive content.
- `b9a0195` - aligned workspace guide references after tooling map review.
- `3d44d97` - aligned active guide terminology and implementation paths after comparison with the prior harness branch.
- `7a88af3` - clarified current error handling/API/TypeScript guide behavior and marked client error infra as an expansion candidate.
- Follow-up pass - moved `.claude/doc-refactor-test.md` to `.claude/audits/` and updated the document role map.
- Follow-up pass - split legacy-heavy active guides into short current guides plus `_archive/` originals. This covered activation-system, selective-activation, policy, api-data, components, time, manual-input, form, and currency.

Implementation note: the prior `harness/noline-ai-guides` branch was used as reference material only. This branch recreated the structure cleanly from `main` instead of cherry-picking the old branch wholesale.

## Current Understanding

Noline already has a large documentation corpus.

- Root `CLAUDE.md` has been reduced from the older all-in-one guide into a navigation hub.
- `.claude/core/` and key `.claude/features/` files contain important active engineering policy.
- `.claude/guards/`, `.claude/workflows/`, and `.claude/harness/` now provide map layers on top of the existing corpus.
- `.claude/decisions/`, `.claude/sessions/`, `.claude/implementation/`, `CHANGELOG.md`, `.claude/references/`, `.claude/audits/`, and `.claude/_archive/` contain evidence, source, audit/test material, history, or older context.
- The first active-guide stale pass is complete. Future drift should still be fixed carefully against the code.
- Legacy-heavy active guides have been split: current paths now stay short, while long rollout/history/web-pattern material is preserved in `_archive/`.
- Current checked-out branch before this planning branch was `harness/noline-ai-guides`, which already explores a possible direction. Treat it as reference material, not as the unquestioned final answer.

## Borrowed Ideas

Use these projects as references, but translate their patterns into Noline's needs.

| Source | What To Borrow | What Not To Copy Blindly |
| --- | --- | --- |
| `dev-hub` | `AGENTS.md -> CLAUDE.md` bridge, tool boundary thinking, protected-source mindset | Its folder ownership table as-is; Noline is an app/codebase, not a personal knowledge vault |
| `blog` | Root as a short map, owner documents for criteria, guard/workflow/decision separation, thin agents | Writing-specific agents/lenses or editorial flow wording |
| `ai-note` | Avoid turning one discomfort into a thick rule or agent too quickly; preserve observations first | Treating every harness decision as open-ended forever |

## Non-Negotiable Safety Rules

- Do not delete existing `.claude` documents in the first restructure pass.
- Do not bulk-move large documents before their role is documented.
- Do not treat `decisions/`, `sessions/`, `implementation/`, `references/`, or `_archive/` as current policy unless an active guide points to them.
- Do not rewrite historical documents just to remove old terminology. Old terms like `Echo Protocol`, `Offline-Prep`, and `Local-First` can remain in history if the document is clearly historical.
- Do not auto-port Claude commands into Codex commands.
- Do not create local agents or skills until repeated use proves the shape.
- Keep runtime code untouched unless a later task explicitly asks for code changes.

## Document Role Model

Use this role model before editing or moving anything.

| Role | Meaning | Likely Locations | Default Action |
| --- | --- | --- | --- |
| Active source | Current engineering policy or implementation guidance | `.claude/core/`, key `.claude/features/`, workspace `CLAUDE.md` files | Preserve, link from maps, fix stale wording carefully |
| Guard | A high-cost rule that should be checked before/after code changes | New `.claude/guards/README.md` | Add as a map, not a full duplicate of source docs |
| Workflow | Repeated task starting sequence | New `.claude/workflows/README.md` | Add start order and source links only |
| Harness map | AI/developer documentation ownership and Claude/Codex bridge rules | New `.claude/harness/README.md` | Keep short and structural |
| Evidence/history | Why decisions happened, implementation trails, trackers, change history | `.claude/decisions/`, `.claude/sessions/`, `.claude/implementation/`, `CHANGELOG.md` | Preserve, mark as evidence/history |
| Reference/source | PRD, wireframes, image notes, source material | `.claude/references/` | Preserve, mark as reference/source |
| Archive | Old architecture or deprecated implementation guidance | `.claude/_archive/` | Preserve, keep out of active reading path |
| Audit/test | Harness or doc quality tests | Example: `.claude/audits/doc-refactor-test.md` | Preserve as audit evidence; do not read as active policy |
| Claude-only command | Claude command reference | `.claude/commands/` | Preserve, label as Claude-specific |

## Completed Work Order

This section replaces the original unchecked work plan. A later session should not restart these phases unless it intentionally wants a new pass.

| Phase | Status | Evidence |
| --- | --- | --- |
| Baseline and inventory | Complete | Started from `main` (`503a4a5`), compared with `harness/noline-ai-guides`, ran stale-term and link scans. |
| Map layers | Complete | `.claude/README.md`, `.claude/harness/README.md`, `.claude/guards/README.md`, `.claude/workflows/README.md`. |
| Claude/Codex bridges | Complete | Root and workspace `AGENTS.md -> CLAUDE.md` symlinks. |
| Active-guide stale fixes | Complete for this pass | Currency/manual input, policy links, offline map/routing paths, Activation Router terminology, error/API/TypeScript currentness. |
| Legacy-heavy active guide split | Complete for this pass | Current short guides were added at the original active paths; older long guides were preserved under `.claude/_archive/`. |
| Root guide reduction | Complete | Root `CLAUDE.md` is now a navigation hub. |
| Decision record | Complete | `.claude/decisions/2026-05-06-ai-harness-restructure.md`. |
| Audit/test classification | Complete | `.claude/audits/README.md` and `.claude/audits/doc-refactor-test.md`. |
| Verification | Complete for this pass | Active markdown link scan, stale active-term scan, symlink check, `tooling-map-auditor` review. |

## Completed Commit Slices

Commits were kept small so the branch can be compared or partially reverted later.

1. `docs: add noline harness restructure plan`
2. `docs: add noline harness maps`
3. `docs: add codex guide symlinks`
4. `docs: refresh active guide references`
5. `docs: shrink root guide and record harness decision`
6. `docs: align active guide terminology`
7. `docs: clarify current error handling guide`
8. `docs: classify doc audit notes`
9. `docs: split current guides from archived legacy material`

## Open Questions

- Resolved in follow-up pass: `.claude/doc-refactor-test.md` became `.claude/audits/doc-refactor-test.md`.
- Resolved in follow-up pass: `.claude/features/activation-system.md` is now a short active guide, and the old rollout/history content is `_archive/activation-system-rollout-history.md`.
- Should Noline eventually have a thin `noline-policy-checker` report-only agent?
- Should Noline eventually have a `noline-context-collector`, or is the global `gather-context` enough?
- Resolved in this pass: use the existing `harness/noline-ai-guides` branch as reference, but recreate cleanly from `main`.

## Hand-Off Summary

If a later session sees only this file, proceed conservatively:

1. Do not restart the completed restructure phases without checking `git log main..HEAD`.
2. Do not delete existing documentation just because it contains old terminology.
3. Treat `.claude/core/`, key `.claude/features/`, root/workspace `CLAUDE.md`, `guards/`, and `workflows/` as the active path.
4. Treat decisions, sessions, implementation notes, audits, references, and archive as evidence/history/source unless an active guide points there.
5. Fix future drift in active guides by comparing against code first.
6. Keep agents/skills as candidates until repeated real use proves them.
