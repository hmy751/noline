# 06 — 앱 준비·인증 상태·첫 화면·초기 작업 연결

## 맡은 결과와 범위

앱을 켰을 때 네트워크·DB·인증 준비, Splash 해제, 첫 화면 선택과 인증 후 작업 시작이 어떤 조건으로 이어지는지 가까운 코드에서 이해하고 수정할 수 있게 한다. 서로 다른 boolean·effect·고정 지연에서 준비 상태를 다시 추론하는 부담을 줄이고 각 소비자가 필요한 상태를 사용하게 한다. 범용 startup framework나 폴더 재편은 목표로 삼지 않는다.

Ticket의 네트워크 계약은 **관측과 실제 요청·화면·sync 시작의 연결**이다. 현재 실행은 확대 구현 철회 뒤 사용자가 파일별로 확인하는 코드 품질 보완이며, 아래 전체 계약의 미구현을 자동 추가 작업으로 삼지 않는다. 2026-09-15~16 논의에서 사용자는 Network Store 내부 개선과 정책 구체화를 먼저 선택했고, 직접 필요한 수정은 003으로 분리하지 않고 여기서 함께 수행하기로 했다. 첫 Store 단계와 필요한 소비부 호환 수정을 구현했다. 선택 이유와 조사 근거는 [논의 기록](../../../records/2026-09-16-01-network-policy-and-implementation-boundaries.md)에 있다.

첫 범위가 만들 결과는 다음과 같다.

- 최초 확인 전이나 실제 관측이 불확실할 때 임시 online으로 Remote 요청·sync를 열지 않는다.
- 활성 여행의 Local 이용은 이어지고, 비활성 여행은 같은 정책에 따라 요청 제한과 화면 안내를 제공한다.
- 네트워크 변화가 여행 활성화·사용자 선택을 바꾸지 않으며 복구 뒤 현재 화면이 자연스럽게 돌아온다.
- 기존 debug 네트워크 강제 설정은 화면 시뮬레이션에 사용하고 실제 요청 판단과 구별한다.
- Store 초기화·관측 변환·구독 정리·재확인과 소비자의 책임을 코드에서 직접 읽을 수 있다.

[14번](14-local-mutation-router-transaction.md)과 겹치는 대상 여행별 Router 분기·inactive child의 Local 선조회 문제는 이 연결을 막는 범위에서 함께 정상화한다. 14는 그 결과를 재사용하고 Local mutation·queue 원자성과 타입·cache invalidation의 나머지 범위를 맡는다. [15번](15-sync-result-retry-pull-types.md)은 sync push·pull·FAILED 재시도와 결과 의미, [16번](16-unsynced-data-cleanup.md)은 cleanup 보존 조건, [08번](08-date-selection-grouping.md)은 대표 여행의 순수 계산을 계속 맡는다. 003 자료는 관련 재현 근거로 사용하며 003 전체를 이번 수정 범위로 옮기지 않는다.

DB·auth 실패 처리, 인증 route guard, Splash와 나머지 initializer 연결은 Ticket 06의 후속 범위다. 다만 첫 sync에 실제 DB 사용 가능·인증 준비가 필요한 조건과 네트워크 변화에 따른 선택 유지는 이번 연결에 포함한다.

## 실행 맥락과 현재 코드의 차이

Noline은 Selective Local-First다. 활성 여행의 Trip·Schedule·Expense는 Local SQLite가 기준이고 Local 변경은 sync_queue로 전달한다. 비활성 여행은 Server API가 기준이다. 지도·검색·길찾기는 Network-First Service이며 여행 Data Entity의 Local/Remote 분기와 같은 저장 계약으로 취급하지 않는다.

앞선 Main 조사와 이번 문서 대조에서 확인한 구현 출발점은 다음과 같다. 실행 기기에서 재현한 전체 제품 결과로 확대하지 않는다.

