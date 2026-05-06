# Noline Harness Restructure Handoff

> 2026-05-06 handoff for branch `docs/noline-harness-plan`.
> This is an audit/session continuity note, not active policy.

## Why This Exists

The temporary root planning file `NOLINE_HARNESS_RESTRUCTURE_PLAN.md` was committed early in this branch to keep the restructure understandable across sessions. Its planning role is now complete, so the root file was removed. This handoff preserves only the context a later Claude/Codex session needs to avoid restarting or misreading the work.

## Branch Context

- Branch: `docs/noline-harness-plan`
- Base used when the plan was created: `main` at `503a4a5`
- Original temporary plan commit: `a834082 docs: add noline harness restructure plan`
- Latest branch state at this handoff: terminology cleanup has been committed as `f93ca23 docs: align terminology references`
- Reference branch used for comparison only: `harness/noline-ai-guides`

The branch recreated the structure cleanly from `main` instead of cherry-picking the older reference branch wholesale.

## Completed Work

- Added `.claude` document map, harness map, guard map, and workflow map.
- Added Codex bridges with `AGENTS.md -> CLAUDE.md` symlinks at root and major workspaces.
- Reduced root `CLAUDE.md` into a navigation hub.
- Recorded the harness decision in `.claude/decisions/2026-05-06-ai-harness-restructure.md`.
- Classified audits and Claude command references so they are not read as active policy.
- Fixed broken active references and stale active terminology against current code.
- Split legacy-heavy active guides into short current guides while preserving old full material under `.claude/_archive/`.
- Preserved history/session/decision/archive terminology instead of rewriting old records.
- Aligned current terminology in active docs and code comments with `.claude/decisions/2026-03-21-terminology-unification.md`.

## Current Reading Model

Use active docs for current implementation work:

- Root `CLAUDE.md`
- Workspace `CLAUDE.md` files
- `.claude/README.md`
- `.claude/harness/README.md`
- `.claude/guards/README.md`
- `.claude/workflows/README.md`
- `.claude/core/`
- Key `.claude/features/`

Treat these as evidence/history/source unless an active guide explicitly promotes a rule:

- `.claude/decisions/`
- `.claude/sessions/`
- `.claude/implementation/`
- `.claude/references/`
- `.claude/audits/`
- `.claude/_archive/`
- `.claude/CHANGELOG.md`

`.claude/commands/` is Claude command reference material. It is not a Codex command source and should not be ported automatically.

## Safety Notes For Later Sessions

1. Do not restart the completed restructure phases without first checking `git log main..HEAD`.
2. Do not delete existing documentation just because it contains old terminology.
3. Do not rewrite history, sessions, decisions, implementation notes, references, or archive only to modernize terms.
4. If an active guide conflicts with code, verify against code first and then patch the active guide narrowly.
5. Keep runtime code changes out of this harness branch unless the user explicitly asks for implementation work.
6. Keep local agents/skills as candidates until repeated use proves their shape.

## Remaining Work

The main restructure is complete. Remaining work is limited to merge-readiness and optional future passes:

- Run final verification before merging:
  - active markdown link scan
  - stale active-term scan
  - symlink check
  - `git diff --check`
  - runtime-code-change check
- Decide whether this branch should be merged, squashed, or further split.
- Optional later passes can review medium-risk active guides when those areas are touched:
  - `.claude/core/architecture.md`
  - `.claude/core/typescript.md`
  - `.claude/features/offline-map.md`
  - `.claude/features/offline-routing.md`
  - workspace `CLAUDE.md` files

## Future Candidates

These remain candidates, not active tools:

- `noline-context-collector`: report-only context collector for feature/bug work.
- `noline-policy-checker`: report-only checker for Router, transaction, schema-first, Client-Side ID, ISO time, auth ownership, and soft-delete drift.
- `noline-harness-observer`: report-only observer for large harness changes.

