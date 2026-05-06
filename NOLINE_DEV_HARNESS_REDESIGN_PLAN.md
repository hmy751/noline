# Noline Dev Harness Redesign Plan

> Temporary root plan.
> Created: 2026-05-06
> Branch: `docs/harness-doc-prune`
> Status: implementation checkpoint for the harness layer-model pass.

This root file exists so a later Claude/Codex session does not misread the current work as a completed cleanup or a simple `core/` slimming pass.

Do not treat this as permanent project policy. When the redesign is complete, move the continuity notes into `.claude/audits/` or `.claude/decisions/` and remove this root file.

## Why This Exists

The recently merged `docs/noline-harness-restructure` branch made Noline's AI/developer docs much better: root guide, document map, harness map, guard map, workflow map, Codex bridges, and archive hygiene.

The next concern is deeper:

- Is `.claude/core/` still the right center of gravity for a modern AI coding harness?
- Are `core/` and `features/` accidentally making old implementation guides look like always-relevant instructions?
- Can Noline adopt stronger harness patterns from current tools without copying `blog` or `dev-hub` blindly?

Working answer: `core/` is useful as an app architecture label, but it is not ideal as the main harness layer. Noline should move toward an explicit harness structure:

- always-small root guide,
- path/task-scoped rules,
- high-cost guards,
- runbooks for repeated work,
- context/reference docs for deeper reading,
- explicit Claude/Codex bridge ownership without forcing everything into `.claude/`,
- room for future agents/skills only if repeated use proves they are needed,
- decisions/audits/archive for history and verification.

## Current Workspace State

Run this first in a later session:

```bash
git status --short --branch
```

Expected branch:

```text
docs/harness-doc-prune
```

Important current state:

- The earlier first-pass doc-pruning changes were reverted on 2026-05-06.
- Current work is now following this plan by adding a layer model before moving or archiving large docs.
- Current implemented direction:
  - `.claude/rules/` for compact task/path rules.
  - `.claude/runbooks/` for repeated task entrypoints.
  - `.claude/context/` for deep context and `core/` / `features/` compatibility mapping.
  - `.claude/workflows/README.md` kept as a compatibility redirect to runbooks.
  - `.claude/decisions/2026-05-06-harness-layer-model.md` records the owner/bridge model.
- There is also an untracked file that appears to predate this plan:
  - `.claude/decisions/2026-05-06-commit-message-convention.md`
- Do not delete or overwrite unrelated untracked/staged work without checking it first.

If continuing this work, first inspect:

```bash
git diff --stat
git diff --name-status
```

## Reference Inputs

Use these as pattern sources, not templates to copy.

### External tool references

- AGENTS.md standard: agent-specific instructions should complement README, and large monorepos should use nested instruction files.
  - Source: https://agents.md/
- OpenAI Codex agent loop: project instructions are aggregated and bounded by a default 32 KiB project-doc budget, so root instructions should stay small.
  - Source: https://openai.com/index/unrolling-the-codex-agent-loop/
- Claude Code memory/rules docs: target under 200 lines per `CLAUDE.md`; move large or path-specific guidance to `.claude/rules/` or skills.
  - Source: https://code.claude.com/docs/en/memory
- Cursor project rules: rules work best when scoped by always-on, path/glob, agent-requested, or manual activation.
  - Source: https://docs.cursor.com/en/context/rules
- GitHub Copilot custom instructions: repository-wide and path-specific instructions can both apply, reinforcing the same broad/scoped split.
  - Source: https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot

### Local reference projects

`blog` useful patterns:

- `editorial/` separates `core/`, `lenses/`, `guards/`, `reference-profiles/`, `context/`, `decisions/`, and `audits/`.
- `editorial/core/reference-use.md` is the key idea: observe references, abstract the effect, adapt it to the current project, guard against hardcoding.
- Do not copy the blog taxonomy wholesale. Noline is a development harness, not a writing harness.

`dev-hub` useful patterns:

- `CLAUDE.md`/`AGENTS.md` bridge is explicit.
- `.claude/rules/` and `.codex/rules/` are not treated as identical just because the names match.
- `2026-04-29-always-load-rules-archive.md` records why always-loaded rules can cause format lock-in and token noise.
- `2026-04-30-global-harness-promotion.md` separates global reusable skeletons from local project profiles.
- `insight/교차조명과-재진입.md` frames the real problem well: document volume is less important than re-entry cost.

## Proposed Target Structure

This is the target structure. It is now partially implemented; continue to adjust after inspecting current links and file roles.

Root/shared surface:

