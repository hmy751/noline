# Noline Harness Execution Record

> Created: 2026-05-06
> Branch: `docs/harness-execution-cleanup`
> Merged: PR #28 into `main`
> Scope: AI/developer harness cleanup and execution support

## Why This Exists

The previous harness branches already moved Noline from one large root guide into a layered model: root guide, workspace guides, rules, guards, runbooks, context, decisions, audits, sessions, and archive.

The remaining problem is operational clarity. Old branches, stale tracker paths, and unclear evidence folders make the harness feel unfinished even though the main layer model is already merged.

This file was the live root execution tracker for `docs/harness-execution-cleanup`. After PR #28 merged into `main`, it moved into `.claude/audits/` as the completed execution record.

## Current Decisions

- Delete stale local unmerged branches and restart from `main`.
- Archive `references/`; the remaining PRD and wireframe are old source material, not active startup context.
- Move stale implementation trackers and non-product reference guides into `_archive/`.
- Keep `decisions/`, `sessions/`, and `audits/` as evidence/history, not active policy.
- Do not create additional `.codex/`, `.agents/`, `.claude/agents/`, or `.claude/skills/` surfaces beyond the explicit execution layer unless another repeated local tool need is proven.
- Add an executable harness check so bridge and layer hygiene can be verified without re-reading all handoff notes.
- Keep the live root plan only during the PR, then move it to `.claude/audits/` after merge.
- Add the execution layer now that the missing repeated need is explicit: a thin dispatcher skill, report-only agents, and bridge parity checks.

## Execution Checklist

- [x] Delete local unmerged branches that should not be merged.
- [x] Delete stale remote-only unmerged README branch.
- [x] Remove stale broken worktrees and their merged random-name branches.
- [x] Create a new cleanup branch from `main`.
- [x] Archive stale `implementation/` trackers.
- [x] Archive the non-product React Native image reference.
- [x] Move old `references/` material into `_archive/references/`.
- [x] Add `scripts/check-harness.mjs`.
- [x] Add `pnpm harness:check`.
- [x] Run final verification after edits.
- [x] Move the root execution plan to `.claude/audits/` after merge.
- [x] Compare against `blog`, `dev-hub`, and current Claude/Codex harness docs.
- [x] Add `noline-work` dispatcher skill.
- [x] Add report-only `noline-context-collector`, `noline-policy-checker`, and `noline-harness-observer`.
- [x] Add Claude/Codex execution-layer bridge files.
- [x] Extend `pnpm harness:check` to validate execution-layer parity.

## Merge Outcome

- PR #28 merged into `main`.
- Merge commit: `8a9d5ca`.
- `main` was fast-forwarded to `origin/main` after merge.
- `pnpm harness:check` passed after the merge.

## Post-Merge Finalization

- The root execution tracker was moved from `NOLINE_HARNESS_EXECUTION_PLAN.md` to this audit record.
- Root `CLAUDE.md` now links to this file as a completed harness execution record, not an active plan.
- Workspace guides now state that each local `AGENTS.md` is a symlink bridge to the sibling `CLAUDE.md`.
- Workspace guides were slimmed from long implementation reference files into path-scoped harness entrypoints. Long feature details now route to `rules/`, `runbooks/`, and `context/`.
- The workspace guide contract is recorded in `.claude/decisions/2026-05-06-workspace-guide-harness-contract.md`.
- `scripts/check-harness.mjs` now treats new root `NOLINE_*PLAN*.md` files as cleanup debt instead of allowing the old temporary plan name.
- `scripts/check-harness.mjs` now checks the workspace guide contract and line-count guardrails.

PR #28 pass was considered complete because:

- `pnpm harness:check` passes.
- no active `.claude/references/` or `.claude/implementation/` directory exists.
- execution-layer skill/agent bridge parity passes.
- the former root plan no longer lives at repo root.

The post-merge finalization is considered complete when:

- workspace guides remain short path-scoped harness entrypoints.
- `pnpm harness:check` passes with workspace guide contract checks enabled.
- the final diff is committed or intentionally left as the current `main` working-tree change.

## Folder Role Target

| Area | Target role |
| --- | --- |
| `CLAUDE.md` / `AGENTS.md` | Root navigation and Codex bridge |
| `.claude/rules/` | Short, verifiable task/path rules |
| `.claude/guards/` | High-cost failure checks |
| `.claude/runbooks/` | Repeated task entrypoints |
| `.claude/context/` | Deep architecture and feature context |
| `.claude/skills/noline-work/` | Thin execution dispatcher |
| `.agents/skills/noline-work` | Codex skill bridge to the Claude skill source |
| `.claude/agents/` | Claude report-only execution agents |
| `.codex/agents/` | Codex report-only execution agents |
| `.claude/_archive/references/` | Old product/reference source |
| `.claude/decisions/` | Accepted decisions and rationale |
| `.claude/sessions/` | Historical design/implementation sessions |
| `.claude/audits/` | Verification notes and handoffs |
| `.claude/_archive/` | Deprecated or stale historical material |

## Final Harness Health Check

2026-05-06 finalization review uses five harness axes:

| Axis | Status | Notes |
| --- | --- | --- |
| Entrypoints | OK | Root guide stays a navigation hub. Workspace guides are short path-scoped entrypoints. |
| Owner separation | OK | Current policy lives in `rules/`, `guards/`, `runbooks/`, and `context/`; workspace guides route to those owners instead of copying long guidance. |
| Execution layer | OK | `noline-work` dispatches by task type and path. `noline-*` agents remain report-only role definitions, not automatic team runners. |
| Bridge parity | OK | Root/workspace `AGENTS.md` files are symlinks to sibling `CLAUDE.md`; `.agents/skills` and `.codex/agents` are checked by `pnpm harness:check`. |
| Maintenance gates | OK | `pnpm harness:check` validates legacy surface absence, active Markdown links, execution layer parity, workspace guide contract, line-count guardrails, and whitespace diff checks. |

## Verification

Run:

```bash
pnpm harness:check
git status --short --branch
```

`pnpm harness:check` should verify:

- root/workspace `AGENTS.md -> CLAUDE.md` symlinks
- absence of accidental local tool surfaces
- absence of legacy `.claude/core`, `.claude/features`, `.claude/implementation`, and `.claude/references`
- active Markdown links
- expected execution-layer skill/agent files and bridge parity
- old temporary root plan names
- `git diff --check` and `git diff --cached --check`
