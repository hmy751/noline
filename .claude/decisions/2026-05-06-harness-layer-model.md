# Decision: Harness Layer Model

> Date: 2026-05-06
> Status: Accepted
> Scope: Noline AI/developer harness structure

## Context

The previous restructure made the documentation corpus safer by adding a root guide, document map, guard map, workflow map, archive hygiene, and `AGENTS.md -> CLAUDE.md` bridges.

After that pass, `core/` and `features/` still looked like the harness center even when many files were better understood as deep context. That created two risks:

- Older implementation guides could be read as always-on policy.
- Claude/Codex bridge work could appear to mean "put everything under `.claude/`" or "mirror everything into tool-specific folders."

Current tool patterns point in the same direction: keep startup instructions small, use scoped/path rules for concrete behavior, preserve deeper context on demand, and avoid duplicating policy across tool adapters.

## Decision

Adopt a layer model for Noline's harness:

- Root `CLAUDE.md` / `AGENTS.md`: small navigation and project invariants.
- Workspace guides: owner rules for `apps/*` and `packages/*`.
- `.claude/rules/`: compact task/path rules for high-signal engineering choices.
- `.claude/guards/`: high-cost failure map and final check surface.
- `.claude/runbooks/`: repeated task entry points.
- `.claude/context/`: deep explanations and compatibility map for current `core/` and `features/` sources.
- `.claude/decisions/`, `.claude/audits/`, `.claude/references/`, `.claude/_archive/`: evidence, verification, product source, and historical material.

For this pass, common harness docs remain under `.claude/` to preserve existing links and because that is the current local harness surface. This does not make Claude-specific behavior the common source of truth.

No `.codex/`, `.agents/`, local agent, or local skill is created until a concrete repeated tool-specific need appears.

## Bridge Rule

Tool-specific files may adapt or point to common project guidance, but should not silently become separate policy sources. If both Claude and Codex versions exist later, the harness must record whether they are equivalent, adapters, or intentionally different.

## Consequences

- New task instructions should usually start in `rules/` or `runbooks/`, not in `core/` or `features/`.
- Existing `core/` and `features/` files remain available as deep context while links migrate.
- The old `workflows/` path stays as compatibility material while `runbooks/` becomes the active repeated-task surface.
- Future agents/skills should stay thin and point back to owning docs.

## Non-Goals

- No runtime code changes.
- No mass deletion of existing documentation.
- No automatic conversion of Claude commands into Codex rules or commands.
- No creation of local Noline agents or skills in this pass.
