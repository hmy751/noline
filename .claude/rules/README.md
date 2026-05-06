# Noline Rules

This directory contains short, task-scoped rules for high-signal engineering decisions.

Rules are not full reference guides. A rule should answer:

- What must I do or avoid while editing this area?
- Where do I go for deeper context if the rule is not enough?
- Which guard should I re-check before finishing?

## Reading Model

- Start with the root guide and the relevant workspace `CLAUDE.md`.
- Open a rule when the task touches its scope.
- Use [guards](../guards/README.md) to check high-cost failure modes before and after editing.
- Use [context](../context/README.md) only when the compact rule is not enough.

## Bridge Note

These files live under `.claude/` because that is Noline's current repository-local harness surface. They are plain Markdown project guidance, not a commitment to mirror them into `.codex/` or `.agents/`.

Do not create a Codex, Claude agent, or skill copy of a rule unless there is a concrete tool-specific need. If a tool adapter is added later, link back to the owning rule instead of forking the full policy body.

## Active Rules

| Rule | Use when editing | Related guard |
| --- | --- | --- |
| [Activation Router](activation-router.md) | Client Data Layer hooks, repositories, local/remote routing | Activation Router, Data/Service separation |
| [Transaction + Sync Queue](transaction-sync-queue.md) | Local mutations, offline writes, activation/deactivation sync | Transaction + sync_queue, Soft Delete |
| [Schema First](schema-first.md) | Shared contracts, request/response shapes, inferred types | Schema-first |
| [Client-Side ID](client-side-id.md) | Create flows across client, schema, and server | Client-Side ID |
| [ISO Time](iso-time.md) | Date/time fields, storage, API payloads, display helpers | ISO 8601 time |
| [Auth/User Scope](auth-user-scope.md) | Server routes, sync endpoints, user-owned data | Auth/user scope |
| [Policy UI](policy-ui.md) | Offline/online restrictions and policy-driven UI states | Policy UI |

## Rule Quality Bar

Add or change a rule only when:

- the mistake is expensive,
- the same choice appears across multiple workspaces,
- or an existing policy is easy to miss because it is buried in long context docs.

Keep examples tied to current Noline paths and verify against code when changing behavior-sensitive wording.