- [Network Store](../../../../../../../apps/client/src/shared/store/network.ts)는 초기 unknown, 순수 관측 변환, listener 기반 init과 cleanup, 10초 확인 불가 안내·수동 refresh를 구현했다. 실제 실행 상태와 화면 override의 읽기 경계를 구별한다. 초기의 임시 online·null 축약·앱의 추가 fetch는 제거했다.
- [Root](../../../../../../../apps/client/app/_layout.tsx)는 첫 네트워크 결과를 기다리지 않고 DB·auth 초기화를 이어간다. 준비 flag와 실제 성공 여부, 반복 초기화·cleanup의 연결을 구별할 필요가 있다.
- [Activation Router](../../../../../../../apps/client/src/shared/services/offline-prep/router.ts)는 실제 online일 때만 Remote를 열도록 호환 수정했고, override 중 Router mutation은 Local/Remote 모두 거부한다. Trip mutation의 전역 활성 여행 존재 판단은 여전히 수정 대상 여행의 활성 여부와 달라 후속 정상화가 필요하다.
- [Schedule repository](../../../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts)와 [Expense repository](../../../../../../../apps/client/src/entities/expense/repository/expense-repository.ts)의 update/delete는 tripId를 찾기 위한 Local 선조회 때문에 inactive Remote 경로가 실패할 수 있다.
- [Policy hook](../../../../../../../apps/client/src/shared/policy/useAppPolicy.ts)은 unknown의 제한 모드를 기존 offline 권한 표로 처리해 없는 key 조회를 막았다. unknown 안내 이유·내용 제한과 활성 여부 로딩의 후속 연결은 남아 있다.
- [SyncProvider](../../../../../../../apps/client/src/shared/services/sync/provider.tsx)의 시작 조건과 중복 방지는 Store·Root 준비 조건에 연결해야 한다. syncStrategy 선언의 존재만으로 실행 조건이 적용됐다고 보지 않는다.
- [QueryClient](../../../../../../../apps/client/src/shared/lib/queryClient.ts)와 조회 화면에는 이전 서버 응답이 남을 수 있다. 요청 중단만으로 제한 화면이 나타나지는 않으며, 조회 불가가 빈 목록과 합쳐지지 않아야 한다.
- 폼의 일반 오류 안내가 Router의 제한 이유를 덮을 수 있다. 대표 수정 Drawer는 성공 때 닫고 실패 때 일반 안내를 하지만 모든 생성·삭제 경로의 입력 유지까지 검증된 것은 아니다.

온라인 비활성 여행의 생성·수정·삭제 지원은 기존 계약이다. Local 선조회·잘못된 분기·Trip client PATCH와 server PUT 불일치는 그 계약을 막는 구현 문제로 대조한다. Trip 신규 생성은 아직 대상 여행 활성 정보가 없는 경우이므로 기존 생성 흐름을 확인해 분기 입력을 정한다. 새로운 사용자 허용 정책을 요구하는 항목으로 되돌리지 않는다.

## 채택한 네트워크·화면 정책

### 실제 관측과 unknown

unknown은 인터넷 연결 가능 여부가 아직 확정되지 않은 상태이며 초기값이다. 초기뿐 아니라 이후 관측이 다시 불확실해진 경우에도 사용한다. NetInfo 입력을 다음 우선순위로 변환한다.

1. isConnected 또는 isInternetReachable 중 하나라도 명시적으로 false이면 offline.
2. 둘 다 true이면 online.
3. 나머지 null·미확정 조합은 unknown.

인터넷 도달 여부는 NetInfo가 확인하는 연결 신호이며 Noline 서버의 정상 응답을 보장하지 않는다. 개별 timeout·서버 오류는 해당 요청에서 처리하고 전역 offline으로 바꾸지 않는다. 앱의 초기 확인 작업이 결과 없이 실패한 경우는 unknown을 유지하되, NetInfo가 실제 false 결과를 전달하면 위 규칙대로 offline을 적용한다.

