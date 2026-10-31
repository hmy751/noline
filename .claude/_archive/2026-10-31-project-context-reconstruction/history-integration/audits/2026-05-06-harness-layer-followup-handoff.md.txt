# Noline Harness Layer Follow-up Handoff

> 2026-05-06 follow-up handoff for branch `docs/harness-doc-prune`.
> This is an audit/session continuity note, not active policy.

## Why This Exists

The temporary root file `NOLINE_DEV_HARNESS_REDESIGN_PLAN.md` was used as a checkpoint while the follow-up harness layer work was in progress. Its planning role is now complete, so the root file was removed. This note preserves the useful re-entry context without leaving a temporary plan in the repository root.

## Branch Context

- Branch: `docs/harness-doc-prune`
- Base: `main` after `docs/noline-harness-restructure` was merged.
- Current shape before this migration pass: 6 commits ahead of `main`.
- Original temporary plan commit: `ac797e2 docs: add harness redesign checkpoint plan`
- Follow-up decision source: [../decisions/2026-05-06-harness-layer-model.md](../decisions/2026-05-06-harness-layer-model.md)

Use `git log --oneline main..HEAD` for the exact current branch history. Do not infer that the old root plan file is missing by accident; it was intentionally replaced by this audit handoff.

## Completed Work

- Added `.claude/rules/` as compact, verifiable task/path rules.
- Added `.claude/runbooks/` as the active repeated-task entry surface.
- Added `.claude/context/` as the deep context owner.
- Moved the former `core/` and `features/` material into `.claude/context/` so the old directories no longer remain as active sources.
- Changed `.claude/workflows/README.md` into a compatibility redirect to `runbooks/`.
- Updated root and workspace `CLAUDE.md` files to route through `rules/`, `runbooks/`, and `context`.
- Recorded the layer model decision in `.claude/decisions/2026-05-06-harness-layer-model.md`.
- Kept `.agents/`, `.codex/`, `.claude/agents/`, and `.claude/skills/` uncreated because no concrete local tool need was proven.
- Removed the temporary root planning file after preserving this continuity context.

## Current Reading Model

Use active docs for current implementation work:

- Root `CLAUDE.md`
- Workspace `CLAUDE.md` files
- `.claude/README.md`
- `.claude/harness/README.md`
- `.claude/rules/README.md`
- `.claude/guards/README.md`
- `.claude/runbooks/README.md`
- `.claude/context/README.md`

Read `.claude/context/` for deep architecture and feature context unless an active guide explicitly promotes a shorter rule.

Treat these as evidence/history/source unless an active guide explicitly promotes a rule:

- `.claude/decisions/`
- `.claude/sessions/`
- `.claude/_archive/implementation/`
- `.claude/_archive/references/`
- `.claude/audits/`
- `.claude/_archive/`
- `.claude/CHANGELOG.md`

`.claude/commands/` remains Claude command reference material. It is not a Codex command source and should not be ported automatically.

## Validation Performed

- `git diff --check` and `git diff --cached --check` passed for this migration pass.
- Local Markdown path scan passed for 78 Markdown files after excluding Claude command template examples.
- Root and major workspace `AGENTS.md -> CLAUDE.md` symlinks were preserved.
- `.agents/`, `.codex/`, `.claude/agents/`, and `.claude/skills/` were not created.
- Earlier in the branch, `tooling-map-auditor` reported no must-fix bridge issue. It did call out that the temporary root plan should be removed or relocated before merge; this handoff resolves that.

## Commit Message Convention

The previously untracked file `.claude/decisions/2026-05-06-commit-message-convention.md` has been incorporated into this branch's harness surface. The short operational rule now lives in `.claude/harness/README.md`, while the decision record preserves the reason and consequences.

## Remaining Work

Before merge:

- Run final verification again after any additional edits.
- Decide whether the branch should be pushed as-is, squashed, or split.

Not needed now:

- No runtime code changes.
- No local Noline agent or skill.
- No `.codex/` or `.agents/` surface without a concrete repeated use case.
