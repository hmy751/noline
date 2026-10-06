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
| UI | 제한된 기능 영역을 안내하고 작성 상태를 보존 | `PolicyErrorDisplay`, 일정 선택·저장 영역 |
| Service | 외부 서비스 호출과 표시 | map/search/directions |

Data hook 내부에 Policy check를 넣지 않는다. Policy는 화면이나 feature 조합부에서 읽고, data hook은 순수하게 데이터 작업을 수행한다.

여행의 생성·수정 UI 가용성은 `policy.trip.create`와 `policy.trip.update`로 제공한다. `constants.ts`에서 새 여행 생성은 다른 여행의 활성 여부와 무관한 온라인·오프라인 정책을, 기존 여행 수정은 대상 여행의 4-state 정책을 선택한다. 인증·unknown 안내와 활성 상태 최초 확인은 기존 공통 제약을 재사용한다. 생성·편집 폼은 기본 display 정책으로 버튼과 인라인 제한 안내를 구성하며, 실제 실행 순간의 인증·연결·Debug 쓰기 차단과 저장 위치는 Router가 확인한다.

도시 시간대 조회는 실제 네트워크 Service의 `searchMode`를 `canResolveTimeZone`으로 표현한다. 폼은 조회 중·연결 제한·실패·확인된 결과를 구별해 보여 주고, 확인된 시간대와 저장 정책을 각각 사용한다. 이미 확인한 시간대는 연결이 끊겨도 보존하며 활성 여행에는 Local update로 적용할 수 있다. 비활성 여행은 연결 복구 뒤 적용한다. 시간대 준비 여부나 날짜 유효성은 폼 책임이며 Policy에 포함하지 않는다.

## 작성과 읽기의 제한을 구별한다

이미 열린 일정·경비 생성/수정의 초안은 네트워크 상태가 바뀌어도 같은 입력 소유자와 폼을 유지한다. `allowed: false`를 이유로 작성 화면 전체를 제한 안내로 바꾸거나, `manual-only`를 이유로 별도 폼으로 교체하지 않는다. 기본 입력은 계속 보여 주고, 장소 검색·일정 조회·저장처럼 현재 실행할 수 없는 영역에 정책 안내를 둔다. 저장 오류도 초안에 붙여 보존하며 연결이 복구됐다는 이유로 자동 제출하지 않는다. 사용자가 다시 저장할 때 Router가 최신 실행 조건을 확인한다.

읽기 목록·상세는 별도 계약이다. 비활성 여행이 offline/unknown이면 기존 query cache를 삭제하지 않고 목록·상세 공개와 새 조회를 제한한다. 이미 편집 중인 초안의 값과 기존 연결 설명을 유지하는 것은 이 읽기 제한을 해제하는 일이 아니다. 일정 후보는 `useTripSchedulesReadQuery`가 공개하는 결과에서만 제공하며, 저장 위치를 UI에서 직접 선택하지 않는다.

활성 여행의 경비 생성·수정은 offline/unknown에도 `full`이다. 연결 대상은 같은 여행의 Local 일정이므로 온라인 검색 서비스처럼 제한하지 않는다. Expense의 날짜와 Schedule의 날짜는 독립적이고, 연결은 같은 여행 일정 하나에 대한 선택적 관계다. 모든 날짜의 일정을 날짜·시간순으로 제공하고, 날짜 변경은 기존 연결을 해제하지 않는다. 비활성 여행의 일정 목록이 제한되면 새 연결 선택을 막되 이미 열린 초안의 연결은 설명하고 해제할 수 있다. 이 경우에도 서버 저장은 복구 전까지 제한된다. 선택 근거는 [경비 초안과 일정 연결 결정](../decisions/2026-10-02-expense-draft-and-schedule-association.md)에 있다.

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
