# Policy Architecture Guide

> 문서 상태: active source.
> v3.0 rollout 설명과 phase checklist는 [_archive/policy-architecture-v3-rollout.md](../_archive/policy-architecture-v3-rollout.md)에 보존되어 있다.

Policy Layer는 "현재 상태에서 기능을 사용할 수 있는가"와 "어떤 UI 모드로 보여줄 것인가"를 결정한다. Data Entity의 Local/Remote 저장 위치는 [Selective Activation](./selective-activation-architecture.md)의 Activation Router가 결정한다.

## 현재 코드 경로

| 책임 | 현재 위치 |
| --- | --- |
| Policy constants | `apps/client/src/shared/policy/constants.ts` |
| Policy types | `apps/client/src/shared/policy/types.ts` |
| App policy hook | `apps/client/src/shared/policy/useAppPolicy.ts` |
| Policy exports | `apps/client/src/shared/policy/index.ts` |
| Policy UI | `apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx` |

## 4-State Matrix

Policy key는 네트워크 상태와 활성화 상태의 조합이다.

```text
online_active
online_inactive
offline_active
offline_inactive
```

`useAppPolicy(tripId)`는 현재 `useNetworkStatus()`와 `useGetTripActivation(tripId)`를 조합해 `PolicyKey`를 만들고, `TRIP_POLICIES`, `SCHEDULE_POLICIES`, `EXPENSE_POLICIES`, `SERVICE_POLICIES`에서 현재 권한을 반환한다.

## 책임 경계

| Layer | 책임 | 예시 |
| --- | --- | --- |
| Policy | allowed/mode/reason 결정 | schedule create가 `manual-only`인지 |
| Router | Local/Remote 경로 결정 | `routeChildMutation`으로 DB/API 분기 |
| UI | Policy를 사용자 경험으로 번역 | `PolicyErrorDisplay`, manual form |
| Service | 외부 서비스 호출과 표시 | map/search/directions |

Data hook 내부에 Policy check를 넣지 않는다. Policy는 화면이나 feature 조합부에서 읽고, data hook은 순수하게 데이터 작업을 수행한다.

## 사용 패턴

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

Service Layer는 `policy.service`를 기준으로 선택한다.

```tsx
const policy = useAppPolicy(tripId);

if (policy.service.mapProvider === 'none') {
  return <MapUnavailableView />;
}
```

## 변경 규칙

- 새 상태를 추가하기 전에 4-state matrix로 해결 가능한지 먼저 본다.
- 새 Entity를 추가하면 `types.ts`, `constants.ts`, `useAppPolicy.ts`, `index.ts`의 export 흐름을 함께 확인한다.
- 새 Service 권한을 추가하면 `ServiceConfig`와 `SERVICE_POLICIES`를 함께 수정한다.
- 정책 변경은 UI/feature 동작을 바꾸므로 필요한 경우 decision record를 남긴다.
- Policy 제한 메시지는 사용자 친화 문구로 두고 내부 구현명을 노출하지 않는다.

## 체크리스트

- [ ] UI가 임의 조건 대신 `useAppPolicy` 결과를 사용했는가?
- [ ] Data hook에 Policy 책임을 넣지 않았는가?
- [ ] Service Layer가 Router 대신 `policy.service` 기준을 사용했는가?
- [ ] `PolicyErrorDisplay` 또는 기존 안내 UI로 제한 상태를 드러냈는가?
- [ ] matrix의 네 상태 모두에서 동작이 정의되어 있는가?