```text
CLAUDE.md        # Current source root guide for Claude and humans
AGENTS.md        # Codex bridge; currently a symlink to CLAUDE.md
.claude/         # Existing Claude-oriented surface plus current project docs
.codex/          # Optional Codex-specific surface, only if a concrete Codex-only need appears
.agents/         # Optional bridge/shared surface, only if a concrete shared-agent/skill need appears
```

Inside the project harness docs:

```text
.claude/
├── harness/        # Harness ownership, Claude/Codex bridge, layer model
├── rules/          # Plain Markdown project rules; not automatically Codex or Claude loader rules
├── guards/         # High-cost mistake map: data loss, auth leak, sync break
├── runbooks/       # Repeated task procedures: add entity, debug sync, add API
├── context/        # Deeper subsystem explanations, not default startup reading
├── references/     # Product/source material: PRD, wireframe, images
├── decisions/      # Why structure or policy changed
├── audits/         # Verification, inventory, drift checks, handoff notes
└── _archive/       # Old long guides and historical implementation material
```

Open design question:

- Keep common harness docs under `.claude/` for now, but make bridge ownership explicit; or
- Move common docs to a neutral surface later, such as `.agents/harness/` or `docs/ai-harness/`, and leave `.claude/` / `.codex/` as tool adapters only.

Do not make this move until the cost of link churn and tool loading behavior is checked. Also do not create `.agents/`, `.codex/`, local agents, or local skills just because this plan mentions them. They are optional surfaces, not goals.

Possible mapping from current state:

| Current | Candidate | Notes |
| --- | --- | --- |
| `.claude/core/architecture.md` | `.claude/context/architecture.md` | Deep architecture context, not always-on. |
| `.claude/core/typescript.md` | `.claude/rules/schema-first.md` + context/archive | Split schema-first rule from general TS style. |
| `.claude/core/selective-activation-architecture.md` | `.claude/rules/client-data-router.md` + `.claude/context/selective-activation.md` | Guard-worthy rule plus background context. |
| `.claude/core/api-data.md` | `.claude/context/api-data.md` or runbook links | Depends whether it is rule-like or explanatory. |
| `.claude/core/policy-architecture.md` | `.claude/rules/policy-ui.md` + context | UI policy is rule-like; matrix/background is context. |
| `.claude/core/time.md` | `.claude/rules/iso-time.md` | Likely a compact path-scoped/current rule. |
| `.claude/core/components.md` | `.claude/rules/component-boundaries.md` or context | Keep only verifiable component boundaries as rules. |
| `.claude/core/error-handling.md` | `.claude/context/error-handling.md` | Current baseline unless a hard rule emerges. |
| `.claude/features/*` | `.claude/context/*` or `.claude/runbooks/*` | Feature docs are usually context, not harness center. |
| `.claude/workflows/README.md` | `.claude/runbooks/README.md` | `runbooks` is clearer for repeated procedures. |

## Design Principles

1. Root guide stays small.
   - Root `CLAUDE.md`/`AGENTS.md` should be a navigation hub, not a policy database.
   - Target: under roughly 200 lines unless there is a strong reason.

2. Rules are not reference docs.
   - A rule should be short, concrete, and verifiable.
   - A rule should answer "what must I do or avoid while editing these files?"

3. Guards capture high-cost failures.
   - Keep `guards/` as a map of things that cause data loss, sync drift, auth leakage, or contract breakage.
   - Do not add a guard for ordinary tips.

4. Runbooks capture repeated procedures.
   - Add entity, debug sync, add endpoint, implement form, date/time change.
   - A runbook can link to rules and context, but should not copy their full content.

5. Context preserves deep explanation.
   - Architecture, activation model, offline routing, offline map, old feature rationale.
   - Context is opened on demand, not treated as startup memory.

6. Archive aggressively but safely.
   - If a document is useful but stale, long, or mixed with history, move it to `_archive/`.
   - Leave a short current stub or redirect if many links point to the old path.

7. Decisions explain why the harness changed.
   - Any layer rename or policy center shift should have a decision record.
   - Small typo/link fixes do not need decisions.

8. References become patterns, not hardcoded dependencies.
   - Borrow from `blog` and `dev-hub` only after translating the effect into a Noline-specific pattern.
   - If a rule depends on a reference file still existing, it is not ready as an active rule.

9. Bridge is a first-class layer.
   - Shared intent and project policy should not be hidden inside tool-specific implementation files.
   - `CLAUDE.md` and `AGENTS.md` can share a source, but Claude rules, Codex rules, Claude agents, Codex agents, and skills may have different formats.
   - A tool-specific adapter may point to a common source; it should not silently become the source.

