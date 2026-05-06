# Rule: Transaction + Sync Queue

## Scope

- Local mutations in the client
- Offline/manual input writes
- Activation and deactivation flows
- Any write path that creates or updates `sync_queue`

## Rules

- Local DB changes and the matching `sync_queue` insert must happen inside the same `withTransaction` call.
- Do not enqueue sync work after a successful local write in a separate step.
- Do not put Service Layer work such as map/search/directions into `sync_queue` unless the ownership model changes by decision record.
- Delete flows must preserve soft-delete and pending-sync safety.
- Activation/deactivation cleanup must check pending sync state before removing local data.

## Before Finishing

- Check [Guard Map](../guards/README.md): Transaction + sync_queue and Soft Delete.
- If changing cleanup behavior, read [Deactivation Sync Queue Safety](../decisions/2025-11-20-deactivation-sync-queue-safety.md).
