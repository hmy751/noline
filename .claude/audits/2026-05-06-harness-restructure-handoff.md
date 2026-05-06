# Noline Harness Restructure Handoff

> 2026-05-06 handoff for branch `docs/noline-harness-plan`.
> This is an audit/session continuity note, not active policy.

## Why This Exists

The temporary root planning file `NOLINE_HARNESS_RESTRUCTURE_PLAN.md` was committed early in this branch to keep the restructure understandable across sessions. Its planning role is now complete, so the root file was removed. This handoff preserves only the context a later Claude/Codex session needs to avoid restarting or misreading the work.

## Branch Context

- Branch: `docs/noline-harness-plan`
- Base used when the plan was created: `main` at `503a4a5`
- Original temporary plan commit: `a834082 docs: add noline harness restructure plan`
- Temporary root plan removal commit: `d6d5a91 docs: move harness handoff into audits`
- Reference branch used for comparison only: `harness/noline-ai-guides`

The branch recreated the structure cleanly from `main` instead of cherry-picking the older reference branch wholesale.

Use `git log --oneline main..HEAD` for the exact current branch history. Do not infer that the old root plan file is missing by accident; it was intentionally replaced by this audit handoff.

## How To Resume

Start a later session with this order:

1. Run `git status -sb` and confirm the branch is `docs/noline-harness-plan`.
2. Run `git log --oneline main..HEAD` to see whether more commits were added after this handoff.
3. Read root `CLAUDE.md`, `.claude/README.md`, and `.claude/harness/README.md` for the current active reading path.
4. Use this handoff only to understand what the branch already did and what remains.
5. If editing active docs, compare the relevant guide against code before changing wording.

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
- Removed the temporary root planning file after preserving continuity context here.

## Commit Story

The commits were intentionally kept small so reviewers can compare, split, or revert narrow slices:

| Area | Representative commits |
| --- | --- |
| Initial planning and maps | `a834082`, `7c19516` |
| Claude/Codex bridge | `ea4a433` |
| Active reference and terminology cleanup | `144db24`, `3d44d97`, `f93ca23` |
| Root guide reduction and decision record | `53f35ee` |
| Archive/reference hygiene | `fb7d95b`, `4767af2`, `4c703be` |
| Workspace guide alignment | `b9a0195` |
| Error/API/TypeScript currentness | `7a88af3`, `d9fb612`, `ce5b7cc` |
| Audit and corpus inventory | `6cb07b5`, `db54e42`, `bfed95e`, `ddfbb76` |
| Legacy-heavy guide split | `018de91` |
| Root plan removal and handoff relocation | `d6d5a91` |

The exact list may grow after this note; always check `git log`.

## Important Files Created Or Reclassified

- `.claude/README.md`: document role map and active reading order.
- `.claude/harness/README.md`: Claude/Codex bridge and harness ownership rules.
- `.claude/guards/README.md`: high-cost policy map.
- `.claude/workflows/README.md`: repeated task entrypoints.
- `.claude/audits/README.md`: explains audit material is not active policy.
- `.claude/audits/2026-05-06-doc-corpus-inventory.md`: corpus inventory and stale-risk map.
- `.claude/audits/2026-05-06-harness-restructure-handoff.md`: this re-entry note.
- `.claude/_archive/`: preserves long legacy guide material that used to live in active paths.

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

## Preservation Decisions

- Existing documents were not deleted just because they were old.
- Long legacy content that was unsafe as current guidance was moved to `_archive/`.
- Active paths that many links already target were kept, but rewritten as short current guides.
- History folders keep historical terminology. Old names like `Echo Protocol`, `Offline-Prep`, or broad `Local-First` can remain there.
- The root `NOLINE_HARNESS_RESTRUCTURE_PLAN.md` was an exception: it was explicitly temporary and has now been replaced by this handoff note.

## Validation Already Performed

Earlier branch passes included:

- active markdown link scans
- stale active-term scans
- symlink checks for root/workspace `AGENTS.md -> CLAUDE.md`
- `git diff --check`
- runtime-code-change checks for doc-only commits
- tooling-map-auditor review after major harness restructuring

Run these again before merge, because this handoff may not be the final commit on the branch.

## Safety Notes For Later Sessions

1. Do not restart the completed restructure phases without first checking `git log main..HEAD`.
2. Do not delete existing documentation just because it contains old terminology.
3. Do not rewrite history, sessions, decisions, implementation notes, references, or archive only to modernize terms.
4. If an active guide conflicts with code, verify against code first and then patch the active guide narrowly.
5. Keep runtime code changes out of this harness branch unless the user explicitly asks for implementation work.
6. Keep local agents/skills as candidates until repeated use proves their shape.

## Remaining Work

The main restructure is complete. Remaining work is limited to merge-readiness and optional future passes.

Highest priority before merge:

- Run final verification:
  - active markdown link scan
  - stale active-term scan
  - symlink check
  - `git diff --check`
  - runtime-code-change check
- Decide whether this branch should be merged, squashed, or further split.
- Re-run tooling-map-auditor if more harness/bridge files are changed after this point.

Lower priority, only when relevant code areas are touched:

- Review medium-risk active guides:
  - `.claude/core/architecture.md`
  - `.claude/core/typescript.md`
  - `.claude/features/offline-map.md`
  - `.claude/features/offline-routing.md`
  - workspace `CLAUDE.md` files
- Compare these guides against current code before doing any wording cleanup.

Not needed now:

- No local `noline-*` agent or skill has been created.
- No Claude command should be converted to Codex automatically.
- No historical terminology cleanup is needed in archive/history folders.

## Future Candidates

These remain candidates, not active tools:

- `noline-context-collector`: report-only context collector for feature/bug work.
- `noline-policy-checker`: report-only checker for Router, transaction, schema-first, Client-Side ID, ISO time, auth ownership, and soft-delete drift.
- `noline-harness-observer`: report-only observer for large harness changes.
