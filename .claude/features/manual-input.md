# Manual Input Feature Guide

> 문서 상태: active source.
> v3.0 phase 설명과 긴 구현 예시는 [_archive/manual-input-v3-rollout.md](../_archive/manual-input-v3-rollout.md)에 보존되어 있다.

Manual Input은 네트워크나 외부 API가 없어도 핵심 데이터를 입력할 수 있게 하는 graceful degradation 전략이다.

## 현재 기준

- Schedule과 Expense는 `offline_active` 상태에서 manual-only 입력을 허용할 수 있다.
- Trip 생성은 기본적으로 온라인 전제를 유지한다.
- UI는 `useAppPolicy(tripId)`의 `mode`와 `allowed`를 기준으로 분기한다.
- Data 저장은 기존 entity data hook과 Activation Router 경계를 그대로 탄다.

## Current Code Paths

| 책임 | 현재 위치 |
| --- | --- |
| Schedule full/manual form | `apps/client/src/features/schedule/create-schedule/` |
| Expense full/manual form | `apps/client/src/features/expense/create-expense/` |
| Policy hook | `apps/client/src/shared/policy/useAppPolicy.ts` |
| Policy constants | `apps/client/src/shared/policy/constants.ts` |
| Policy UI | `apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx` |
| Schedule data hook | `apps/client/src/entities/schedule/data/useCreateSchedule.ts` |
| Expense data hook | `apps/client/src/entities/expense/data/useCreateExpense.ts` |

## UI Pattern

```tsx
const policy = useAppPolicy(tripId);

if (!policy.schedule.create.allowed) {
  return <PolicyErrorDisplay permission={policy.schedule.create} variant='block' />;
}

if (policy.schedule.create.mode === 'manual-only') {
  return <ManualScheduleForm tripId={tripId} />;
}

return <ScheduleForm tripId={tripId} />;
```

Manual UI should explain the limitation without exposing internal policy names.

## Data Pattern

Manual form still submits through the same entity data hook.

- Schedule: `useCreateSchedule`.
- Expense: `useCreateExpense`.
- ID generation stays client-side.
- date/time values are converted to ISO strings before mutation.
- Local/Remote routing remains in repository/Activation Router.

Do not add a separate manual-only persistence path unless the current entity path cannot express the behavior.

## Field Rules

Schedule manual mode:

- Required: title, scheduledAt.
- Allowed: text location/address where useful.
- Blocked or nullable: API-derived coordinates when they are unavailable.

Expense manual mode:

- Required: title, amount, currency, category, date.
- Optional: scheduleId when available.
- Blocked or deferred: receipt upload and external enrichment when offline.

## 체크리스트

- [ ] UI 분기가 `useAppPolicy` 결과를 기준으로 하는가?
- [ ] manual form도 동일한 entity data hook을 사용하는가?
- [ ] external API가 없는 상태에서 필수 입력만 요구하는가?
- [ ] 나중에 보강 가능한 값은 null/deferred로 안전하게 저장하는가?
- [ ] 오프라인 제한 메시지가 사용자에게 이해 가능한 문장인가?