네트워크 확인 때문에 앱 전체 Splash를 붙잡지 않는다. DB·auth 초기화와 활성 여행의 Local 이용을 계속하며 비활성 여행 Remote 조회·Network-First Service·sync 시작은 실제 online까지 기다린다. 관측 결과는 늦게 와도 반영한다.

unknown 안내는 비활성 여행 내용의 제한 영역에서 처음에 연결 확인 중으로 표시하고, **10초 동안 확정되지 않으면** 확인 불가 안내와 재확인 행동을 제공한다. 10초는 UI 안내 전환 시간이며 네트워크를 offline으로 만드는 deadline이나 HTTP timeout이 아니다. 같은 unknown 관측의 반복으로 대기 시간을 계속 연장하지 않는다. 확인 작업의 명시적 실패는 확인 불가로 안내할 수 있다.

재확인은 기존 listener를 유지한 채 NetInfo.refresh로 현재 관측을 다시 요청하는 설계를 사용한다. refresh가 반환됐다는 이유만으로 online으로 바꾸지 않는다. 후속 reachability 결과는 listener로 받을 수 있다. 재확인 자체만으로 기존에 확정된 상태를 unknown으로 강제 초기화하지 않으며 실제 관측을 따른다. 반복 클릭·늦은 응답·명시적 재확인 때의 안내 시간 재시작은 하나의 흐름으로 구현한다.

### 여행 선택과 제한 화면

여행 활성화와 현재 보고 있는 여행 선택은 서로 다르다. 네트워크 변화는 어느 쪽도 자동 변경하지 않는다.

- 탭과 이미 알고 있는 여행의 존재·기본 정보는 유지한다. 서버에서 한 번도 받은 적 없는 여행 목록을 오프라인에서 새로 얻을 수 있다는 보장은 아니다.
- 활성 여행의 일정·경비는 Local 데이터를 계속 사용한다.
- 이미 offline인 상태에서 비활성 여행을 선택하려 하면 기존 선택을 유지하고 연결 뒤 선택할 수 있다고 안내한다. unknown에서도 비활성 Remote 접근을 열지 않는 같은 기준을 적용한다.
- 비활성 여행을 보던 중 offline/unknown이 되면 선택은 유지하며 일정·경비 내용 대신 제한 안내를 보여 준다. 오프라인 준비된 활성 여행이 있으면 돌아갈 행동을 제공한다.
- 활성 여행이 없더라도 목록·탭을 유지하고 현재 이 기기에서 사용할 수 있는 여행이 없음을 설명한다.
- offline과 unknown은 같은 내용 영역에서 제한 이유를 바꾼다. 탭·선택을 닫았다 다시 열거나 별도 전환 상태를 만들 필요는 없다.

여기서 React Query 캐시는 이전 서버 조회 결과가 메모리에 남은 것이다. 활성 여행의 Local SQLite와 다르다. **캐시는 그대로 두고 화면에서 정책에 따라 내용 또는 제한 안내를 선택한다.** 캐시 삭제·별도 복제·독립 cache 관리 시스템을 만들지 않는다. 조회 hook을 중단해도 기존 data가 남을 수 있으므로 data 유무만으로 접근을 허용하지 않는다. 이 제한 때문에 작성 중인 폼이 초기화되거나 닫히지 않게 연결한다.

실제 online으로 돌아왔을 때 같은 비활성 여행을 계속 보고 있다면 해당 내용을 재조회하고 성공 뒤 복구한다. 사용자가 다른 여행으로 이동했으면 이전 여행으로 강제 복귀하지 않는다. 실제 오프라인 제한에서 복구한 조회가 성공하면 같은 장애에 대해 토스트를 한 번 표시한다. 초기 unknown→online이나 단순 재확인 완료에는 복구 토스트를 붙이지 않는다. 복구 조회 실패는 일반 오류·재시도 안내로 처리한다.

### 연결이 반복되는 경우

