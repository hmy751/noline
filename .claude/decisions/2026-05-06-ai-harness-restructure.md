# Decision: AI Harness Restructure

> Date: 2026-05-06
> Status: Accepted
> Scope: Noline AI/developer documentation harness

## Context

Noline had a large and useful documentation corpus, but the root `CLAUDE.md` had grown into an older all-in-one guide. It mixed project identity, task checklists, architecture summaries, pitfalls, completed feature history, commands, and links into one long reading path.

That made two things risky:

- A future AI/developer session could treat historical or reference material as current policy.
- A cleanup could accidentally delete useful `.claude` material because the target role of each document was unclear.

Reference projects suggested useful patterns:

- `dev-hub`: explicit Claude/Codex bridge and tool-boundary thinking.
- `blog`: short root map, separate guard/workflow/decision layers, thin future agents.
- `ai-note`: preserve observations before turning them into thick rules or agents.

## Decision

Restructure Noline's harness by adding a reading structure around existing material before reducing the root guide.

The new structure is:

- `.claude/README.md`: document role map for the whole `.claude` corpus.
- `.claude/harness/README.md`: Claude/Codex bridge and layer ownership.
- `.claude/guards/README.md`: high-cost rule map.
- `.claude/workflows/README.md`: repeated task entry points.
- `AGENTS.md -> CLAUDE.md` symlinks at root and major workspaces.
- Root `CLAUDE.md`: short navigation hub and core invariants only.

## Preserved Material

Existing `.claude` documents were not deleted in this pass.

- `core/` and key `features/` remain active sources.
- `decisions/`, `sessions/`, `implementation/`, `CHANGELOG.md`, `references/`, and `_archive/` remain evidence, source, history, or archive.
- `.claude/commands/` remains Claude-specific command reference.
- `.claude/doc-refactor-test.md` remains in place for now and can later be classified as audit or archive.

## Minimal Refresh

Only current-guide contradictions and broken active links were fixed.

- Currency guide now treats `baseCurrency` as implemented.
- Manual Input guide no longer says Phase 3 is still planned.
- Active links that resolved to wrong paths were corrected.
- Active imports that pointed at the old `shared/hooks/useNetworkStatus` path were updated to `shared/store/network`.

## Non-Goals

- No runtime code changes.
- No mass rewrite of historical documents.
- No automatic conversion of Claude commands into Codex commands.
- No local Noline agents or skills yet.
- No deletion of old material just because it uses older terms.

## Consequences

Future sessions should start from the root guide, then use the document map, guard map, workflow map, and workspace guide appropriate to the task.

Future harness changes should add rules to the smallest owner document and record decisions here when the workflow itself changes.

If repeated use proves a local tool shape, Noline may later add a thin report-only context collector or policy checker. Until then, the owning documents remain the source of truth.