10. Agents and skills are optional execution surfaces, not policy warehouses.
   - Agents should be report-only by default unless the user explicitly wants execution.
   - Skills should describe when to run, what to read, and what output to produce.
   - Policy bodies should live in owning docs; agents/skills can link or summarize, but should not fork large policy copies.
   - Do not add a local agent or skill until the same task shape has repeated enough to justify it.

## Bridge Model To Design

Current Noline state:

- Root `AGENTS.md` is a symlink to `CLAUDE.md`.
- Workspace `AGENTS.md` files exist for `apps/client`, `apps/server`, `packages/schema`, and `packages/ui`.
- `.agents/` does not exist yet.
- `.codex/` does not exist yet.
- `.claude/agents/` and `.claude/skills/` do not exist yet.

Target bridge model should keep these surfaces available conceptually, without creating them by default:

| Surface | Candidate role | Source rule |
| --- | --- | --- |
| `CLAUDE.md` | Shared root guide source for Claude/humans | Keep small and navigational. |
| `AGENTS.md` | Codex bridge to root guide | Symlink or generated mirror; do not diverge silently. |
| workspace `CLAUDE.md` | Workspace owner guide | Keep local to that workspace. |
| workspace `AGENTS.md` | Codex bridge to workspace guide | Symlink when Codex should see the same local guide. |
| `.claude/rules/` | Plain Markdown project rules | Common project guidance in the current harness surface; not Claude-specific loader semantics by default. |
| `.codex/rules/` | Optional Codex-specific command/runtime policy | Create only for a concrete Codex-only need. Do not mirror `.claude/rules/` blindly. |
| `.claude/agents/` | Optional Claude agent definitions | Create only after a repeated report-only role is clear. |
| `.codex/agents/` | Optional Codex TOML agent definitions | Pair with Claude agents by meaning only if both are needed. |
| `.claude/skills/` | Optional Claude skill source | Create only for Noline-specific repeated workflow; global skills stay global. |
| `.agents/skills/` | Optional Codex-compatible skill bridge | Create only if local skills need a Codex bridge. |
| `.agents/README.md` | Optional bridge manifest | Create only if `.agents/` becomes necessary. |

Bridge rules:

- Do not call something "shared" if only Claude can load it.
- Do not create either Claude or Codex-specific versions unless there is a concrete use case.
- Do not create both Claude and Codex versions unless both are actually needed.
- If both versions exist, record whether they are equivalent, adapters, or intentionally different.
- After adding or changing agents/skills/bridges, run a bridge audit before final response.

## Migration Checklist

### Phase 0. Pause And Stabilize

- [x] Confirm branch is `docs/harness-doc-prune`.
- [x] Inspect staged and unstaged changes.
- [x] Decide whether to keep, reset, or adapt the first-pass pruning already present.
- [x] Revert the first-pass pruning so this pass starts from the broader layer model.
- [x] Do not touch `.claude/decisions/2026-05-06-commit-message-convention.md` until its origin/intent is checked.
- [x] Re-read this file before moving anything.

### Phase 1. Owner And Bridge Model

- [x] Update `.claude/harness/README.md` with the target layer model.
- [x] Add an explicit Claude/Codex bridge model.
- [x] Decide whether common harness docs stay under `.claude/` for this pass or move later to a neutral surface.
- [x] Define which layers are always read vs scoped vs on-demand.
- [x] Record the model in a decision file under `.claude/decisions/`.
- [x] Keep this phase mostly structural; avoid moving many files before the owner model is clear.

### Phase 2. Create New Layer Directories And Bridge Manifests

- [x] Create `.claude/rules/README.md`.
- [x] Create `.claude/runbooks/README.md`.
- [x] Create `.claude/context/README.md`.
- [x] Explain when to use each layer.
- [x] Do not add `.agents/` or `.codex/` in this phase unless a concrete tool-specific need appears.
- [x] If adding `.agents/`, create `.agents/README.md` explaining why it exists and what it is not. Not applicable; `.agents/` was not added.
- [x] If adding `.codex/`, create only the subdirectories that are immediately needed. Not applicable; `.codex/` was not added.
- [x] Keep existing `guards/`, `decisions/`, `audits/`, `references/`, `_archive/`.

### Phase 3. Migrate High-Signal Rules

- [x] Extract schema-first rule.
- [x] Extract Activation Router / Local-Remote routing rule.
- [x] Extract transaction + `sync_queue` rule.
- [x] Extract ISO 8601 time rule.
- [x] Extract auth/user-scope rule.
- [x] Extract Policy UI rule.
- [x] Add Client-Side ID as a separate compact rule because it is a high-cost sync invariant.
- [x] Add path scopes if using Claude `.claude/rules/` frontmatter. Not applicable; current files are plain Markdown and not Claude-only loader rules.
- [x] Keep each rule short and concrete.

