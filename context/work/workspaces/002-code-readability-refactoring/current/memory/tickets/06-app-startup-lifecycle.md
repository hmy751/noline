# 06 — 앱 준비·인증 상태·첫 화면·초기 작업 연결

## 맡은 결과와 범위

앱을 켰을 때 네트워크·DB·인증 준비, Splash 해제, 첫 화면 선택과 인증 후 작업 시작이 어떤 조건으로 이어지는지 가까운 코드에서 이해하고 수정할 수 있게 한다. 서로 다른 boolean·effect·고정 지연에서 준비 상태를 다시 추론하는 부담을 줄이고 각 소비자가 필요한 상태를 사용하게 한다. 범용 startup framework나 폴더 재편 자체는 목표로 삼지 않는다. 앱 전체 준비 책임은 `application`에 두고, 해당 기능의 규칙·서비스와 화면 구성을 각 Owner에 연결한다.

Ticket의 네트워크 계약은 **관측과 실제 요청·화면·sync 시작의 연결**이다. 현재 실행은 기존 startup·sync·인증 구현을 기반으로 인증 요청의 연결 결함과 실패 정합성을 보완하고, 같은 계정 재로그인과 명시적 계정 종료를 분리하는 일이다. 아래 네트워크 전체 계약의 미구현은 남은 범위로 관리하며 자동으로 구현을 확대하지 않는다. 2026-09-15~16 논의에서 사용자는 Network Store 내부 개선과 정책 구체화를 먼저 선택했고, 직접 필요한 수정은 003으로 분리하지 않고 여기서 함께 수행하기로 했다. 첫 Store 단계와 필요한 소비부 호환 수정을 구현했다. 선택 이유와 조사 근거는 [논의 기록](../../../records/2026-09-16-01-network-policy-and-implementation-boundaries.md)에 있다.

첫 범위가 만들 결과는 다음과 같다.

- 최초 확인 전이나 실제 관측이 불확실할 때 임시 online으로 Remote 요청·sync를 열지 않는다.
- 활성 여행의 Local 이용은 이어지고, 비활성 여행은 같은 정책에 따라 요청 제한과 화면 안내를 제공한다.
- 네트워크 변화가 여행 활성화·사용자 선택을 바꾸지 않으며 복구 뒤 현재 화면이 자연스럽게 돌아온다.
- 기존 debug 네트워크 강제 설정은 화면 시뮬레이션에 사용하고 실제 요청 판단과 구별한다.
- Store 초기화·관측 변환·구독 정리·재확인과 소비자의 책임을 코드에서 직접 읽을 수 있다.

[14번](14-local-mutation-router-transaction.md)과 겹치는 대상 여행별 Router 분기·inactive child의 Local 선조회 문제는 이 연결을 막는 범위에서 함께 정상화한다. 14는 그 결과를 재사용하고 Local mutation·queue 원자성과 타입·cache invalidation의 나머지 범위를 맡는다. [15번](15-sync-result-retry-pull-types.md)은 sync push·pull·FAILED 재시도와 결과 의미, [16번](16-unsynced-data-cleanup.md)은 cleanup 보존 조건, [08번](08-date-selection-grouping.md)은 대표 여행의 순수 계산을 계속 맡는다. 003 자료는 관련 재현 근거로 사용하며 003 전체를 이번 수정 범위로 옮기지 않는다.

DB·auth 실패 정책과 Splash·준비 경계, 여행 선택 적용·pending cleanup 연결, 인증·실제 online·override 해제의 sync 시작 조건과 Debug 우회 제거를 구현했다. 사용자는 진행 중 sync도 성공·실패 종료를 기다린 뒤 서버 세션과 로컬 DB를 정리하도록 이번 범위를 추가로 채택했다. 후속 세션 모델·인증 route guard·계정 전환도 구현하고 23개 suite·235개 test를 통과했다. 아래 인증 실행 절과 연결된 기록에서 실제 보장과 native 미확인을 구별한다. 나머지 네트워크 소비 연결은 남아 있다.

## 실행 맥락과 현재 코드의 차이

Noline은 Selective Local-First다. 활성 여행의 Trip·Schedule·Expense는 Local SQLite가 기준이고 Local 변경은 sync_queue로 전달한다. 비활성 여행은 Server API가 기준이다. 지도·검색·길찾기는 Network-First Service이며 여행 Data Entity의 Local/Remote 분기와 같은 저장 계약으로 취급하지 않는다.

앞선 Main 조사와 이번 문서 대조에서 확인한 구현 출발점은 다음과 같다. 실행 기기에서 재현한 전체 제품 결과로 확대하지 않는다.