weak/degraded 상태나 선제적인 debounce·NetInfo 시간 조정은 추가하지 않는다. 일정 정도의 전환은 허용하되 여행 자동 변경, 불필요한 화면 재생성, 중복 sync와 반복 복구 토스트는 막는다.

설치된 NetInfo 11.4.1 소스와 앞선 mock 특성화에서는 정상 online의 주기적인 확인마다 true→null→true가 반복되지 않았다. iOS는 해당 버전에서 JS reachability probe를 사용하고 Android는 native reachability를 사용할 수 있어 동작을 일괄 가정하지 않는다. 이 근거로 정책을 결정했으며 실기기 발생 빈도를 측정한 결과는 아니다. 실기기 확인은 정책 결정의 선행 조건으로 두지 않았고, 실제 반복 부작용이 확인되면 debounce·설정 시간을 재검토한다.

## 쓰기 차단과 오류 전달

debug override가 없는 정상 동작에서 활성 여행은 unknown/offline이어도 기존 Local mutation·sync_queue 경로를 사용한다. 비활성 여행은 실제 online에서 서버로 생성·수정·삭제하며, offline/unknown에서는 Remote 요청을 시작하지 않는다.

버튼마다 unknown 조건을 복제하지 않는다. **Activation Router가 실행 순간의 상태를 확인해 요청을 막고 제한 이유를 오류로 전달하며, 기존 mutation 오류 처리 흐름이 사용자에게 안내한다.** Router가 Alert·toast 같은 UI를 직접 실행하지 않는다. 이미 있는 정책·오류 표시 패턴을 활용하고 일반 저장 실패 안내가 제한 이유를 덮거나 같은 오류가 두 번 표시되지 않게 연결한다.

예를 들어 비활성 여행의 수정 폼을 작성하던 중 unknown이 되어 저장을 눌렀다면 Router가 서버 전송 전에 거부한다. 입력 요소는 사용할 수 있고 폼은 닫거나 초기화하지 않는다. 별도 draft 저장·쓰기 예약·복구 후 자동 저장은 만들지 않으며 사용자가 다시 실행한다. 화면의 제한 안내와 실행 시점 차단은 같은 정책을 소비하지만 서로를 대신하지 않는다.

이미 online에서 전송한 뒤 통신 오류가 생긴 경우는 일반 서버 기반 앱의 요청 처리로 다룬다. 중간 네트워크 상태 변화만으로 전송 중 요청을 취소하거나 자동 재전송하지 않는다. 오류 안내·입력 유지·사용자 재시도 흐름을 사용한다. 별도의 결과 추적·복구 시 자동 대조 시스템은 이번 범위에 추가하지 않는다. 서버 반영 후 응답만 유실됐을 가능성은 일반 요청의 한계로 남으며, 관련 재시도 경로를 확인할 때 중복 방지 계약을 검증 없이 보장하지 않는다.

## Debug 네트워크 강제 설정

기존 debug 화면과 realStatus·overrideStatus 필드를 활용한다. 별도의 앱 전체 debug 모드 관리 시스템은 추가하지 않는다. overrideStatus가 null이 아닌 동안 다음을 적용한다.

- 화면의 online/offline/unknown 표시와 제한 이유는 강제 상태로 시뮬레이션한다.
- 실제 조회·서비스 요청 가능 여부는 실제 관측값을 사용한다. 강제 online이 실제 offline/unknown의 Remote 접근을 열지 않는다.
- Trip·Schedule·Expense 쓰기와 새 sync 전송은 막는다. Local 변경·queue 추가도 이후 서버 전송으로 이어지므로 쓰기 차단에 포함한다.
- 강제 설정을 해제하면 실제 상태 기준의 정상 동작으로 돌아간다. 이미 전송된 요청의 취소·원복을 보장하지 않는다.

따라서 표시를 online으로 강제해도 실제 연결이 없으면 데이터 조회는 거절될 수 있다. 진단 화면에서 실제 상태와 강제 상태를 구분해 볼 수 있게 한다. 개발 메뉴 노출 조건인 __DEV__는 서버 데이터 격리의 증거가 아니다.

