# Rule: Schema First

## Scope

- `packages/schema/**`
- Client/server request and response contracts
- Shared entity types and API DTOs

## Rules

- `@repo/schema` owns shared contracts.
- Define or update Zod schemas before deriving client/server types.
- Infer exported TypeScript types from schemas with `z.infer`.
- Do not hand-write parallel DTO types when a schema can own the contract.
- Client and server code should import the shared schema or inferred type instead of copying a shape.
- Form-only state may have local types, but submit payloads should converge back to shared request schemas.

## Before Finishing

- Check [Guard Map](../guards/README.md): Schema-first.
- If the schema change affects create flows, also check [Client-Side ID](client-side-id.md).