- [Network Store](../../../../../../../apps/client/src/shared/store/network.ts)는 초기 unknown, 순수 관측 변환, listener 기반 init과 cleanup, 10초 확인 불가 안내·수동 refresh를 구현했다. 실제 실행 상태와 화면 override의 읽기 경계를 구별한다. 초기의 임시 online·null 축약·앱의 추가 fetch는 제거했다.
- [Root](../../../../../../../apps/client/app/_layout.tsx)는 앱 구성을 보여 주고, [AppInitialization](../../../../../../../apps/client/src/application/AppInitialization.tsx)이 네트워크 감지 수명과 DB→인증 복원→준비 완료를 소유한다. 첫 네트워크 결과를 기다리지 않는다. DB 준비 실패에는 Provider·화면을 연결하지 않고 실패·재시도 화면을 보여 준다.
- [Activation Router](../../../../../../../apps/client/src/shared/services/offline-prep/router.ts)는 실제 online일 때만 Remote를 열도록 호환 수정했고, override 중 Router mutation은 Local/Remote 모두 거부한다. Trip 단건 조회·수정·삭제는 대상 여행의 활성 상태로 분기하도록 수정했다. 신규 생성과 inactive child의 대상 전달은 실제 소비 경로에서 계속 확인한다.
- [Schedule repository](../../../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts)와 [Expense repository](../../../../../../../apps/client/src/entities/expense/repository/expense-repository.ts)의 child 조회·수정·삭제는 호출 화면이 가진 tripId를 Router에 전달해 inactive Remote 경로가 Local 선조회에 의존하지 않는다.
- [Policy hook](../../../../../../../apps/client/src/shared/policy/useAppPolicy.ts)은 unknown을 제한 모드로 처리하고 핵심 데이터인 Schedule·Expense의 CRUD와 지도·검색 정책을 반환한다. 수정·삭제는 실제 메뉴·편집 화면에 연결하며 Router가 실행 경로와 최종 차단을 맡는다. 공개 Places 요청은 보호 인증 client에서 분리했다. 활성 여부 최초 확인·실패는 비활성과 구별하며 기존 결과는 재조회 중에도 유지한다. unknown의 확인 중·확인 불가 안내는 기존 Store와 연결했고, 재확인 버튼은 1-C에 남아 있다.
- [SyncProvider](../../../../../../../apps/client/src/shared/services/sync/provider.tsx)는 DB 준비와 인증 복원 시도 완료 뒤 mount되며 인증·세션 만료·실제 관측·override·종료 일시 중단을 구독한다. [sync lifecycle](../../../../../../../apps/client/src/shared/services/sync/lifecycle.ts)이 실행 순간의 DB 준비·인증·연결 조건, 공유 잠금과 종료 대기를 소유한다. 자동·주기·Debug 수동 실행이 같은 경계를 통과한다.
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

네트워크 신호가 늦어도 진입할 수 있다는 합의와 DB 실패 진입 정책은 구별한다. DB 준비 성공은 인증 복원과 화면 연결의 선행 조건이다. 인증 복원 시도는 세션 기록 없음과 읽기·해석 실패를 구별해 끝낸다. 전자는 `signed-out`, 후자는 `restore-failed`로 로그인 화면에 연결하며, 정상 계정 기록과 인증 수단 부재는 `reauth-required`로 다룬다. 저장소 읽기 실패만으로 저장된 정보를 지우거나 서버 토큰 검증을 진입 조건으로 추가하지 않는다. 이 구별은 아래 인증 실행에서 두 boolean을 다섯 명시적 상태로 교체해 연결했다.

### 현재 startup 계약과 책임

- 앱 준비 완료는 DB 사용 가능과 인증 복원 시도의 완료다. 로그인 여부·네트워크 확정·지도 준비·sync 완료를 뜻하지 않는다. 여행이 없거나 활성 여행이 없어도 SQLite 연결·스키마는 준비한다. DB의 존재와 로컬에 준비된 여행 내용은 다른 조건이다.
- `AppInitialization`은 준비 상태·실행 중 중복 방지·해제된 화면의 늦은 완료 억제·Splash·DB 실패 안내와 재시도를 함께 소유한다. 재시도는 DB와 인증 준비를 이어가는 같은 실행이며 reset이나 데이터 삭제를 하지 않는다. 네트워크 구독은 재시도 중 유지한다.
- Auth Store는 보안 저장소와 인증 상태를 다룬다. 기존 구현의 `restoreSessionOnce`는 완료 결과를 Store 생애 동안 공유하며 login/logout 상태를 다시 덮지 않는다. 후속 설계에서도 완료된 초기 복원을 반복하지 않고, `restore-failed`의 명시적 재시도는 새 읽기를 허용한다. 앱 진입·Splash 책임은 Store에 넣지 않는다.
- `_layout.tsx`의 `AppNavigation`은 Stack과 인증 리다이렉트, `AuthenticatedEffects`는 로그인 수명에 연결할 여행 선택·지도 정리·pending cleanup hook을 모은다. 앱 전체 준비를 feature에 넣지 않고 `application`으로 분리한 이유는 여러 기능을 조율하는 책임이기 때문이다. 기능별 규칙을 application으로 이동하지 않는다.
- `getDatabase()`는 스키마 준비 성공 뒤에만 DB 객체를 제공한다. 초기화 전·준비 실패 뒤·reset 실패 뒤에는 오류를 던진다. reset 시작 시 준비 상태를 폐기한다. 이미 소비자가 얻어 간 객체의 작업 취소·SQL migration은 별도 계약으로 남는다.
- 여행 선택은 사용자의 선택을 유지한다. 성공한 Remote 목록이며 실제 online이고 조회 중이 아닐 때 기존 선택의 제거를 확인하면 다른 기본 여행으로 전환한다. 남은 여행이 없으면 선택을 해제한다. Local 목록·조회 실패/진행 중·offline/unknown에서는 기존 선택을 보존하고 연결 복구만으로 바꾸지 않는다. Repository의 실제 조회 출처를 사용한다.
- pending cleanup은 startup과 sync가 같은 진행 중 Promise를 공유한다. 공통 실행이 캐시 재조회도 한 번 요청한다. 로그인 후 지연 예약은 hook이 소유하며 준비 완료를 기다리는 조건이 아니다.
- 로그아웃·회원 탈퇴의 로컬 세션 종료는 새 pending cleanup을 막고 진행 중 정리의 성공·실패 종료를 기다린 뒤 큐·DB·인증·여행 선택·캐시를 비운다. 종료가 실패해도 일시 중단은 해제한다. 전체 sync·지도 만료 정리의 중단이나 데이터 보존 안전성을 추가로 보장하지 않는다.

