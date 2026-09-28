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

Network Store의 관측 상태는 `online/offline/unknown`이다. 현재 `useAppPolicy(tripId)`는 화면용 `useDisplayNetworkStatus()`와 `useGetTripActivation(tripId)`를 조합하되, unknown의 권한 모드는 기존 offline 항목을 재사용한다. 따라서 미확정 상태에서 없는 policy key를 조회하거나 온라인 서비스 모드를 열지 않는다. unknown의 안내 시간·재확인은 Store의 `checkStatus`·`refresh`가 따로 제공한다. 비활성 여행의 unknown에서는 `checkStatus`가 checking이면 pending 안내를, 그 외에는 확인 불가 안내를 반환한다. 실제 offline은 오프라인 안내를 사용하며 활성 여행의 Local 권한은 유지한다. 헤더도 같은 확인 상태로 확인 중·확인 불가를 구별한다. 화면용 unknown 강제 설정만으로 실제 확인 작업이나 타이머를 만들지는 않으므로, 실제 확인 상태가 idle이면 확인 불가로 표시한다. 확인 불가 정책에는 `recoveryAction: recheck-network`를 반환한다. `PolicyErrorDisplay`는 이 명시적인 값에 따라 다시 확인 버튼을 표시하고 기존 `useNetworkCheck().refresh()`를 실행한다. 문구를 비교해 행동을 고르지 않는다. 실제 unknown의 확인 중에는 진행 표시를 사용하고, 그 외에도 진행 중 refresh가 있으면 버튼을 비활성화한다.

이 4-state 표의 재사용은 권한 모드에 한정된다. 실제 unknown을 offline으로 바꾸지 않으며 실제 요청 판단은 화면 override와 구별한다. Router는 실제 online에서만 Remote를 실행한다.

활성 여부 최초 조회에서는 성공 결과가 없는 undefined를 비활성으로 간주하지 않는다. 최초 확인 중에는 `pending`을 표시하고 실패는 활성 상태 확인 실패로 안내한다. 성공 후 기록이 없는 null과 구별하며, 기존 결과는 재조회 중·실패 뒤에도 유지한다. 여행 대상이 바뀌면 이전 결과를 재사용하지 않고 Local session이 없으면 로그인 안내를 먼저 적용한다. 이 1-A의 검사 범위와 남은 unknown 안내 연결은 [Ticket 06](../../context/work/workspaces/002-code-readability-refactoring/current/memory/tickets/06-app-startup-lifecycle.md#네트워크-안내-후속-작업-1-a--활성-여부-최초-확인)에 있다.

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