앞선 로컬 설정 조사에서는 development가 LAN API·로컬 PostgreSQL noline_dev, production이 Render API·Neon PostgreSQL을 가리켰다. 실행 중 앱의 빌드 환경, 배포 서버의 실제 환경변수와 데이터 격리는 확인하지 않았다. 이번에는 화면 확인과 쓰기 차단에 한정하고, 실제 쓰기를 포함한 debug 실험은 환경 격리를 확인한 뒤 별도로 판단한다.

## 구현 접근과 남은 구체화

정책 인터뷰에서 큰 선택은 정리됐다. 다음은 Main이 기존 코드를 대조해 구체화할 실행 설계이며 새로운 범용 정책 프레임워크를 요구하지 않는다.

1. Network Store에 단일 상태 타입·순수 관측 변환, 초기 unknown, 중복 init 방지·cleanup·늦은 callback 억제와 10초 안내 연결을 만든다. 앱이 추가하는 중복 첫 fetch는 줄이되 라이브러리 내부의 native 조회까지 한 번이라고 보장하지 않는다.
2. 실제 관측을 사용하는 요청 판단과 화면용 override 선택을 구별한다. React hook과 비React Router에서 같은 작은 순수 판단을 재사용하고 data 계층에서 UI hook을 호출하지 않는다. 활성 여부 로딩과 tripId 전달도 이 경계에서 확인한다.
3. 대상 여행별 Local/Remote 분기, inactive child의 불필요한 Local 선조회와 실제 온라인 mutation 경로를 정상화한다. Trip 신규 생성·PATCH/PUT는 기존 계약을 대조해 필요한 수정 담당을 07·17과 맞춘다.
4. 기존 useAppPolicy·제한 표시·NetworkStatusIndicator·mutation 오류 흐름을 연결한다. Query 캐시는 유지하고 화면 제한·현재 여행 복구 조회를 기존 React Query 흐름에 붙인다.
5. sync 시작 조건은 DB 사용 가능, auth 초기화·인증 완료, 실제 online, debug 쓰기 차단 해제와 동시 실행 여부를 함께 확인한다. provider mount와 네트워크 복구가 겹쳐도 같은 실행을 중복 시작하지 않게 한다. engine 결과·queue 재시도 내부는 15의 범위다.
6. background→active에서 현재 연결을 한 번 재확인하는 연결을 검토한다. 이전에 online/offline이었어도 foreground에서 stale할 수 있으므로 unknown만 재확인한다는 초기 후보를 고정하지 않는다. 별도 주기 polling이나 foreground 진입 때 강제 unknown은 추가하지 않는다.

네트워크 신호가 늦어도 진입할 수 있다는 합의와 DB·auth 자체가 실패한 경우의 진입 정책은 구별한다. 나머지 startup 범위의 상세 결정은 첫 결과 이후 이어 간다.

## 완료 조건과 확인 방법

첫 범위는 Store 선언만 바꾸거나 Router 단위 검사만 통과한 상태로 완료하지 않는다. 실제 소비 연결까지 다음 사례로 확인한다.