초기화와 인증의 분리는 코드 위치를 벌리기 위한 것이 아니라 앱 준비의 순서·실패·UI와 인증 저장소·상태의 변경 이유를 각 책임 안에 모으기 위한 것이다. 추가 필수 준비 단계는 `AppInitialization`, 화면 이동은 `AppNavigation`, 로그인 후 작업의 연결은 `AuthenticatedEffects`, 개별 규칙은 해당 Entity·서비스에서 변경한다. 범용 작업 등록기나 다른 초기화 파일의 일괄 분리는 도입하지 않았다.

### sync 시작과 세션 종료 계약

DB가 사용 가능하고 로그인 상태이며 세션 만료가 아니고, 실제 online·override 해제·세션 종료 중이 아닐 때 새 sync를 시작한다. 로그인·인증 복구·online 확정·override 해제에서 실행 불가→가능 변화가 생기면 Provider가 자동 요청한다. 일반 rerender·실행 완료는 재요청 이유가 아니다. 실행 중 동시 요청은 보류하며 추가 실행을 예약하지 않는다. 주기 타이머는 기존 opt-in과 간격을 유지한다.

종료 확정은 기존 미동기화 확인을 통과하거나 사용자가 강제 종료를 선택한 시점이다. 먼저 새 sync를 막고 진행 중 실행의 성공·실패 종료를 기다린 뒤 서버 로그아웃/계정 삭제를 요청한다. pending cleanup 종료와 기존 Local 저장 종료를 기다린 뒤 미전송 여부를 최종 판단하고, 서버 종료 요청 후 DB·큐를 함께 초기화한 다음 인증·여행 선택·캐시를 비운다. 서버 로그아웃 실패 시 로컬 종료 진행, 서버 계정 삭제 실패 시 로컬 유지라는 기존 차이는 보존한다. 실패 때 일시 중단은 해제하지만 DB 준비 상태가 해제됐으면 새 sync를 계속 거절한다. 진행 중 HTTP 취소·새 종료 timeout·엔진 결과/재시도 개선은 추가하지 않는다.

Debug 수동 실행은 Context를 사용하며 보류를 성공으로 표시하지 않고 이유를 안내한다. 강제 로그아웃/탈퇴 확인 후에도 기존 진행 표시와 버튼 비활성화를 유지한다. 선택 근거와 테스트 우선 수행은 [sync 시작·종료 기록](../../../records/2026-09-18-03-sync-start-and-session-teardown.md)에서 확인한다.

## 인증 실행 — 세션 복원·재로그인·계정 전환 연결

이 절은 사용자와 확정한 현재 기준이다. [관리 복잡도 재검토](../../../records/2026-09-19-01-auth-complexity-review-and-decisions.md)의 직접 결함을 보완한 뒤에도 인증 소비 기준과 화면 연결의 차이가 남았다. 아래 현재 구현·남은 문제와 실제 기기 검증·수락을 구별한다. 구체 구조·추가 결함·검증 한계는 [인증 실행 기록](../../../records/2026-09-18-05-auth-session-implementation.md)에서 읽는다. 기존 앱 준비와 sync 종료 구현을 바탕으로, 인증 상태·저장·화면·로컬 접근·동기화가 같은 세션을 기준으로 동작하도록 연결한다. 단순히 로그인 route guard만 여는 작업으로 축소하지 않는다. 선택·철회 과정은 [인증 논의 기록](../../../records/2026-09-18-04-auth-session-policy-and-decisions.md)이 소유한다.

### 저장과 인증 상태

