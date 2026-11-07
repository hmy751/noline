# 네트워크·조회·화면 복구와 Policy

화면·조회·여행 목록·정책·연결 복구를 변경할 때 읽는다. 이 본문은 해당 개발 계약과 현재 구현의 연결을 소유한다. **기능을 쓸 수 있는지, 데이터를 어디서 읽고 쓸지, 이미 얻은 내용을 표시할지는 각각 판단한다.** Policy는 사용 가능 여부와 화면 모드를, Activation Router는 Local/Remote 실행 위치를 맡는다.

| 변경하려는 것 | 적용할 기준 |
| --- | --- |
| 연결 감지·재확인·Policy 상태 | [연결 관측](#네트워크-관측과-재확인의-수명)과 [상태 조합](#4-state-matrix)에서 실제 관측·표시용 상태·미확정 안내를 구별한다. |
| 데이터 경로·여행 목록·선택 | [Router와 목록](#router와-계정-전체-여행-목록의-계약)에서 실행 위치, 미전송 변경과 기존 선택의 보존 조건을 확인한다. |
| 일정·경비 조회·홈 표시·복구 | [조회와 표시](#조회-실행과-화면-표시를-구별한다), [화면별 보존](#화면마다-보존할-내용과-표시-책임), [복구](#연결-복귀와-데이터-갱신)를 함께 적용한다. |
| 작성 중 연결 변화·수동 입력 | [작성 계약](#작성과-읽기의-제한을-구별한다)에서 초안 보존 기준과 일정 수정의 현재 구현 차이를 구별한다. |

이하 표와 코드 경로는 이 계약의 현재 적용을 설명한다. 특정 컴포넌트 이름이나 조회 배치를 모든 기능의 의무 구조로 확대하지 않는다. 인증과 앱 준비·종료는 [앱 실행 기준](../../current/app-runtime/INDEX.md)이, 제품 목적과 활성화 의미는 [제품 기준](../../common/product.md)이 맡는다.

## 연결이 끊긴 여행 화면을 이해하는 출발점

여행의 활성화는 데이터를 기기에 준비하는 선택이고, 연결 관측은 지금 외부 서비스를 호출할 수 있는지를 판단하는 입력이다. 둘은 독립적이다. 활성 여행도 온라인에서는 장소 검색과 Google 지도를 사용할 수 있고, 오프라인에서는 Local 일정·경비를 이용하면서 검색만 제한한다. 지도·경로의 오프라인 사용 범위는 [실제 준비 자원과 표시 방식](../offline-maps-and-routes/INDEX.md)을 함께 확인한다.

이미 보던 비활성 여행에서 연결이 끊기면 여행의 기본 정보와 선택은 남지만 일정·경비 읽기 영역은 제한된다. 작성 중인 초안은 기본 입력을 유지하고 실행할 수 없는 영역만 제한하는 것이 계약이다. 현재 일정 수정 화면의 불충족은 아래 [작성 계약](#작성과-읽기의-제한을-구별한다)에서 구분한다. 캐시의 존재, 내용의 공개, 저장 가능한 위치가 서로 다른 판단이기 때문이다. 이 관계를 바꾸는 작업은 아래의 Policy·Router·화면 책임을 함께 확인한다.

## 사용 가능 여부·실행 위치·표시 책임을 나눈다

| Layer | 책임 | 예시 |
| --- | --- | --- |
| Policy | allowed/mode/reason 결정 | schedule create가 `manual-only`인지 |
| Router | Local/Remote 경로 결정 | `routeChildMutation`으로 DB/API 분기 |
| UI | 제한된 기능 영역을 안내하고 작성 상태를 보존 | `PolicyErrorDisplay`, 일정 선택·저장 영역 |
| Service | 외부 서비스 호출과 표시 | map/search/directions |

화면·feature의 기능 제한을 바꿀 때는 임의의 연결 조건을 다시 만들지 않고 `useAppPolicy` 결과를 소비한다. Data hook을 추가하거나 고칠 때는 Policy 검사를 넣지 않고 데이터 작업을 맡긴다. Service의 가용성은 Data Router 대신 `policy.service`를 사용한다. 제한 안내는 `PolicyErrorDisplay`·`NetworkStatusIndicator` 같은 기존 패턴을 우선하며, 안내를 숨기거나 화면 조건을 바꿔도 Router의 데이터 소유권·실제 실행 조건을 우회하지 않는다. 이 구분으로 UI 가용성, 저장 위치와 CRUD 책임이 한곳에 섞이지 않게 한다.

여행의 생성·수정 UI 가용성은 `policy.trip.create`와 `policy.trip.update`로 제공한다. `constants.ts`에서 새 여행 생성은 다른 여행의 활성 여부와 무관한 온라인·오프라인 정책을, 기존 여행 수정은 대상 여행의 4-state 정책을 선택한다. 인증·unknown 안내와 활성 상태 최초 확인은 기존 공통 제약을 재사용한다. 생성·편집 폼은 기본 display 정책으로 버튼과 인라인 제한 안내를 구성하며, 실제 실행 순간의 인증·연결·Debug 쓰기 차단과 저장 위치는 Router가 확인한다.

도시 시간대 조회는 실제 네트워크 Service의 `searchMode`를 `canResolveTimeZone`으로 표현한다. 폼은 조회 중·연결 제한·실패·확인된 결과를 구별해 보여 주고, 확인된 시간대와 저장 정책을 각각 사용한다. 이미 확인한 시간대는 연결이 끊겨도 보존하며 활성 여행에는 Local update로 적용할 수 있다. 비활성 여행은 연결 복구 뒤 적용한다. 시간대 준비 여부나 날짜 유효성은 폼 책임이며 Policy에 포함하지 않는다.

## 네트워크 관측과 재확인의 수명

Network Store의 `realStatus`는 NetInfo 관측을 `online/offline/unknown`으로 해석한 값이다. 연결 또는 인터넷 도달이 false이면 offline, 둘 다 true이면 online, 나머지는 unknown이다. **unknown은 아직 확정하지 못했다는 뜻이며 시간이 지났다고 offline으로 바꾸지 않는다.** online 관측도 개별 API의 성공을 보장하지는 않는다.

| 값 | 소유하는 의미 | 사용 경계 |
| --- | --- | --- |
| `realStatus` | 실제 연결 관측 | Router·sync와 실제 실행 기준의 Policy가 사용 |
| `overrideStatus` | Debug 화면용 강제 상태 | 화면에서는 override가 있으면 그 값을 사용. 실제 관측은 유지 |
| `checkStatus` | unknown의 확인 중·확인 불가 안내 | `checking`·`unavailable`을 구별. 연결이 확정되면 `idle` |
| `isRefreshing` | 현재 명시적 재확인이 진행 중인지 | 재확인 버튼의 진행 표시·중복 입력 제한 |

`useDisplayNetworkStatus()`는 표시용 값을, `useRealNetworkStatus()`는 실제 관측을 읽는다. 표시용 online만으로 Remote 실행을 열지 않는다. 반대로 화면을 offline으로 강제하면 읽기 조합의 표시·조회는 제한될 수 있다. Debug override 중 쓰기·sync 차단은 Router·sync의 별도 실행 조건이며, 화면 강제값이 실제 연결을 바꾸는 것은 아니다.

### 시작·앱 복귀·해제

AppInitialization이 `init()`과 `cleanup()`을 연결하고 Store가 감지 세션을 소유한다. NetInfo 관측과 AppState 구독을 같은 세션에서 관리하며 중복 init은 구독을 늘리지 않는다. 최초 상태는 listener로 받으므로 앱에서 별도 초기 fetch를 추가하지 않는다.

- **앱 복귀:** background 또는 inactive에서 active로 돌아올 때 기존 `refresh()`를 호출한다. active 중복 이벤트에서는 호출하지 않는다. 주기적 관측을 기다리지 않고 다시 확인하려는 보완이며, 인터넷 연결 자체를 복구하는 동작은 아니다.
- **동시 재확인:** 수동 버튼과 앱 복귀는 진행 중인 하나의 Promise를 공유한다. unknown에서 명시적으로 재확인하면 안내 시간을 다시 시작한다.
- **해제:** listener·AppState 구독·타이머를 정리하고 대기 Promise를 마친다. 이전 세션의 늦은 callback은 새 감지 세션에 적용하지 않는다.

### 확인이 끝나도 최신 관측을 유지한다

unknown 안내는 현재 10초 뒤에도 미확정이면 `unavailable`로 바뀐다. 같은 unknown 관측을 반복해도 안내 시간을 계속 미루지 않는다. 재확인 작업에도 별도의 10초 제한이 있으며, 실패·시간 초과로 Promise가 끝나도 online 확인 성공이라는 뜻은 아니다. 이미 확정된 online/offline을 재확인 실패만으로 unknown이나 offline으로 초기화하지 않는다. 제한 시간은 [Store의 상수](../../../../apps/client/src/shared/store/network.ts)가 소유한다.

재확인 시작 뒤 더 최신 listener 관측이 도착하면 오래된 refresh 응답·실패는 그 상태를 덮지 않는다. 시간 초과·해제 뒤의 이전 refresh 결과도 적용하지 않지만, 유효한 감지 세션의 새로운 listener 관측은 계속 수용한다. 앱의 대기 종료를 native 요청 전체의 취소로 확대해서는 안 된다.

## 4-State Matrix

상태나 권한을 추가할 때는 먼저 기존 네 조합으로 표현할 수 있는지 확인하고, 각 조합에서 허용 여부와 표시 동작을 정의한다. unknown은 아래의 권한 재사용과 안내 조건까지 함께 대조한다.

Policy key는 네트워크와 여행 활성화 상태의 조합인 `online_active`, `online_inactive`, `offline_active`, `offline_inactive`다. `useAppPolicy(tripId)`는 기본적으로 표시용 상태를 사용하고, `{ network: 'real' }`이면 실제 관측을 사용한다.

unknown의 **권한 모드**는 기존 offline 항목을 재사용한다. 없는 policy key를 조회하거나 미확정 상태에서 온라인 서비스를 열지 않기 위한 선택이다. 실제 관측을 offline으로 바꾸는 것은 아니며 Router는 실제 online에서만 Remote를 실행한다.

| 장면 | 정책과 표시 |
| --- | --- |
| 비활성 여행·unknown·`checking` | `pending`과 확인 중 안내 |
| 비활성 여행·unknown·확인 중이 아님 | 확인 불가 안내와 `recoveryAction: recheck-network` |
| 비활성 여행·실제 offline | 오프라인 제한 안내 |
| 활성 여행·offline/unknown | 해당 Local 권한 유지 |

헤더도 확인 중·확인 불가를 구별한다. 화면용 unknown 강제 설정만으로 실제 확인이나 타이머를 만들지 않으므로 실제 `checkStatus`가 idle이면 확인 불가로 표시한다. `PolicyErrorDisplay`는 복구 행동을 문구 비교가 아닌 `recoveryAction`으로 선택해 기존 `useNetworkCheck().refresh()`를 호출한다. pending에는 진행 표시를 사용하고, 재확인 버튼이 보이는 동안 `isRefreshing`이면 비활성화한다.

### 최초 확인과 기존 성공 결과를 구별해 안내한다

Local session이 없으면 로그인 안내를 먼저 적용한다. 여행 활성 여부를 처음 확인할 때 `undefined`는 아직 성공한 결과가 없다는 뜻이다. pending 또는 활성 상태 확인 실패로 안내하며, 성공 후 활성 기록이 없는 `null`과 구별한다.

기존 활성 결과는 재조회 중·실패 뒤에도 유지하고 여행 대상이 바뀌면 이전 결과를 재사용하지 않는다. 재인증이 필요한 비활성 여행에는 로그인 안내를 적용한다. 최초 활성 확인과 기존 성공 결과를 구별해야 아직 모르는 상태를 비활성으로 오인하거나 재확인 중 화면을 불필요하게 닫지 않는다.

## Router와 계정 전체 여행 목록의 계약

[Activation Router](../../../../apps/client/src/shared/services/offline-prep/router.ts)는 기기 세션을 확인하고 실제 연결·인증·대상 여행의 활성 상태로 실행 위치를 정한다. Policy의 표시 모드가 실제 요청의 권한을 대신하지 않는다. Debug 네트워크 override가 설정된 동안에는 쓰기를 막는다.

| 작업 | 선택과 보존 조건 |
| --- | --- |
| 새 여행 생성 | `routeTripCreation`이 실제 온라인과 서버 인증을 확인해 서버에서 비활성 여행을 생성한다. 다른 활성 여행이 있어도 Local CREATE로 보내지 않는다. |
| Trip 단건·Schedule·Expense 조회 | `routeChildQuery`가 대상 활성 여행이면 Local, 비활성이면 실제 온라인·서버 인증을 확인해 Remote를 사용한다. |
| 기존 여행·일정·경비 변경 | `routeChildMutation`이 대상 활성 여부로 Local/Remote를 고른다. Local 변경의 transaction·queue 기록은 각 datasource의 책임이다. |
| 계정 전체 여행 목록 | `routeTripQuery`가 실제 온라인·서버 인증 상태에서 서버 전체 목록을 조회한다. 연결·인증 제한 중에는 활성 여행이 있어야 Local 목록을 새로 제공한다. |

온라인으로 감지돼도 API의 네트워크 오류·시간 초과·5xx가 발생하면 같은 세션의 활성 여행이 있을 때 Local 목록으로 fallback한다. 인증·응답 계약·미분류 오류나 Local 반영 실패를 숨기는 fallback은 하지 않는다. 이미 성공한 서버 변경을 후속 목록 조회 실패 때문에 실패한 변경으로 되돌려 보고하지 않는다.

새 sync-owned entity는 UI 연결 전에 repository에서 Router와 Local/Remote 책임을 정한다. Hook·화면이 DB/API를 직접 선택하면 활성 여행의 미전송 기록과 서버 사본이 갈라질 수 있다. 변경 전후에는 활성·비활성 × 실제 online·offline, unknown과 Debug override, 계정 세션을 함께 확인한다. 계정 전체 목록과 새 여행 생성은 위의 별도 분기를 유지한다. Data/Service 소유 경계를 바꾸려면 관련 제품 결정도 함께 재판단하며, 외부 서비스 호출을 편의상 sync queue에 넣지 않는다.

### 목록 반영과 화면 선택을 구별한다

[TripRepository](../../../../apps/client/src/entities/trip/repository/trip-repository.ts)는 서버 목록을 [Local datasource](../../../../apps/client/src/entities/trip/lib/trip-local.ts)의 한 transaction에서 반영한다. 활성 여행과 전송할 변경이 남아 있는 여행은 로컬 값을 보존한다. 대기·진행·실패 중인 여행 요청은 recordId로, 일정·경비 요청은 기기에 남아 있는 자식 행의 tripId로 보호할 여행을 찾는다. 보호 대상인 여행의 미전송 삭제도 서버 목록으로 되살리지 않는다. 나머지 비활성 사본은 갱신하고 서버에서 사라졌으면 soft delete한다. 이 반영은 큐를 추가하거나 삭제하지 않는다. 이전 세션·취소된 Query 응답도 반영하지 않는다.

격리 기록만 남은 비활성 여행은 이 보호에서 빠진다. 격리한 삭제 요청이 서버에 전달되지 않았다면 서버 목록에 있는 여행이 다시 보일 수 있다. 목록 갱신 뒤에도 [격리된 요청](../data-lifecycle/INDEX.md#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다)은 전송에서 제외된다.

결과의 `remote`는 보존할 로컬 여행 없이 서버 목록을 반영한 출처, `mixed`는 로컬 보존 여행이 섞인 출처, `local`은 서버 접근 제한 중 로컬 목록을 읽은 출처다. Local 목록은 서버의 최신 상태를 보장하지 않는다. 서버에서 사라진 활성 여행의 폐기·충돌 해결은 별도의 열린 판단이다.

[useTripSelection](../../../../apps/client/src/entities/trip/data/useTripSelection.ts)은 성공한 조회가 갱신 중이 아닐 때 선택을 조정한다. 선택한 여행이 결과에 있으면 유지한다. 선택이 있는데 결과에 없을 때에는 실제 online이고 출처가 remote/mixed여야 기본 여행 또는 첫 여행으로 바꾸며, 목록이 비면 선택을 해제한다. local·실패·미완료 결과만으로 서버 삭제를 판단하지 않는다. 처음부터 선택이 없으면 성공한 목록에서 기본 여행을 고를 수 있다.

[useGetTrips](../../../../apps/client/src/entities/trip/data/useGetTrips.ts)는 연결 상태별로 캐시를 나누지 않고 단일 key와 5분 staleTime을 쓴다. [useTripListRefresh](../../../../apps/client/src/application/useTripListRefresh.ts)가 로그인 후 연결부에 한 번 장착되어 실제 네트워크·인증 변화 때 목록을 취소·갱신한다. 표시 강제값·확인 진행만 바뀌면 새로 조회하지 않으며 해제 때 구독을 정리한다. 활성 여행이 없어 새 조회가 거부돼도 이미 얻은 Query 데이터는 유지한다. 이 목록 계약은 비활성 여행의 일정·경비 내용 공개를 허용하는 계약과 다르다.

목록 반영·선택을 바꿀 때는 세션 전환·조회 취소·미전송 부모 보존·빈 서버 목록·fallback 후 선택을 함께 대조한다. 여행 비활성화·sync·cleanup 전체의 안전성은 이 목록 반영 계약으로 증명되지 않는다.

## 조회 실행과 화면 표시를 구별한다

일정·경비의 구체 조회 feature는 Entity Query와 공통 `policy-query` 서비스를 연결한다. Entity hook은 query key·repository·캐시 설정을 소유하고 Policy를 직접 검사하지 않는다. 공통 서비스는 이미 계산된 Policy와 Query를 조합하며 일정·경비 Entity를 직접 import하거나 데이터를 따로 저장하지 않는다.

| 반환값 | 맡는 의미 | 소비 시 주의할 점 |
| --- | --- | --- |
| `query` | 원본 Query의 데이터·오류·진행 상태 | 공개 결과에서 raw `refetch`는 제외된다. 캐시가 남아 있다는 사실만으로 내용을 표시하지 않는다. |
| `access` | 대상 여행·소비자 수명·표시 정책·실제 정책을 합친 접근 조건 | `consumerEnabled`는 호출자 조건, `canFetch`는 정책까지 합친 최종 실행 조건 |
| `actions.refetch` | 접근 조건을 적용하는 수동 재조회 | 이전 렌더의 callback도 최근 React commit의 조건을 확인한다. 실제 저장 위치·요청 조건은 Router가 확인한다. |
| `view` | 현재 화면이 사용할 표시 결과 | `ready.data`로 내용을 표시하고 제한·최초 실패·갱신 실패를 구별한다. |

`canFetch`는 대상 여행이 있고 소비자가 enabled이며 **표시 정책과 실제 정책이 모두 허용**할 때 true다. `enabled: false`는 새 조회의 수명 조건이지 캐시 삭제나 모든 내용 숨김을 뜻하지 않는다.

### 표시 결과는 선행 제한부터 순서대로 고른다

[usePolicyReadQuery](../../../../apps/client/src/shared/services/policy-query/usePolicyReadQuery.ts)는 아래 순서에서 먼저 해당하는 결과를 선택한다. 이 순서 때문에 실행 제한과 표시 제한이 항상 같지는 않다.

| 우선순위·조건 | `view` | 표시 의미 |
| --- | --- | --- |
| 1. 여행 미선택 | `unselected` | 실패나 로딩으로 취급하지 않음 |
| 2. 표시 정책 제한 | `blocked` | 기존 캐시를 지우지 않고 내용 공개를 제한 |
| 3. Query 성공 또는 기존 데이터가 있는 갱신 오류 | `ready` | 기존 내용 유지. 갱신 오류가 있고 현재 fetching이 끝났으면 `refreshFailed` |
| 4. 소비자 disabled | `idle` | 성공 결과가 없는 비활성 소비자. 앞선 ready보다 후순위 |
| 5. 실제 정책 제한 | `blocked` | 표시 정책은 허용해도 실제로 조회할 수 없고 성공 결과도 없음 |
| 6. 그 밖의 최초 조회 | `error` 또는 `loading` | 최초 오류와 아직 결과를 얻지 못한 로딩 구별 |

성공한 빈 배열이나 공통 조합의 select 결과 `undefined`도 성공이다. 데이터의 truthiness만으로 로딩·실패로 바꾸지 않는다. 정상 0건·0원은 성공한 결과에서 계산하고, 최초 실패를 빈 결과로 대신하지 않는다.

예를 들어 **표시 online·실제 offline**에서는 성공한 캐시가 있으면 ready로 보이지만 재조회는 막힌다. 캐시가 없는 항목은 실제 정책의 blocked가 된다. 반대로 표시 정책 자체가 막히면 캐시가 있어도 blocked다. 화면이 raw `query.data`를 직접 노출하면 이 구분을 우회하게 된다.

### 조회 완료와 대상의 존재를 따로 확인한다

`actions.refetch`는 여행 미선택·disabled·정책 제한이면 이유가 있는 `blocked`를 반환한다. 실행했다면 `finished` 안에 Query 결과를 반환한다. **finished는 조회 성공과 같지 않다.** 기본 재조회 오류도 결과 안에 남으며, `throwOnError: true`를 주면 오류를 throw하는 옵션을 전달한다.

목록 조회 성공과 특정 ID의 존재 여부는 별개다. [경비 상세](../../../../apps/client/src/screens/ExpenseDetailScreen.tsx)는 대상 검색을 화면에서 맡고, 목록 캐시에 대상이 없더라도 조회 중이거나 오류라면 즉시 부재로 확정하지 않는다. 화면별 부재·재시도 처리가 모두 동일하게 완성됐다는 뜻은 아니다. 기존 경비 상세의 특정 재시도와 삭제 실패 이유 처리는 보류 범위로 남아 있다.

### 현재 조회 재사용을 전역 계층 예외로 확대하지 않는다

현재 조회 조합은 여행 범위를 아는 앱 전용 서비스이며 domain과 무관한 Query 라이브러리가 아니다. 조회 feature의 공개 훅을 폼·다른 소비자가 재사용하는 현재 구현을 설명하는 것이, 모든 feature 간 의존을 허용한다는 규칙은 아니다. Project-wide 예외 채택은 보류돼 있으며 그 선택과 최소 발췌는 [형성 근거](_background/evidence.md#조회-조합과-화면-표현)에 보존한다. 다른 의존으로 확대할 때는 별도 판단이 필요하다.

## 화면마다 보존할 내용과 표시 책임

| 화면·영역 | 연결 제한 또는 실패 때 유지할 것 | 표현을 맡는 위치 |
| --- | --- | --- |
| 비활성 여행의 일정·경비 목록/상세 | 캐시는 유지하되 표시 정책이 막히면 내용을 가림. 허용 상태의 갱신 실패는 기존 내용 유지 | 각 화면과 조회 조합의 `view` |
| 홈의 대표 여행 카드 | 여행 기본 정보는 유지하고 일정·경비 요약을 각각 판정 | MainTripSection의 데이터 집계, TripSummary의 표시 |
| 계정 전체 여행 목록 | 이미 아는 여행 기본 정보와 선택을 보존하는 별도 계약 | [여행 목록·선택 계약](#router와-계정-전체-여행-목록의-계약) |
| 이미 열린 작성 폼 | 보존 기준은 입력값·기존 연결 설명 유지와 실행 불가 영역만 제한. 현재 일정 수정 화면에는 구현 차이가 있음 | 아래 작성 계약과 현재 구현 차이 |

홈은 기존 조회 `view`를 그대로 소비하며 MainTripSection은 ready 데이터만 일정 수·통화별 금액으로 가공한다. TripCard는 배치를, TripSummary는 공간에 맞는 정상·로딩·제한·오류 표현을 맡는다. 동일한 상태 타입이나 정책을 홈 전용으로 다시 만들지 않은 이유다.

- **두 요약이 모두 blocked:** 현재 같은 여행의 Schedule·Expense 읽기 정책과 선행 제한이 같으므로 공동 안내 하나를 표시한다. 두 정책이 달라지면 이 전제와 검사를 함께 재검토한다.
- **한쪽만 ready:** 정상 요약을 유지하고 나머지 항목의 제한·실패를 표시한다. 표시 online·실제 offline에서 한쪽 캐시만 있는 경우도 전체 제한으로 덮지 않는다.
- **갱신 실패:** 기존 숫자와 해당 항목의 실패 안내를 함께 표시하고, 다시 실행할 수 있을 때 그 항목의 재조회 행동을 제공한다.

`reasonCode: offline-inactive`는 홈의 문구를 해당 여행에 맞추는 구별값이다. 문구나 네트워크를 다시 추정해 인증·활성 확인 제한을 오인하지 않으며 권한·pending·복구 행동은 기존 정책 결과를 사용한다. 이는 모든 화면을 같은 오류 박스로 만드는 계약이 아니다.

## 연결 복귀와 데이터 갱신

**네트워크 재확인은 관측을 갱신하고, 데이터 재조회는 Query를 실행한다.** 확인 버튼이나 앱 복귀가 곧 모든 API의 재실행·성공을 뜻하지 않는다.

| 계기 | 현재 연결 | 완료의 의미 |
| --- | --- | --- |
| unknown 재확인·앱 복귀 | Network Store의 기존 refresh 공유 | 관측 요청의 대기 종료. online이나 데이터 조회 성공 보장은 아님 |
| 일정·경비 접근이 다시 허용됨 | 구체 조회 hook의 `enabled` 조건 회복 | 유효한 캐시는 다시 표시할 수 있음. 데이터가 없거나 stale이면 Query 조건에 따라 조회 |
| 여행 목록의 실제 연결·인증 상태 변화 | 앱에 한 번 연결한 `useTripListRefresh`가 이전 조회 취소 후 갱신 요청 | Router가 DB/API를 선택. 표시 강제값·확인 진행만 바뀌면 목록을 새로 조회하지 않음 |
| 로그인 완료·mutation·활성화 변경·sync | 해당 경로가 필요한 Query를 무효화·갱신 | 인증·저장 작업의 완료와 후속 화면 조회의 성공은 별개 |
| 사용자가 다시 불러오기 선택 | 허용된 `actions.refetch` 실행 | blocked 또는 Query 결과 확인. 진행 중에는 해당 UI가 중복 입력 제한 |

현재 전역 Query 설정은 focus/reconnect 자동 재조회를 끄고, 기본 freshness는 5분이다. 따라서 “연결 복귀마다 모든 조회가 다시 실행된다”고 설명하지 않는다. 일정·경비의 유효한 캐시가 복귀 즉시 다시 보이는 것과 서버를 새로 조회한 것은 다르다. 실제 설정은 [queryClient](../../../../apps/client/src/shared/lib/queryClient.ts)와 Entity hook에서 확인한다.

[취소 후 갱신 helper](../../../../apps/client/src/shared/lib/query-refresh.ts)는 데이터가 없는 최초 조회까지 취소한 뒤 invalidate를 요청한다. 최초 요청을 공유해 변경 전 결과가 늦게 적용되는 일을 피하기 위한 순서다. helper는 취소를 기다리지만 새 조회의 완료는 기다리지 않는다. 여행 목록의 응답 보존·출처·fallback·선택 변경은 위 [여행 목록 계약](#router와-계정-전체-여행-목록의-계약)을 따른다.

## 작성과 읽기의 제한을 구별한다

**작성 계약:** 이미 열린 일정·경비 생성/수정의 초안은 네트워크 상태가 바뀌어도 같은 입력 소유자와 폼을 유지해야 한다. `allowed: false`를 이유로 작성 화면 전체를 제한 안내로 바꾸거나, `manual-only`를 이유로 별도 폼으로 교체하지 않는다. 기본 입력은 계속 보여 주고, 장소 검색·일정 조회·저장처럼 현재 실행할 수 없는 영역에 정책 안내를 둔다. 저장 오류도 초안에 붙여 보존하며 연결이 복구됐다는 이유로 자동 제출하지 않는다. 사용자가 다시 저장할 때 Router가 최신 실행 조건을 확인한다.

**현재 구현 차이:** [UpdateScheduleDrawer](../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)는 `policy.schedule.update.allowed === false`이면 입력 영역 대신 Drawer 전체에 제한 안내를 반환한다. 따라서 비활성 여행의 일정을 수정하다 offline/unknown으로 바뀌는 경우 기본 입력을 계속 보이게 한다는 계약을 충족하지 못한다. 폼 상태를 소유한 hook은 이 분기보다 앞에 있다. 제어된 online→offline/unknown→online 검사에서는 같은 항목을 계속 연 채 수정한 제목·확인한 시각이 복귀와 명시적 재저장 payload까지 유지됐고 자동 제출은 없었다. 입력 표시·편집 계약의 불충족은 그대로 남는다. 제한 중 TimeField의 미확정 선택은 해제되므로 폼 값과 같은 수명으로 보지 않는다. 실제 부모의 닫기·재열기와 확인 범위는 [초안 수명](../writing-and-input/drafts.md)에서 구별한다. 이 확인을 실제 인터넷 단절·native 동작 전체의 검증으로 확대하지 않는다.

일정·경비의 읽기 목록·상세는 별도 계약이다. 비활성 여행이 offline/unknown이면 기존 query cache를 삭제하지 않고 목록·상세 공개와 새 조회를 제한한다. 이미 편집 중인 초안의 값과 기존 연결 설명을 유지하는 것은 이 읽기 제한을 해제하는 일이 아니다. 일정 후보는 `useTripSchedulesReadQuery`가 공개하는 결과에서만 제공하며, 저장 위치를 UI에서 직접 선택하지 않는다.

활성 여행의 경비 생성·수정은 offline/unknown에도 `full`이다. 연결 대상은 같은 여행의 Local 일정이므로 온라인 검색 서비스처럼 제한하지 않는다. Expense의 날짜와 Schedule의 날짜는 독립적이고, 연결은 같은 여행 일정 하나에 대한 선택적 관계다. 모든 날짜의 일정을 날짜·시간순으로 제공하고, 날짜 변경은 기존 연결을 해제하지 않는다. 비활성 여행의 일정 목록이 제한되면 새 연결 선택을 막되 이미 열린 초안의 연결은 설명하고 해제할 수 있다. 이 경우에도 서버 저장은 복구 전까지 제한된다. 날짜와 연결을 독립적으로 정한 이유와 당시 발췌는 [형성 근거](_background/evidence.md#경비-초안과-일정-연결)에 있다.

### 수동 기록과 좌표 보완

일정 작성은 온라인 장소 검색이 제한돼도 텍스트 입력을 유지한다. [일정 제출](../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)은 선택한 장소가 없으면 좌표를 `null`로 보낸다. [일정 지도](../../../../apps/client/src/features/schedule/schedule-map-view/ScheduleMapViewContainer.tsx)는 좌표가 있는 일정만 마커 대상으로 전달하므로, 저장에 성공했어도 지도에는 표시되지 않을 수 있다.

[일정 수정 화면](../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)은 수정 정책이 허용된 상태에서 장소명이 있고 위도 값이 없는 일정에 좌표 없음 안내를 보여 주고, `searchMode === 'api'`이면 장소 재검색을 제공한다. 사용자가 검색 결과를 선택하고 저장하는 보완 경로이며 연결 복구가 자동 좌표 보완을 뜻하지 않는다. 입력·지도·수정 흐름을 바꿀 때는 기록 보존과 좌표가 필요한 기능의 사용 가능성을 함께 확인한다.

Service Layer는 `policy.service`를 기준으로 선택한다.

```tsx
const policy = useAppPolicy(tripId);

if (policy.service.mapProvider === 'none') {
  return <MapUnavailableView />;
}
```

## 오류와 제한은 발생한 영역에서 표현한다

정책 제한은 `view.kind === 'blocked'`의 정책 결과를 `PolicyErrorDisplay`의 `policy` prop으로 전달한다. pending·복구 행동·재확인 중 상태는 기존 컴포넌트를 재사용한다. 홈처럼 좁은 영역의 배치는 해당 UI가 맡는다. 이미 열린 폼 전체를 이 안내로 교체하지 않는다. 제한 사유는 사용자가 자신의 상태와 가능한 행동을 알 수 있는 말로 설명하고 내부 구현명을 노출하지 않는다.

Data hook의 `queryFn`·`mutationFn`은 오류를 호출부로 전달하고 화면은 최초 실패·갱신 실패·저장 실패를 구별한다. 제한 문구와 오류 문구를 비교해 행동을 추정하지 않는다. 사용자 안내에 토큰·SQL·stack trace를 노출하지 않으며, 존재하지 않는 중앙 오류 서비스를 전제로 새 경로를 만들지 않는다. 서버의 공개 응답 계약은 별도 API 경계에서 확인한다.

<a id="변경-규칙"></a>

## Entity·Service 권한을 바꾸면 정책표와 소비자를 함께 확인한다

새 Entity의 권한을 추가할 때는 Policy의 `types.ts`, `constants.ts`, `useAppPolicy.ts`, `index.ts`의 export 흐름을 함께 확인한다. 새 Service 권한이라면 [ServicePolicy·ServicePolicyTable](../../../../apps/client/src/shared/policy/types.ts), [SERVICE_POLICIES](../../../../apps/client/src/shared/policy/constants.ts)와 그 값을 전달·사용하는 실제 소비자를 대조한다. 타입·정책표 변경만으로 화면 적용까지 끝난 것은 아니다.

정책 변경은 UI·feature의 동작을 바꾸므로 필요한 경우 decision record에 선택 이유를 남긴다. 변경한 기능에 해당하는 상태 조합, 조회·표시·작성 계약과 실제 소비자를 함께 확인한다. 모든 작업에 같은 확인 항목을 추가하는 대신 그 변경이 영향을 주는 조건을 고른다.

## 현재 코드 경로

| 책임 | 현재 위치 |
| --- | --- |
| Policy constants | `apps/client/src/shared/policy/constants.ts` |
| Policy types | `apps/client/src/shared/policy/types.ts` |
| App policy hook | `apps/client/src/shared/policy/useAppPolicy.ts` |
| Policy exports | `apps/client/src/shared/policy/index.ts` |
| Policy UI | `apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx` |
| 실제 관측·화면 강제값·재확인 | [Network Store](../../../../apps/client/src/shared/store/network.ts) |
| 조회 접근·상태·실행 조합 | [policy-query](../../../../apps/client/src/shared/services/policy-query) |
| 구체 일정·경비 조회 | [read-schedules](../../../../apps/client/src/features/schedule/read-schedules), [read-expenses](../../../../apps/client/src/features/expense/read-expenses) |
| 홈 요약 표시 | [MainTripSection](../../../../apps/client/src/screens/HomeScreen/MainTripSection.tsx), [TripSummary](../../../../apps/client/src/entities/trip/ui/TripSummary.tsx) |

## 관련 근거와 갱신 범위

[형성 맥락](_background/context.md)은 Data/Service 분리, 조회 조합·홈 표현, 목록·초안 보존과 관측 수명을 현재처럼 나눈 이유를 설명한다. 중요한 선택·기각 대안·사용자 발췌는 [형성 근거](_background/evidence.md)에 보존한다. 기능을 적용할 때 필요한 조건은 이 본문에서 읽고, 선택 자체를 재검토할 때 형성 자료를 함께 본다.

변경 검증의 기존 출발점은 [Network Store 검사](../../../../apps/client/tests/shared/store/network.test.ts), [조회 계약 검사](../../../../apps/client/tests/shared/services/policy-query/read-query.test.tsx), [화면 소비자 검사](../../../../apps/client/tests/screens/read-query-consumers.test.tsx), [여행 목록 갱신 검사](../../../../apps/client/tests/application/trip-list-refresh.test.tsx)다. 이들은 제어된 NetInfo·repository와 Query·화면 연결을 확인한다. Debug 표시 전환이나 대역 검사를 실제 인터넷 단절·백그라운드 Wi-Fi 전환의 증거로 확대하지 않는다. 폼은 보조 조회 검사와 입력 표시·값 보존 검사가 같은 범위를 확인하는지 구별한다.

네트워크 관측·정책·목록·조회·표시를 바꾸는 담당자는 영향받는 본문과 실제 소비자를 함께 맞춘다. 복구 토스트를 추가하지 않는 선택, 경비 상세의 특정 재시도·삭제 실패 이유 처리 보류와 전역 FSD 예외 미채택은 해당 설명과 형성 자료에서 구별해 유지한다. 서버 응답·오류 전달 경계를 바꾸면 [API 계약](../api-contracts.md)도 대조한다. 작업별 이관 경위와 검사 실행 결과는 해당 Workspace가 소유한다.