- NetInfo true/false/null 조합, 초기 실패·미응답과 늦은 결과가 합의한 상태로 변환된다. 10초 안내는 반복 null에 무한 연장되지 않으며 상태를 임의 offline으로 만들지 않는다.
- 정상 모드에서 활성 여행은 세 네트워크 상태 모두 Local로 읽고 쓴다. 비활성 여행은 실제 online에서 Remote로 동작하고 offline/unknown에는 서버 호출 횟수가 0이다.
- 다른 활성 여행 A가 있어도 비활성 B의 수정·삭제가 Local로 잘못 가지 않는다. inactive child가 Local에 없어도 online 서버 경로가 성립한다. 관련 차단 결함을 남긴 채 온라인 지원 완료라고 하지 않는다.
- 캐시가 남아 있어도 제한 화면이 나타나고, 성공한 빈 결과·정책 제한·일반 요청 오류가 구별된다. 활성 여행의 Local 내용과 작성 중인 입력은 유지된다.
- online→unknown/offline→online에서 탭·활성 상태·사용자 선택을 유지한다. 같은 비활성 여행의 복구 조회 성공, 실패, 도중 다른 여행 선택, 최초 unknown→online을 구별해 토스트·조회가 중복되지 않는다.
- 저장·삭제의 Router 거부는 기존 오류 흐름에서 정확한 이유로 한 번 안내된다. 버튼별 조건 복제·자동 저장·별도 입력 관리 없이 폼 값이 유지된다.
- 강제 화면 상태가 실제 요청 허용값을 바꾸지 않는다. override 중 Local write·queue insert·Remote mutation·새 sync 전송이 시작되지 않고 해제 후 정상 경로로 돌아간다.
- init·cleanup·재구독·재확인 중 늦은 결과와 반복 호출을 다룬다. DB·auth가 준비되지 않았거나 실제 online이 아니면 sync가 시작되지 않고 동시 trigger는 중복 실행하지 않는다.
- 기존 코드 대비 조건·오류·상태 타입의 중복이 줄고 관측·표시·요청의 차이를 가까운 코드에서 설명할 수 있다.

순수 변환·Store는 지연 Promise와 fake timer, Router·repository는 Local/Remote 호출 기록, 화면·폼·SyncProvider는 관련 hook/component fixture로 확인하고 변경 경로의 타입·기존 test를 실행한다. 원자성은 이 검사로 증명하지 않고 14의 실제 SQLite 검증에 남긴다. Expo 진입·실기기 NetInfo 빈도·외부 API를 실행하지 않았다면 미확인으로 보고한다.

## 현재 상태와 실제 결과

2026-09-18 현재는 사용자와 파일별로 검토한 가독성·책임 정리와 명시적으로 채택한 Network Store·SyncProvider 변경을 저장했다. 앞선 확대 워커 구현은 철회된 이력으로 보존하며, 배경 네트워크 계약의 전체 구현을 이번 품질 변경의 완료 조건으로 확대하지 않는다. 상세 선택·검증·커밋 경계는 [파일별 검토와 레이아웃 기록](../../../records/2026-09-18-01-network-provider-layout-review-and-commits.md)에 있다.

- Network Store는 realStatus/useRealNetworkStatus와 useDisplayNetworkStatus를 구분한다. private session 안에서 구독·unknown 안내·공유 refresh Promise를 관리하며 performRefresh의 관측 반영은 요청 실패 catch 밖에서 수행한다. enum 전환은 아래 추후 메모만 유지한다.
- Policy는 unknown에 기존 offline 권한 표를 사용하며 CRUD 권한 선택 중복과 타입 중복을 정리했다. Router는 실제 online Remote·override 쓰기 차단을 유지한다. 대상 Trip mutation의 전역 활성 판단 문제는 남아 있다.
- SyncProvider는 ref 잠금으로 같은 렌더의 중복 진입을 막고 실패 시 잠금을 해제한다. 완료된 실행 뒤 재실행, 기존 성공 시각 유지, 주기 타이머 수명은 테스트했다. 후속 동시 호출은 기존 실행을 기다리지 않고 반환한다. DB/auth 준비 연결과 DebugScreen의 engine 직접 수동 호출은 남는다.
- Root는 초기화·인증 라우팅·인증 후 작업을 같은 `_layout.tsx`에서 관리한다. 사용자 결정에 따라 별도 features/application 폴더나 컴포넌트 파일로 분리하지 않았다. initializer 이름·Store 구독·cleanup 함수·로그를 정리했고 DB/auth 실패 진입과 여행 선택의 기존 동작은 확장하지 않았다.
- Debug 표시·재확인, Home 예제 제거, ScheduleCard 이벤트 타입과 Policy 타입 정리를 함께 저장했다.