SecureStore에는 서버 로그인 성공으로 얻은 사용자 ID와 access/refresh token을 한 세션 기록으로 다룬다. SQLite는 여행·일정·경비·활성화·큐를 소유한다. 별도 로그인 성공 이력을 만들거나 SQLite에서 발견한 사용자 ID로 세션을 생성하지 않는다. 토큰은 nullable하게 다루고, 계정 기록이 유효한 경우 인증 수단 부재와 계정 부재를 구별한다. 갱신은 계정을 바꾸지 않으며, 인증 복구 불가 상태를 재시작 후에도 복원할 수 있게 저장한다.

상태와 그 상태에 필요한 계정 정보를 함께 표현하고 `isAuthenticated`와 `needsReauthentication` 같은 독립 boolean 조합으로 의미를 다시 추정하지 않게 한다.

| 상태 | 판정과 동작 |
| --- | --- |
| `initializing` | 초기 세션 복원 결과가 아직 없다. DB 준비 후 보안 저장소를 읽고 판정할 동안 앱 준비 화면을 유지하며 여행 작업·sync를 시작하지 않는다. |
| `signed-out` | 저장소 읽기에 성공했고 세션 기록이 없음을 확인했다. 로그인 화면으로 간다. 최초 실행과 명시적 로그아웃 완료가 여기에 해당한다. |
| `signed-in` | 계정과 서버 요청 또는 자동 갱신을 시도할 인증 수단을 복원했다. 서버가 방금 토큰을 검증했다는 보증은 아니며 기존 네트워크·활성화 정책을 따른다. |
| `reauth-required` | 계정 기록은 유효하지만 사용할 인증 수단이 없거나 자동 인증 복구가 불가능하다. 같은 계정의 활성 여행 Local CRUD를 유지하고 보호된 Remote 요청·새 sync를 멈춘다. 로그인 화면 진입을 허용한다. |
| `restore-failed` | 보안 저장소 읽기·기록 해석 실패 또는 계정 정보 모순으로 세션을 확정하지 못했다. 로그인 화면에 실패 안내와 재시도를 제공하며 Local 접근·sync는 막고 기존 저장값·여행·큐는 보존한다. |

초기 복원은 앱 프로세스 시작과 `restore-failed`의 명시적 재시도에서 수행한다. 동시 호출은 같은 진행 중 작업을 공유하고 완료된 복원은 반복하지 않는다. 실패 후 재시도는 저장소를 다시 읽을 수 있어야 한다. 화면·탭 이동, foreground 복귀, 재렌더링, 네트워크 변화, 토큰 갱신과 재로그인은 `initializing`으로 돌아가는 이유가 아니다. Auth Store가 세션 수명을 소유하고 AppInitialization은 DB 준비·진입·Splash를 조율한다. 서버 응답이나 sync 완료를 초기 복원의 선행 조건으로 추가하지 않는다.

접근 토큰이 없지만 refresh token이 남은 경우는 갱신을 시도할 수 있다. refresh token만 없다고 아직 사용할 수 있는 접근 토큰까지 즉시 무효로 취급하지 않는다. 기록의 형식·계정 일관성과 토큰의 사용·갱신 가능성을 구별하며, 기존 낱개 키의 부분 저장값을 새로 확정한 정상 세션으로 임의 승격하지 않는다. 포맷 검증·이관·부분 정보 판독의 구체 경계는 테스트 사례와 함께 구현한다.

### 로컬 이용과 서버 인증

복원된 계정 소유의 활성 여행은 토큰 만료·재로그인 필요 상태에서도 조회·생성·수정·삭제를 허용한다. 기존 Local로 완결 가능한 동작과 데이터 정책을 따르며 로컬 mutation과 큐 추가는 기존 원자성 계약을 유지한다. 인증 만료 후 별도 이용 기간을 두지 않는다. 활성화·cleanup 정책은 기존 Owner를 따르며, 기간 경과가 여행 전체 자동 삭제를 보장한다고 가정하지 않는다.

비활성 여행의 보호된 서버 조회·변경, 새 여행 생성·새 여행 활성화, 동기화는 필요한 서버 인증을 갖춘 뒤 수행한다. 활성 여행이 없으면 재로그인 필요 상태에서 이어갈 Local 여행 CRUD도 없다. Map/Search/Directions는 기존 서비스·실제 네트워크 정책을 따르며 인증 만료를 network offline으로 위장하지 않는다. 앱 인증을 요구하는 서비스 요청에는 재로그인 조건을 적용한다. Debug override의 쓰기·큐·새 sync 차단은 유지한다.

일반 API와 sync 모두 접근 토큰 만료 시 필요한 자동 갱신 기회를 갖고, network timeout·서버 장애와 인증 사유의 갱신 거절을 구별한다. 단순 첫 401이나 통신 실패만으로 재로그인 필요를 확정하지 않는다. 자동 복구 불가가 확인되면 계정과 미전송 데이터를 유지하고 인증이 필요한 요청·새 전송을 멈춘다. 사용자에게 기기 저장과 서버 동기화 완료를 구분해 안내하며 현재 선택·입력·화면을 보존한다.

