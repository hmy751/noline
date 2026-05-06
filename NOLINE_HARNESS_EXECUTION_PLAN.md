# Noline Harness Execution Plan

> Created: 2026-05-06
> Branch: `docs/harness-execution-cleanup`
> Scope: AI/developer harness cleanup and execution support

## Why This Exists

The previous harness branches already moved Noline from one large root guide into a layered model: root guide, workspace guides, rules, guards, runbooks, context, decisions, audits, references, and archive.

The remaining problem is operational clarity. Old branches, stale tracker paths, and unclear evidence folders make the harness feel unfinished even though the main layer model is already merged.

This root plan is intentionally kept because the current work is still in execution. Remove or archive it only after this execution pass is merged or explicitly superseded.

## Current Decisions

- Delete stale local unmerged branches and restart from `main`.
- Archive `references/`; the remaining PRD and wireframe are old source material, not active startup context.
- Move stale implementation trackers and non-product reference guides into `_archive/`.
- Keep `decisions/`, `sessions/`, and `audits/` as evidence/history, not active policy.
- Do not create `.codex/`, `.agents/`, `.claude/agents/`, or `.claude/skills/` until a repeated local tool need is proven.
- Add an executable harness check so bridge and layer hygiene can be verified without re-reading all handoff notes.

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
- [ ] Decide whether to keep this plan at root for one more PR or move it to `.claude/audits/`.

## Folder Role Target

| Area | Target role |
| --- | --- |
| `CLAUDE.md` / `AGENTS.md` | Root navigation and Codex bridge |
| `.claude/rules/` | Short, verifiable task/path rules |
| `.claude/guards/` | High-cost failure checks |
| `.claude/runbooks/` | Repeated task entrypoints |
| `.claude/context/` | Deep architecture and feature context |
| `.claude/_archive/references/` | Old product/reference source |
| `.claude/decisions/` | Accepted decisions and rationale |
| `.claude/sessions/` | Historical design/implementation sessions |
| `.claude/audits/` | Verification notes and handoffs |
| `.claude/_archive/` | Deprecated or stale historical material |

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
- old temporary root plan names
- `git diff --check` and `git diff --cached --check`