### Phase 4. Convert Workflows To Runbooks

- [x] Move or recreate `.claude/workflows/README.md` as `.claude/runbooks/README.md`.
- [x] Split large repeated workflows into separate files only if it improves scanning.
- [x] Update root and harness links.
- [x] Archive or leave redirect notes for old workflow path.

### Phase 5. Move Deep Sources To Context

- [ ] Move current `core/` docs that are explanatory into `.claude/context/`.
- [ ] Move feature guides that are explanatory into `.claude/context/`.
- [x] Preserve old long versions in `_archive/`.
- [x] Leave stubs or update links for any old paths that many docs still reference.
- [x] First-pass choice: keep `core/` and `features/` in place for link stability, and make `.claude/context/README.md` the explicit compatibility map.

### Phase 6. Root And Workspace Guides

- [x] Shrink root `CLAUDE.md` to a startup/navigation guide.
- [x] Keep workspace `CLAUDE.md` files focused on local owner rules and commands.
- [x] Decide whether workspace guides should link to `rules/`, `runbooks/`, or `context/`.
- [x] Avoid copying the same rule into root, workspace, and rules.
- [x] Optional next pass: update workspace guide link sections so they point through rules/context instead of directly to `core/`/`features/` where that improves re-entry.

### Phase 7. Verification

- [x] Run active markdown local link scan.
- [x] Run stale path scan for `.claude/core/`, `.claude/features/`, `.claude/workflows/`.
- [x] Run `git diff --check`.
- [x] Check staged file list contains only documentation/harness changes unless runtime work was explicitly requested.
- [x] Run symlink check for `AGENTS.md -> CLAUDE.md`.
- [x] If `.agents/`, `.codex/`, `.claude/agents/`, or `.claude/skills/` changed, verify that each was necessary and check bridge equivalence/drift explicitly.
- [x] Re-run or request `tooling-map-auditor` because global/project harness or bridge files changed.
- [ ] Move this temporary plan to `.claude/audits/` or remove it after preserving needed context.

Verification note:

- Active markdown local link and anchor scan passed for 23 files, including root, workspace guides, and new harness layers.
- `git diff --check` passed.
- Tracked and untracked file list is documentation/harness-only, except `.claude/decisions/2026-05-06-commit-message-convention.md`, which remains untouched because its origin/intent was not part of this pass.
- `AGENTS.md -> CLAUDE.md` symlink bridge is intact at root, `apps/client`, `apps/server`, `packages/schema`, and `packages/ui`.
- No `.agents/`, `.codex/`, `.claude/agents/`, or `.claude/skills/` surface was created.
- Stale path scan still finds intentional compatibility/context references to `core/`, `features/`, and `workflows/`; root and active maps now route new work through `rules/`, `runbooks/`, and `context/`.
- `tooling-map-auditor` reported no must-fix bridge issues. It noted the root temporary plan must be moved/removed before final merge and that workspace guide cleanup was optional; workspace quick links were then aligned to `rules/`, `runbooks/`, and `context/`.

## Stop Conditions

Stop and ask the user before continuing if:

- A move would require deleting a document whose role is unclear.
- A file mixes current policy and irreplaceable history and cannot be split safely.
- Runtime code changes become necessary.
- A tool-specific bridge would need new Codex/Claude behavior that is not locally verified.
- A new agent or skill would duplicate policy instead of linking to the owning docs.
- A `.claude` path is being used only because it already exists, not because Claude is truly the owner.
- Link updates touch large historical folders and the benefit is only cosmetic.

## Verification Commands

Use these as starting points, not as a fixed ritual:

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
git diff --check
```

Potential link scan:

```bash
node scripts-or-inline-link-scan.js
```

If no project script exists, use a small throwaway Node script in the shell to scan active markdown links. Do not commit throwaway scripts unless they become useful repo tooling.

## Completion Criteria

The redesign is done when:

- A new session can tell where always-on instructions, path rules, guards, runbooks, deep context, decisions, audits, and archives live.
- Root `CLAUDE.md` no longer points to `core/` and `features/` as the main harness center.
- `core/` / `features/` are either gone, archived, or clearly compatibility stubs.
- Claude/Codex bridge ownership is explicit.
- Future local agents/skills have a clear home and drift-check rule.
- High-cost rules are short and findable.
- Repeated work starts from runbooks.
- Historical material remains recoverable.
- Verification passes.
- This temporary root plan is removed or replaced by an audit handoff.