### 재로그인·전환·종료

같은 계정 재로그인은 기존 데이터·큐를 유지하고 인증 정보만 갱신한다. 서버 인증 성공 뒤 기기 저장과 현재 세션 적용이 성공해야 DB 준비·실제 online·override 해제·종료 중 아님 등의 조건에서 sync를 재개한다. 만료 후 재로그인의 인증·저장 실패와 취소는 기존 `reauth-required`와 로컬 이용을 유지하며 다시 시도하게 한다. 전용 실패 상태는 만들지 않고 내부 세션 값이 서로 어긋나지 않도록 마무리한다. 로그인 적용 뒤 조회 무효화의 실패를 인증 저장 실패와 혼동하지 않는다.

재로그인에서 다른 계정을 선택하면 기존 계정·DB·큐를 유지하고 불일치를 안내한다. 계정 변경은 명시적 로그아웃으로 로컬 DB·큐·인증 세션을 정리한 뒤 로그인한다. 로그아웃 후 새 로그인에 실패하면 이전 로컬 여행으로 바로 돌아갈 수 없으며 서버에 전송되지 않은 변경은 복구되지 않는다. 정상 정리가 완료되기 전에 새 계정을 공개하거나 기존 큐를 새 계정으로 전송하지 않는다. 모든 로그인 진입에서 남은 데이터 소유 계정을 확인하며, 이전 메모리 userId가 없거나 기존 상태가 만료가 아니었다는 이유로 검사를 건너뛰지 않는다. 계정별 보관함·복구함·데이터 이전 기능은 만들지 않는다.

초기 복원 실패나 기록 부재인데 잔존 DB가 있는 경우에도 계정 경계를 검사한다. 귀속을 확인하지 못하면 자동 삭제하지 않으며, 복원·정리 행동에 접근할 수 있는 화면 연결을 구현 때 확인한다. 정상 재로그인 단순화를 이유로 이 검사를 제거하지 않는다.

일반 API와 sync는 같은 자동 갱신을 공유한다. 첫 401 뒤 갱신 성공 시 원래 요청을 한 번 재전송하고, 갱신을 완료하지 못하면 호출은 오류로 종료한다. 사용자 재로그인까지 일반 요청을 보관하는 대기열은 추가하지 않는다. 로그인 후 필요한 새 조회와 sync_queue의 새 전송은 허용하며 실패한 일반 Remote mutation을 자동 재실행하지 않는다. React Query 조회 retry 1회·mutation retry 0회는 별도 계층이므로 인증 필요 오류가 불필요한 조회 재시도로 이어지지 않게 연결을 확인한다.

조회·CUD·활성화 판단·큐 전송 모두 현재 세션과 데이터의 소유 계정 일치를 확인한다. 큐에 userId를 추가할지 또는 어떤 저장 경계로 귀속을 보장할지는 현재 스키마·기존 큐 이관을 확인해 정한다. 이 계정 경계에 직접 필요한 연결을 06에서 다루되 엔진 전체 결과·재시도와 cleanup 내부 정책은 15·16의 책임을 유지한다.

명시적 로그아웃은 미전송 확인과 진행 중 sync·pending cleanup 종료 대기, 서버 로그아웃 시도, 로컬 데이터·세션 정리 순서를 유지한다. FAILED 기록도 미전송 판정과 손실 안내에 포함하는 공통 기준은 16과 연결하며 이 누락을 남긴 채 안전한 계정 종료 완료로 보지 않는다. 서버 로그아웃 실패 시 로컬 종료 진행, 서버 탈퇴 실패 시 로컬 보존도 유지한다. 로그아웃 도중 앱 강제 종료에 대비한 지속 진행 표시·journal·다음 실행의 정리 재개는 이번 범위에서 제외한다.

늦은 토큰 갱신 응답은 요청을 시작한 세션이 여전히 현재 세션일 때만 적용한다. 로그아웃·계정 전환 뒤 응답은 토큰 저장과 Auth Store 변경 모두에 적용하지 않는다. 같은 계정으로 다시 로그인했어도 이전 세션의 응답이면 버린다. 저장 직전과 상태 반영의 비동기 순서까지 보호하고, 사용자 ID 비교만으로 대신하지 않는다. 구체적인 세션 식별 방식은 구현에서 정한다.

다중 기기 제어·원격 로그아웃·서버의 명시적 권한 회수 프로토콜은 이번 범위가 아니다.

### 인증 책임 기준과 현재 구현

상태만으로 답할 계정·인증 판단은 기존 Auth Store가 소유한다. selectLocalUserId는 계정 부재를 null로 돌려주고 requireLocalUserId는 실행을 거절한다. 실패 처리의 차이는 유지하되 같은 파일에 두며, requireRemoteSession과 AuthRequiredError도 Store에 둔다. local-access는 여행 소유권·활성 조건 SQL을, local-account는 DB·큐의 소유자 사실을 조사한다. 기기 저장 형식은 token-storage, 갱신 HTTP는 auth-transport가 맡는다.