레이아웃 테스트 15개는 개선 전후 통과했다. 최종 전체 client Jest는 8개 suite·108개 test 통과이며, 현재 Provider 테스트 9개는 mock 엔진 기준이다. 남은 6개 제품/테스트 파일의 Prettier 통과, ESLint는 Prettier 연동 규칙 제외 시 오류 0개·경고 9개다. client typecheck에는 기존 지도 오류 3개가 남는다. 실제 기기·native·SQLite·서버, 복구 후 선택 보존 전체, DB/auth 실패 UX는 검증하지 않았다.

제품 저장 경계는 `c578446`(Network), `6efdfed`(Policy·Router·Provider와 테스트), `0ce6f4d`(레이아웃·테스트와 남은 화면/타입)다. Ticket 06 전체 구현·최종 수락은 남는다. 기록은 사용자 요청의 수동 반영이며 자동 Maintain freshness·실패 generation·machine status를 갱신하지 않는다.

## 추후 개선 메모 — NetworkStatus enum 전환

2026-09-18 사용자는 enum 전환을 추후 개선 후보로 메모하도록 요청했다. 이번에는 영향 범위만 확인했으며 현재 구현 범위에 추가하거나 enum으로 변경하지 않았다. 목적은 문자열로 반복하는 네트워크 상태 표현을 명시적인 멤버로 읽기 쉽게 만드는 것이다.

전환을 검토할 때는 `NetworkStatus.ONLINE = 'online'`, `OFFLINE = 'offline'`, `UNKNOWN = 'unknown'`처럼 기존 문자열 값을 유지한다. `NetworkCheckStatus`는 이 후보에 포함하지 않는다. 아래 경로는 `apps/client/` 기준이다.

- **최소 수정 5개 파일:** `src/shared/store/network.ts`와 테스트 `tests/shared/store/network.test.ts`, `tests/shared/services/offline-prep/router-network.test.ts`, `tests/shared/services/sync/provider-network.test.tsx`, `tests/shared/policy/useAppPolicy-network.test.ts`. 상태 대입·함수 인자·타입 지정 테스트 표의 문자열을 enum 멤버로 바꿔야 한다. Main은 실제 파일을 수정하지 않고 컴파일러 메모리에서 타입만 enum으로 치환해 이 다섯 파일의 타입 오류 발생을 확인했다.
- **비교 표현까지 통일할 때 추가 8개 파일:** `src/shared/services/sync/provider.tsx`, `src/shared/services/offline-prep/router.ts`, `src/shared/policy/useAppPolicy.ts`, `src/screens/HomeScreen/index.tsx`, `src/features/trip/create-trip/TripDateForm.tsx`, `src/shared/components/Card/ScheduleCard.tsx`, `src/shared/components/Navigation/NetworkStatusIndicator.tsx`, `src/features/debug/ui/DashboardView.tsx`. 기존 문자열 비교는 유지할 수 있으므로 모두 필수 수정은 아니다.
- **타입·export 연결 확인 2개 파일:** `src/shared/policy/types.ts`, `src/shared/policy/index.ts`. `PolicyKey`의 unknown 제외·문자열 조합과 현재 type-only export를 확인한다. 정책 경유로 enum 값을 사용할 경우에는 값 export도 검토한다.

최소 수정은 5개, 표현·타입 연결까지 검토할 범위는 총 15개 파일이다. 현재 직접 사용 범위는 클라이언트 내부이며 서버·schema·DB 변경은 필요하지 않다. 실제 도입 시에는 문자열 값과 정책 key, 연결 판정·요청 조건을 유지하고 기존 네트워크 관련 테스트 및 client 타입 검사로 호환성을 확인한다. enum 도입 자체가 문자열 상수 방식보다 읽기·변경 부담을 줄이는지는 실행 시 다시 판단한다.
