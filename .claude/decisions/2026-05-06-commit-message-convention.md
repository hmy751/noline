# Decision: Commit Message Convention

> Date: 2026-05-06
> Status: Accepted
> Scope: Noline AI/developer documentation harness

## Context

Noline's recent history already uses Conventional Commits in many places, but the format is uneven:

- Some runtime commits use helpful workspace scopes such as `feat(client):`, `fix(server):`, and `feat(schema):`.
- Some commits omit scope even when the affected owner is clear.
- Some subjects put paths or owner hints into the summary instead of the scope, such as `feat: apps/client, ...`.
- One historical commit used malformed punctuation: `chore:(client): ...`.

This makes branch logs, generated PR messages, and later decision/session records harder to classify.

## Decision

Record a commit message convention in [../harness/README.md](../harness/README.md).

Future commits should use:

```text
type(scope): summary
```

Runtime code should prefer workspace scopes (`client`, `server`, `schema`, `ui`). Documentation and harness changes should use the smallest document owner as scope (`harness`, `rules`, `runbooks`, `context`, `guards`, `readme`, `archive`, etc.). Cross-workspace feature commits may use a domain scope when that improves traceability, such as `feat(auth): ...`.

Scope may be omitted only when the change is genuinely repo-wide or has no useful owner.

## Consequences

Future branch logs should be easier to scan by owner and intent.

Generated PR descriptions and documentation handoffs can rely more safely on commit subjects for classification.

Existing historical commits are not rewritten. The convention applies to new commits from this point forward.