복원·로그인의 필수 계정 검사와 저장·상태 적용은 Store의 같은 큐를 따른다. 앞선 계정 검사가 끝나기 전에 다음 로그인이 계정 없음으로 통과하지 않는다. 세션 삭제 성공은 뒤 로그인 저장의 실패와 무관하게 signed-out으로 반영한다. 인증 거부는 기기 저장 큐를 기다리지 않고 메모리에서 즉시 적용하며, 이전 요청 세대의 refresh 저장 완료가 인증을 다시 열지 못하게 한다. 새로운 전역 상태나 별도 Store는 추가하지 않았다.

로그인·로그아웃·회원 탈퇴의 전체 절차는 session-lifecycle의 withSessionChange를 공유한다. 이 모듈은 작업끼리의 순서와 sync·cleanup 종료 대기, DB transaction 접수 차단·기존 저장 종료를 조율한다. Store의 저장 큐는 토큰 갱신을 포함한 세션 기록을 보호하고, 서비스의 실행 순서는 DB 삭제까지 포함한 사용자 작업을 보호한다. 각각 보호하는 범위가 달라 둘 다 필요하다. 종료 전에 접수된 Local 저장은 미전송 검사에 반영하고, 검사와 삭제 사이의 새 저장은 거절한다.

completeLogin은 Store의 검증·저장 결과를 사용하고 실패한 서버 로그인 token만 폐기를 시도한다. 일반 API와 sync는 공유 인증 interceptor를 사용한다. 첫 401은 공유 갱신 후 한 번 재전송하며, 확정 인증 실패는 Query 재시도에서 제외한다. 내 정보·회원 탈퇴는 보호된 요청, Places는 기존 공개 요청 경로다. HTTP 5xx 재시도는 실제 2·4·8초 간격의 최대 3회로 맞췄으며 저장된 큐의 재시도와 구별한다.

복원 실패·signed-out에서도 LoginScreen에서 기기 데이터 정리 행동에 접근할 수 있다. 데이터 손실을 명시한 확인 뒤에만 force logout을 실행한다. 같은 계정 재로그인은 로컬 데이터를 지우지 않는다. 기기 세션 삭제 실패 시 서버 인증을 다시 허용하지 않고 계정과 재시도 가능 상태를 유지한다.

인증 변경만 반영한 별도 디렉터리에서 Main이 client Jest **30개 suite·277개 test 통과**를 확인했다. 이 상태에는 큐 재시도·vacuum과 Policy 이름·CRUD 정리 및 목록 read 연결이 포함되지 않는다. SecureStore·HTTP는 제어 가능한 mock, 데이터 보존 검사는 실제 Drizzle SQL과 Node 메모리 SQLite를 사용했다. Native SecureStore·실제 OAuth·서버 rotation·실기기 화면은 미확인이다. 기존 Mapbox/download 타입 오류 3개는 별도 범위로 남는다.

화면 정책은 Schedule·Expense의 create/read/update/delete를 OperationPolicy·EntityPolicy로 표현한다. 일정·경비 목록과 경비 상세는 재인증 또는 비활성 여행의 offline/unknown 제한 때 캐시 내용 대신 PolicyErrorDisplay를 표시한다. 캐시 자체를 삭제하지 않고 수정 Drawer를 계속 mount해 입력 상태를 보존한다. 오프라인 일정 저장은 기존 장소·좌표를 덮지 않으며, 경비는 기존 일정 연결을 표시하고 저장 payload에도 유지한다.

화면 정책까지 포함한 분리 후보를 별도 디렉터리에서 다시 실행해 Main이 **35개 suite·297개 test 통과**를 확인했다. read 제한의 실제 screen render, 복원 실패 화면의 명시적 폐기 확인, 수정 Drawer의 기존 값·연결·제한 복귀 보존을 component test로 확인했다. 앞선 형식·diff 검사는 통과했고, ESLint는 기존 Prettier plugin 충돌 규칙만 제외한 실행에서 오류 0개·기존 경고 9개였다. 이번 타입 검사도 기존 Mapbox/download 오류 3개로 전체 성공은 아니다. Native·실서버 미확인 범위는 유지한다.

분리·통합은 서로 다른 판단 책임이 있는지, 같은 동작의 보장이 여러 곳으로 흩어져 있는지로 결정한다. nullable/throwing 차이나 함수 길이만으로 파일을 나누지 않는다. Store action은 공개돼 있으므로 모든 소비자의 전체 절차 사용을 타입만으로 강제한다고 주장하지 않는다. Network 제한·복구 화면과 sync·cleanup의 전체 남은 범위는 각 Ticket의 완료 조건을 유지한다.

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

