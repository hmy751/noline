# Rule: Auth/User Scope

## Scope

- `apps/server` routes and middleware
- Sync endpoints
- Queries or mutations that access user-owned rows
- Client code that stores or filters local user data

## Rules

- Protected server routes must verify authentication before accessing user data.
- User-owned queries must filter by the authenticated user's ownership scope.
- Sync endpoints must not return or mutate rows outside the authenticated user.
- Local data should remain partitioned by user where the current model expects user ownership.
- Do not trust client-provided ownership fields without server-side verification.

## Before Finishing

- Check [Guard Map](../guards/README.md): Auth/user scope.
- If touching auth transport, read [Auth Axios Factory decision](../decisions/2025-12-23-auth-axios-factory.md).
