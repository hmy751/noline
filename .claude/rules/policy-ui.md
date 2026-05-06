# Rule: Policy UI

## Scope

- Offline/online UI restrictions
- Active/inactive trip behavior
- Manual input and feature availability states
- Components that show blocked or degraded actions

## Rules

- Use existing policy primitives before adding ad hoc conditionals.
- Prefer `useAppPolicy` for policy decisions in UI code.
- Show restriction states with existing patterns such as `PolicyErrorDisplay` and `NetworkStatusIndicator`.
- UI should explain blocked actions without changing the underlying data ownership rule.
- Data hooks and repositories still own Local/Remote routing; policy UI should not bypass the Activation Router.

## Before Finishing

- Check [Guard Map](../guards/README.md): Policy UI.
- If the policy itself changes, update the owning context and add a decision record.