순수 변환·Store는 지연 Promise와 fake timer, Router·repository는 Local/Remote 호출 기록, 화면·폼·SyncProvider는 관련 hook/component fixture로 확인하고 변경 경로의 타입·기존 test를 실행한다. 이번 인증 작업에서는 Node 메모리 SQLite에서 큐 insert 실패 시 일정 rollback을 검사했고, async callback 완료 전에 commit하던 공통 helper도 고쳤다. Transaction 전체 계약과 실제 기기 동시성은 14의 검증 범위에 남긴다. Expo 진입·실기기 NetInfo 빈도·외부 API를 실행하지 않았다면 미확인으로 보고한다.

## 현재 상태와 실제 결과

### 네트워크 안내 후속 작업 1-A — 활성 여부 최초 확인

2026-09-23에는 unknown 안내 연결을 사람이 동작별로 검토할 수 있도록 1-A 활성 여부 확인, 1-B 연결 확인 중·확인 불가·offline 안내 구별, 1-C 재확인 행동으로 나눴다. 이번 구현은 1-A에 한정한다. 온라인 복귀 후 재조회·토스트, foreground 재확인과 mutation 오류 전달은 이후 작업이다.

활성 조회 결과가 아직 없는 상태를 비활성으로 간주하던 동작을 고쳤다. `useAppPolicy`는 최초 확인 중 Schedule·Expense CRUD에 `allowed: false, pending: true`를 반환하며, 최초 실패는 여행 활성 상태 확인 실패로 안내한다. 성공했지만 활성 기록이 없는 null과 아직 성공 결과가 없는 undefined를 구별한다. 이미 읽은 결과가 있으면 재조회 중이나 실패 뒤에도 그 결과를 사용한다. 이전 여행의 활성 결과를 새 여행에 재사용하지 않으며, 세션이 없으면 로그인 안내를 우선한다. 재인증 중에는 활성 여부 확인을 기다린 뒤 활성 여행의 Local 작업을 허용한다.

기존 화면이 소비하는 `OperationPolicy`에 pending 표시를 추가하고 `PolicyErrorDisplay`가 진행 표시로 표현한다. 일정 목록·경비 목록·경비 상세와 수정 폼에 별도 활성 판단 조건을 복제하지 않았다. 최초 실패 뒤 재조회 성공으로 정책이 회복되는 경로는 검사했지만, 이 단위에서 활성 조회 전용 재시도 버튼을 추가한 것은 아니다.

Main은 HEAD에 1-A의 변경 파일만 반영한 별도 디렉터리에서 client Jest **36개 suite·308개 test 통과**를 확인했다. 추가된 11개 검사는 실제 React Query와 활성 조회 hook에 제어 가능한 DB 응답을 연결한 8개 검사, 실제 목록·상세와 정책 표시를 연결한 3개 화면 검사다. 최초 대기·실패·기록 부재, 재조회 실패 시 기존 결과 유지, 대상 여행 전환과 인증 우선순위를 확인한다. DB는 mock이며 native SQLite·실기기 화면 검증은 아니다. 변경 파일 Prettier와 diff 검사, 기존 Prettier plugin 충돌 규칙을 제외한 ESLint는 통과했다. 타입 검사는 기존 Mapbox/download 오류 3개로 전체 성공은 아니다. 9월 23일에는 사용자 요청으로 커밋을 보류했고, 9월 28일 사용자가 1-A 커밋과 다음 작업 진행을 요청했다. 1-A는 `c38efa0`으로 저장됐다.

### 네트워크 안내 후속 작업 1-B — 연결 상태별 안내

2026-09-28 구현은 기존 Network Store의 checkStatus를 useAppPolicy와 NetworkStatusIndicator에 연결한다. 활성 여부와 인증 판단을 통과한 비활성 여행의 unknown은 checking일 때 진행 표시와 연결 확인 중 문구를, unavailable일 때 확인 불가 문구를 사용한다. offline은 명시적인 오프라인 이유를 일정·경비 CRUD에서 함께 사용한다. 활성 여행의 Local 내용은 유지한다. UI에서 타이머나 연결 상태를 새로 만들지 않는다.

화면용 unknown 강제 설정에서도 실제 checkStatus를 읽는다. 실제 확인이 없는 idle 상태는 확인 불가로 표시하며, 강제 설정 자체가 실제 관측이나 확인 작업을 바꾸지 않는다. 실제 online/unknown/offline 전환은 기존 정책대로 바로 반영하므로 비활성 여행의 내용·제한 표시 전환을 지연시키는 처리는 추가하지 않았다. 최초 활성 정보 확인과 로그인 안내는 네트워크 안내보다 우선한다.

재확인 버튼은 1-C, 온라인 복귀 후 성공한 재조회에 따른 복구·토스트는 후속 2번에 남는다. 현재 온라인 전환으로 정책이 해제되는 것을 복구 재조회까지 완성된 것으로 보지 않는다. 1-B는 사용자 검토 후 커밋 요청을 받았다.

