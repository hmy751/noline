# Noline Harness Restructure Plan

> Temporary planning document for the Noline AI/developer harness restructure.
> Created on branch `docs/noline-harness-plan`, based on `main` (`503a4a5`).

## Purpose

This document is a handoff/checklist for future sessions. It exists so that a later Codex/Claude session, or a compacted conversation, does not misunderstand the intended work.

The goal is not to replace Noline's existing `.claude` materials with a new harness copied from another project. The goal is to add a safer reading structure on top of the existing materials, then gradually reduce the old root guide once the destination layers exist.

## Current Understanding

Noline already has a large documentation corpus.

- Root `CLAUDE.md` is still an older-style, large all-in-one guide.
- `.claude/core/` and key `.claude/features/` files contain important active engineering policy.
- `.claude/decisions/`, `.claude/sessions/`, `.claude/implementation/`, `CHANGELOG.md`, `.claude/references/`, and `.claude/_archive/` contain evidence, source, history, or older context.
- Some active guides contain stale status wording or broken/ambiguous links.
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
| Audit/test | Harness or doc quality tests | Example: `.claude/doc-refactor-test.md` | Move or classify later; do not delete in first pass |
| Claude-only command | Claude command reference | `.claude/commands/` | Preserve, label as Claude-specific |

## Recommended Work Order

### Phase 0. Baseline And Inventory

- [ ] Start from `main`, or consciously rebase/cherry-pick onto a `main`-based branch.
- [ ] Record `git status -sb`.
- [ ] Record `.claude` file list and line counts.
- [ ] Search stale terms and status conflicts:
  - [ ] `구현 예정`
  - [ ] `향후 추가 예정`
  - [ ] `진행 예정`
  - [ ] `Echo Protocol`
  - [ ] `Offline-Prep`
  - [ ] `Local-First`
- [ ] Check markdown links in root, workspace guides, and `.claude`.
- [ ] Build a small inventory table with `path`, `current role`, `desired role`, `stale risk`, and `action`.

### Phase 1. Add Map Layers Without Removing Existing Material

- [ ] Add `.claude/README.md`.
  - [ ] Explain `.claude` document roles.
  - [ ] Mark active source vs evidence/history vs reference/archive.
  - [ ] Make clear that `commands/` are Claude command references.
- [ ] Add `.claude/harness/README.md`.
  - [ ] Explain root and workspace `AGENTS.md -> CLAUDE.md` bridge.
  - [ ] Explain layer ownership.
  - [ ] State local agents/skills are candidates only.
- [ ] Add `.claude/guards/README.md`.
  - [ ] Include only high-cost rules:
    - [ ] Activation Router
    - [ ] Data/Service separation
    - [ ] `withTransaction` + `sync_queue`
    - [ ] Client-Side ID / `generateId()`
    - [ ] schema-first / `z.infer`
    - [ ] ISO 8601 time
    - [ ] soft delete / cleanup safety
    - [ ] auth/user scope
    - [ ] Policy UI / `useAppPolicy`
- [ ] Add `.claude/workflows/README.md`.
  - [ ] Include repeated task starting paths only:
    - [ ] sync debugging
    - [ ] new Entity
    - [ ] date/time
    - [ ] currency
    - [ ] form
    - [ ] UI component
    - [ ] API endpoint

### Phase 2. Add Claude/Codex Bridges

- [ ] Add root `AGENTS.md -> CLAUDE.md` symlink.
- [ ] Add workspace symlinks only where local `CLAUDE.md` exists and Codex should inherit it:
  - [ ] `apps/client/AGENTS.md -> CLAUDE.md`
  - [ ] `apps/server/AGENTS.md -> CLAUDE.md`
  - [ ] `packages/schema/AGENTS.md -> CLAUDE.md`
  - [ ] `packages/ui/AGENTS.md -> CLAUDE.md`
- [ ] Do not create `.codex` command/rule equivalents just because `.claude/commands/` exists.

### Phase 3. Minimal Stale Fixes In Active Guides

Only fix wording that conflicts with current code or document roles. Avoid broad rewrites.

- [ ] Fix `.claude/features/currency.md` where `baseCurrency` is described as future-only even though it exists in schema/code.
- [ ] Fix `.claude/features/manual-input.md` where top status says implemented but later text says implementation is still pending.
- [ ] Fix obviously broken active links, especially active guide links that point to the wrong relative path.
- [ ] Review `.claude/core/policy-architecture.md` for links that accidentally point under `.claude/apps/...`.
- [ ] Leave historical terminology in historical documents unless it misleads from an active guide.

### Phase 4. Shrink Root `CLAUDE.md` Last

Only do this after map, guard, and workflow destinations exist.

Keep root `CLAUDE.md` responsible for:

- [ ] Project identity.
- [ ] Current terminology.
- [ ] Core invariants.
- [ ] Fast links to `.claude/README.md`, harness, guards, workflows, core docs, feature docs, and workspace guides.
- [ ] Reminder that more specific owner docs override root summary.

Move or link out from root:

- [ ] Long task checklists.
- [ ] Long pitfall code examples.
- [ ] Detailed architecture walkthroughs.
- [ ] Completed feature history.
- [ ] Large migration/history sections.

Do not remove information unless a target document already owns it.

### Phase 5. Decision Record

- [ ] Add a decision record under `.claude/decisions/`.
- [ ] Include:
  - [ ] Why the harness changed.
  - [ ] Why existing docs were preserved.
  - [ ] Why root `CLAUDE.md` was reduced last.
  - [ ] What was explicitly not done.
  - [ ] How future agents/skills should be considered.

### Phase 6. Verification

- [ ] `git status -sb`
- [ ] Link check or scripted markdown link scan.
- [ ] `rg` stale terms again and classify each remaining hit as active, history, reference, or archive.
- [ ] Confirm no runtime code changed.
- [ ] Confirm root and workspace `AGENTS.md` symlinks resolve correctly.
- [ ] If global/root harness bridge files, global skills/agents, or Codex bridge files were modified, run `tooling-map-auditor` before final response.

## Suggested Commit Slices

Keep commits small so later sessions can revert or compare safely.

1. `docs: noline harness map and bridge plan`
2. `docs: add noline guard and workflow maps`
3. `docs: refresh stale active guide wording`
4. `docs: shrink root CLAUDE guide`
5. `docs: record noline harness restructure decision`

## Open Questions

- Should `.claude/doc-refactor-test.md` become `.claude/audits/doc-refactor-test.md`, or move into `_archive/`?
- Should `.claude/features/activation-system.md` be split later into active feature guide and rollout/history notes?
- Should Noline eventually have a thin `noline-policy-checker` report-only agent?
- Should Noline eventually have a `noline-context-collector`, or is the global `gather-context` enough?
- How much of the existing `harness/noline-ai-guides` branch should be cherry-picked versus recreated cleanly from `main`?

## Hand-Off Summary

If a later session sees only this file, proceed conservatively:

1. Do not delete existing documentation.
2. Create map layers first.
3. Fix only current-guide contradictions.
4. Reduce root `CLAUDE.md` last.
5. Treat history as evidence, not current policy.
6. Keep agents/skills as candidates until repeated real use proves them.
