# Rule: Client-Side ID

## Scope

- Entity create flows
- Client mutations that create sync-owned rows
- Server create endpoints that accept client-created entities
- Request schemas for create payloads

## Rules

- The client generates entity IDs with the project wrapper `generateId()`.
- Do not call `ulid()` directly in React Native code.
- Create request schemas must allow the client-provided ID when the entity participates in sync.
- Server create routes must accept and persist the client ID instead of replacing it.
- Keep the ID strategy aligned across schema, client mutation, local DB insert, sync payload, and server route.

## Before Finishing

- Check [Guard Map](../guards/README.md): Client-Side ID.
- If the entity is sync-owned, also check [Activation Router](activation-router.md) and [Transaction + Sync Queue](transaction-sync-queue.md).