1-A 커밋에 1-B 제품 코드·테스트만 더한 별도 디렉터리에서 Main이 client Jest **36개 suite·317개 test 통과**를 확인했다. 추가 9개 검사는 실제 Network Store의 10초 경과·반복 null·후속 관측을 세 화면과 헤더에 연결하는 검사, 활성 여행 유지, CRUD 안내·인증 우선순위·debug 표시 경계를 다룬다. NetInfo와 데이터 조회는 mock이며 실기기 관측이 아니다. 변경 파일 형식·ESLint는 기존 Prettier plugin 충돌 규칙을 제외해 확인했고, 타입 검사는 기존 Mapbox/download 오류 3개로 전체 성공은 아니다.

### 앞선 다섯 단계의 저장 경계

startup·스타일은 `8a1a3ea`, sync 연결은 `029adb6`, 정책 합의는 `71c1a02`, 대상 여행 라우팅은 `f0f680e`, DB 원자성은 `9936662`로 저장됐다. 인증 책임·전환·로컬 저장 보호는 `62ce226`, 동기화 중단·미전송 원본 보존은 `100e71a`, 화면 정책·입력 보존은 `be2f5b9`로 각각 저장했다. 다섯 단계의 실제 커밋 경계와 마지막 staged 후보의 검증은 [분리 커밋 마무리 기록](../../../records/2026-09-22-02-five-stage-commits-and-verification.md)에 있다.

앞선 분할 검토·토큰 분리·원복·부분 개선의 경위는 [분할 검토 기록](../../../records/2026-09-21-01-auth-policy-split-review-and-commits.md), [원복 기록](../../../records/2026-09-21-02-auth-token-separation-consumer-review-and-rollback.md), [부분 개선 기록](../../../records/2026-09-21-03-auth-consumer-boundary-implementation.md)에 보존한다. 최종 책임 배치·재현과 검사 경계는 [이번 구현 기록](../../../records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에 있다. 온라인 복구 후 재조회·토스트, unknown 10초 안내의 화면 끝단 연결과 foreground 재확인 등 Ticket 전체 완료와 사용자 최종 수락은 아직 아니다.

## 추후 개선 메모 — NetworkStatus enum 전환

2026-09-18 사용자는 enum 전환을 추후 개선 후보로 메모하도록 요청했다. 이번에는 영향 범위만 확인했으며 현재 구현 범위에 추가하거나 enum으로 변경하지 않았다. 목적은 문자열로 반복하는 네트워크 상태 표현을 명시적인 멤버로 읽기 쉽게 만드는 것이다.

전환을 검토할 때는 `NetworkStatus.ONLINE = 'online'`, `OFFLINE = 'offline'`, `UNKNOWN = 'unknown'`처럼 기존 문자열 값을 유지한다. `NetworkCheckStatus`는 이 후보에 포함하지 않는다. 아래 경로는 `apps/client/` 기준이다.

- **최소 수정 5개 파일:** `src/shared/store/network.ts`와 테스트 `tests/shared/store/network.test.ts`, `tests/shared/services/offline-prep/router-network.test.ts`, `tests/shared/services/sync/provider-network.test.tsx`, `tests/shared/policy/useAppPolicy-network.test.ts`. 상태 대입·함수 인자·타입 지정 테스트 표의 문자열을 enum 멤버로 바꿔야 한다. Main은 실제 파일을 수정하지 않고 컴파일러 메모리에서 타입만 enum으로 치환해 이 다섯 파일의 타입 오류 발생을 확인했다.
- **비교 표현까지 통일할 때 추가 8개 파일:** `src/shared/services/sync/provider.tsx`, `src/shared/services/offline-prep/router.ts`, `src/shared/policy/useAppPolicy.ts`, `src/screens/HomeScreen/index.tsx`, `src/features/trip/create-trip/TripDateForm.tsx`, `src/shared/components/Card/ScheduleCard.tsx`, `src/shared/components/Navigation/NetworkStatusIndicator.tsx`, `src/features/debug/ui/DashboardView.tsx`. 기존 문자열 비교는 유지할 수 있으므로 모두 필수 수정은 아니다.
- **타입·export 연결 확인 2개 파일:** `src/shared/policy/types.ts`, `src/shared/policy/index.ts`. `PolicyKey`의 unknown 제외·문자열 조합과 현재 type-only export를 확인한다. 정책 경유로 enum 값을 사용할 경우에는 값 export도 검토한다.

최소 수정은 5개, 표현·타입 연결까지 검토할 범위는 총 15개 파일이다. 현재 직접 사용 범위는 클라이언트 내부이며 서버·schema·DB 변경은 필요하지 않다. 실제 도입 시에는 문자열 값과 정책 key, 연결 판정·요청 조건을 유지하고 기존 네트워크 관련 테스트 및 client 타입 검사로 호환성을 확인한다. enum 도입 자체가 문자열 상수 방식보다 읽기·변경 부담을 줄이는지는 실행 시 다시 판단한다.
