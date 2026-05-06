# Rule: ISO Time

## Scope

- Date/time fields in schemas, DB rows, and API payloads
- Form submit transforms involving date and time
- Date/time display utilities

## Rules

- Store and transmit time values as ISO 8601 datetime strings with timezone.
- Keep storage/transmission separate from display formatting.
- Use shared datetime utilities before adding local formatters.
- Combine form date/time fields into ISO values at the submit boundary.
- SQLite should store datetime values as text; server-side PostgreSQL fields should preserve timezone-aware semantics.
- Do not introduce locale-specific strings into persisted data.

## Before Finishing

- Check [Guard Map](../guards/README.md): ISO 8601 time.
- For deeper details, read [Time context](../context/README.md#time-and-date).
