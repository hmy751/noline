# Rule: Activation Router

## Scope

- `apps/client/src/entities/**`
- Data hooks and repositories for Trip/Schedule/Expense-like entities
- Code that chooses between local SQLite and server API reads/writes

## Rules

- Data Layer code must route Local/Remote behavior through the Activation Router.
- UI components and feature screens must not choose SQLite vs API directly.
- Activated trips use local SQLite as the source of truth.
- Inactive trips use the server API as the source of truth.
- Map, Search, Directions, and similar Service Layer code are not sync-owned Data Layer entities; handle them through policy-based network/service flows.
- When adding a new sync-owned entity, add routing at the repository/data layer before wiring UI.

## Before Finishing

- Check [Guard Map](../guards/README.md): Activation Router and Data/Service separation.
- If the routing behavior is unclear, read [Selective Activation context](../context/README.md#selective-activation-and-router) before editing.
