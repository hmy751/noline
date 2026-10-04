# 앱 복귀 시 기존 네트워크 재확인 연결

제품 코드와 검사는 `d588a19`에 저장했다. 기존 Network Store 감지 세션에서 앱 복귀를 구독하고 같은 refresh를 실행한다. Ticket 06과 Workspace 전체는 진행 중이다.

## 필요성과 책임을 구분한 과정

처음 Main은 foreground 재확인을 필수 구현처럼 제안했다. 사용자는 기존 감지와 주기적 확인이 있는데 왜 필요한지 물었다. 기존 NetInfo는 연결 변화 알림과 인터넷 도달 확인을 제공하며, 설치된 11.4.1의 기본 반복 간격은 성공 후 60초·실패 후 5초다. 복귀 재확인은 인터넷 연결을 만드는 기능이 아니라 주기적 확인을 기다리지 않고 현재 관측을 요청하는 보완이다. 백그라운드에서도 그 타이머가 같은 주기로 실행된다고 보장하지 않는다.

설치된 NetInfo 11.4.1 README의 iOS Wi-Fi 전환 안내에는 백그라운드에서 연결 변화 이벤트를 놓쳐 상태가 어긋날 수 있어 foreground에서 재조회하도록 권장한다. 같은 문서는 iOS 시뮬레이터의 네트워크 알림 한계도 설명한다. 이 근거는 보완 이유이며 Noline에서 실제 단절 문제가 재현됐다는 근거는 아니다. 사용자는 “그럼 refeshe 추가해봐”라고 구현을 요청했다.

첫 수정은 AppInitialization에 AppState 구독을 직접 추가했다. 사용자는 “관심사랑 기존시스템 활용해서 책임 분리 잘 고려해서 useNetwork도 있는데 거기에 달랑 추가하면안되잖아?”라고 정정했다. 기존 store가 init~cleanup 사이 감지 세션을 소유하고 React 훅은 상태 읽기와 재확인 제공을 맡는다는 점을 대조해 구독을 store로 이동했다. AppInitialization의 첫 수정은 모두 제거했다.

## 최종 책임과 동작

[Network Store](../../../../../apps/client/src/shared/store/network.ts)의 init은 NetInfo 관측과 AppState 구독을 한 세션에서 시작한다. background 또는 inactive에서 active로 돌아올 때만 기존 refresh를 실행한다. active 중복 이벤트나 초기 상태 확인을 위한 추가 호출은 만들지 않는다. inactive 복귀도 포함하므로 시스템 UI 등으로 잠시 비활성화됐다 돌아오는 경우에도 확인한다.

중복 init은 구독을 늘리지 않는다. cleanup은 AppState 구독까지 해제하고, 해제 후 늦게 도착한 callback은 세션 유효성 검사로 무시한다. 수동 확인과 복귀 확인은 기존 중복 요청 공유·10초 timeout·늦은 관측 처리·실제 상태와 Debug override 분리를 재사용한다. 새 훅이나 별도 네트워크 상태는 추가하지 않았다. AppInitialization은 기존대로 시작·정리를 호출한다.

## 실제 확인과 한계

Main이 network store와 sync provider 네트워크 검사를 직접 실행해 **2 suites / 43 tests 통과**를 확인했다. 추가 검사는 background/inactive 복귀 후 실제 상태 갱신, 수동 재확인과 요청 공유, active 중복 이벤트, 중복 init, cleanup과 늦은 이벤트 무시를 확인한다. 기존 sync 검사도 통과했다. Prettier와 diff 검사는 통과했다. ESLint는 기존 prettier 충돌 규칙을 제외해 오류 0·no-void 경고 2개(기존 1개와 새 호출 1개)다. 이번 작은 변경에서 전체 Jest와 타입 검사는 재실행하지 않았다.

명령은 Project root에서 `./node_modules/.bin/jest --config apps/client/jest.config.cjs --runInBand apps/client/tests/shared/store/network.test.ts apps/client/tests/shared/services/sync/provider-network.test.tsx`이다. pnpm 래퍼가 의존성 재설치 경로로 들어가 실패해 설치된 실행 파일을 직접 사용했으며 의존성을 재설치하지 않았다.

실행 중인 iPhone 15 Pro 시뮬레이터를 재사용했다. 최초 관찰에서는 복귀 이벤트만 잡히고 refresh는 0회였으며, 최신 코드를 완전히 다시 로드한 뒤 검증했다. Hermes에서 NetInfo.refresh를 임시로 감싸 호출 수를 기록하고 실제 Home 버튼과 앱 아이콘으로 복귀했다. 최신 세션의 두 차례 모두 inactive→background→active 흐름에서 refresh가 각각 한 번 실행됐다. 첫 active와 refresh 기록 시각은 모두 1791102515157ms, 두 번째는 모두 1791102538974ms였다. 최종 호출 수 2, isRefreshing=false, 실제 online, override=null을 확인했다. 홈의 일정 2개·EUR 56도 유지됐다. 관찰 함수와 이벤트 구독은 제거했다.

로컬 보조 로그는 `artifacts/ticket-06-simulator/remaining-review-20261004/foreground-refresh-runtime.json`에 있으며 Git에서 제외된다. 위 문단에 핵심 사실을 보존해 임시 로그 없이도 확인 범위를 알 수 있게 했다. 실제 기기의 인터넷 단절·복구, 백그라운드 중 Wi-Fi 전환은 이번 실증에 포함되지 않는다.

## 이후 작업

foreground 연결 구현과 온라인 상태의 실제 복귀 호출 확인은 완료됐다. 실제 단절 검증은 남은 종합 UX 확인과 함께 다룬다. 홈·목록 여행 날짜 차이의 기준 판단, 열린 폼의 연결 전환과 실제 Local 저장 등 남은 범위는 유지한다. 경비 삭제 실패 이유·특정 상세 재시도는 기존 사용자 보류를 유지한다. 다음 작업으로 날짜 기준 검토를 제안했으며 구현은 시작하지 않았다.

사용자의 “그럼 커밋하고 워크스페이스 기록도 할거 하고 그 다음 작업 얘기해보자” 요청에 따라 기록했다. 현재 session은 Maintain unbound이며 수동 guarded apply를 사용하고 machine status·Verify receipt·binding은 변경하지 않는다.
