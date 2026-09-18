# Ticket 06 — 네트워크 소비 연결 품질 개선

## 리뷰를 적용한 기준

사용자는 작업 중인 코드 전체에 대해 파일별 독립 품질 리뷰를 요청했고, 워커 구현과 독립 검증을 진행하도록 지시했다. 이어 “아니 리뷰는 품질때문에 독립리뷰한건 맞고 니가 검증해야지 우리 합의랑 이런걸 보고”라고 Main의 책임을 정정했다. Main은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md), [2026-09-16 합의 기록](2026-09-16-01-network-policy-and-implementation-boundaries.md), Store 첫 결과와 최신 인계 기록 및 Spec·Project 기준을 직접 대조했다.

독립 전문가는 코드 품질과 실제 소비 경로의 문제를 찾고, Main은 그 지적이 채택한 정책·Ticket 범위에 부합하는지 판단했다. Store의 private action factory는 유지하고 불필요한 파일 분리·범용 startup framework는 추가하지 않았다. DB/auth 실패 화면·route guard 전체 재설계, transaction 원자성·sync engine 결과·cleanup은 후속 책임으로 유지했다. 대상 여행 Router·inactive child 선조회 및 Trip PUT 연결은 기존 온라인 비활성 계약을 실행하기 위해 이번 범위에서 보완했다.

작업 시작 때 이미 정책 문서 커밋 `7cfa7db` 이후 dirty 제품 코드·테스트·기록이 있었다. Main은 그 baseline을 임시 사본으로 보존하고 기존 변경을 포함한 현재 코드와 새 개선을 대조했다. 이 기록은 앞선 [품질·인계 기록](2026-09-17-01-network-quality-review-and-handoff.md)의 당시 미해결 상태를 덮어쓰지 않는다.

## 구현 결과와 읽기 부담의 변화

SyncProvider가 실제 DB 성공·auth 초기화 및 인증·실측 online·override 해제를 하나의 시작 조건으로 확인한다. React 표시 state와 진행 중 실행 소유권은 구별하며 자동·수동 동시 호출은 같은 Promise를 기다린다. 실제 debug 버튼은 engine 직접 호출 대신 Provider를 사용하고 blocked/failed/completed를 구별한다. completed는 engine 반환을 뜻하며 queue 전체 반영 성공을 보장하지 않는다. Root는 DB 성공과 준비 종료를 구별하고 foreground 연결 재확인 및 기본 여행 선택 보존을 연결한다.

Router의 여행 목록·대상 단건·생성 입력을 함수 이름과 인자에서 구별한다. Trip 단건 수정·삭제와 Schedule/Expense 작업은 해당 tripId를 사용한다. child 수정·삭제 및 일정별 경비 조회는 tripId를 얻기 위한 Local 선조회를 제거하여 inactive Remote 경로를 열었다. data hook과 화면 caller도 같은 입력을 전달한다. Trip API의 PATCH는 기존 인증·ownership server PUT에 맞췄고 불필요한 catch/rethrow와 console-only mutation 오류를 제거했다. 전체 여행 목록은 기존 전역 activation 분기를 유지한다.

Policy는 활성 여부 로딩·오류와 unknown 확인 중·확인 불가를 구별한다. 공통 내용 접근 hook과 기존 정책 오류 UI는 일정·경비 목록 및 상세 화면에서 캐시를 보존하고 제한 안내를 선택한다. 같은 비활성 여행의 실측 회복 조회가 성공해야 내용을 다시 열며 초기 unknown 해소·선택 변경·복구 실패를 구별한다. 작은 화면 안내는 기존 화면 안에서 일정 시간 표시하며 전역 toast 관리자를 추가하지 않았다. 입력 폼과 Drawer는 네트워크 변화나 Router 거부 때문에 교체·닫힘·초기화되지 않으며 저장·삭제 오류의 실제 이유를 기존 흐름에서 한 번 전달한다. 카드의 화면 상태도 React 구독으로 연결했다.

Service는 여행 Data Router에 넣지 않았다. 장소 검색과 후속 상세 요청·길찾기는 최신 실측 연결을 확인하고 Google 지도는 실제 online일 때 마운트한다. 표시 online 강제가 실제 offline/unknown 요청을 열지 않는다. 기존 표시 정책이 고른 Local 지도는 유지한다.

## 독립 검증에서 발견한 보완

구현을 맡지 않은 코드 전문가에게 Ticket·합의·현재 소스와 baseline 경로를 제공하고 원자료에 대한 별도 판정을 요청했다. Main이나 워커의 성공 기대를 검증 조건으로 전달하지 않았다. 제품 편집 완료를 알린 뒤 최종 stable 소스를 검토하게 했다.

검증자가 확인한 세 소비 누락과 한 중복 전송 위험을 Main과 워커가 보완했다.

- Schedule 화면 헤더 버튼과 본문에 제한 안내가 중복됐다. 헤더는 보기 아이콘을 유지하고 본문에 전체 안내를 한 번 제공한다.
- 활성 여행이 없는 초기 unknown에서 목록 조회가 실패하면 실측 online에도 자동 회복하지 않았다. 여행 목록 hook이 실제 online 전환을 구독해 다시 조회하며 기존 선택을 덮지 않는다.
- Home의 다른 여행 삭제 경로가 Router 제한 이유를 일반 실패로 덮었다. 기존 공통 오류 메시지 helper로 연결했다.
- 목록과 상세가 같은 캐시 query를 관찰하면 기본 refetch가 첫 요청을 취소하고 새 요청을 만들 수 있었다. 공통 복구 조회와 상세의 두-query 조회 및 목록 회복은 `cancelRefetch: false`로 진행 중 요청을 공유한다.

독립 검증자의 최종 판단은 이번 Ticket 06 개선 범위 충족이며 남은 actionable P1/P2를 발견하지 못했다. root/client guide·관련 규칙·Ticket·Spec·합의·dirty baseline·현재 제품 코드와 실제 호출부·server PUT 계약을 대조했다. Store는 현재 소유 경계를 유지하며 추가 파일 분할이나 helper 확대가 필요하다고 판단하지 않았다. Main도 원자료와 검사에 비추어 이 첫 범위의 판정을 받아들이되 전체 Ticket·제품 수락으로 확대하지 않는다.

## 검사 근거와 한계

Main은 제품 편집 완료 뒤 전체 Jest를 no-cache로 실행했고, 다중 observer의 실제 React Query 회귀까지 추가한 최종 결과는 20개 suite의 205개 test 통과다. 새 concurrency 검사는 동일 query의 두 소비자가 요청 하나를 공유하고 성공 전 캐시 내용을 숨기는 것을 확인한다. 워커들은 기존 baseline에 같은 fixture를 대입하여 sync 경쟁·debug 보호·inactive repository·화면 제한 및 상세 복구의 변경 전 실패를 확인했다고 보고했다. Main의 전체 재실행은 현재 결과를 확인하며 각 baseline 대조의 상세 횟수는 워커 보고로 구별한다.

독립 검증자는 추가 영구 concurrency fixture 전의 전체 Jest 19개 suite·204개 test를 직접 통과시켰고, 별도의 실제 React Query fixture 두 개에서 다중 observer 요청 1회·완료 공유와 초기 unknown 목록의 online 회복을 확인했다. 최신 typecheck와 `git diff --check`도 재확인했다. Main의 최종 20개 suite·205개 결과와 독립 실행의 횟수를 구별한다.

client typecheck는 기존 `shared/lib/mapbox.ts:61` tuple 배열 오류와 `shared/services/offline-map/download.ts:165–166` OfflinePack 속성 오류 세 개로 실패했다. 변경 경로에서 새 타입 오류는 나오지 않았다. 변경된 client source·test·config 69개 파일의 Prettier 검사와 변경 제품 전체 ESLint는 통과했다. ESLint 오류는 없고 기존 Root non-null assertion 한 개, Home 미사용 세 개·inline style 한 개, 지도 inline style 한 개의 경고 여섯 개가 남았다. 기존 Prettier 3 연동 문제 때문에 ESLint의 해당 규칙을 제외하고 별도 Prettier 검사로 형식을 확인했다. Jest는 Expo 빌드 env 치환만 제외하여 테스트의 Mapbox token fixture를 런타임에 사용할 수 있게 했다. dependencies·lockfile은 변경하지 않았다.

실제 Expo 실행·native NetInfo·Google/Mapbox 요청·SQLite transaction·외부 API·서버·navigation stack은 실행하지 않았다. 기기 변동 빈도와 실행 환경의 데이터 격리도 미확인이다. 활성화·비활성화 내부 작업, debug reset·직접 DB 작업, cleanup 보존은 이 소비 연결 검증의 보장으로 확대하지 않는다.

Ticket 06 첫 네트워크 연결의 구현 결과이며 전체 Ticket 완료나 사용자 수락은 아니다. 제품 코드·test·관련 문서는 미커밋이다. stage·commit·push·실제 데이터 쓰기·Maintain control은 실행하지 않았으며 기존 `.pnpm-store/`와 다른 dirty 변경을 보존했다. machine status·receipt·실패한 generation 2는 변경하지 않았다.

## 2026-09-17 사용자 정정과 구현 철회

위 구현과 독립 검증은 당시 수행한 결과이며 현재 적용된 제품 코드가 아니다. 사용자는 “코드 전문가도 동작의 개선보다 가독성 응집도 뭐 파악쉬운 등의 spec 목표정도의 코드 퀄리티”가 목적이었다고 정정하고 처음 확인한 코드로 복구하라고 요청했다. Main은 정책에 부합하는 동작 개선이라는 이유로 구현을 넓힌 판단을 철회했다. 동작 검사 통과와 원래 목표에 맞는 변경 부담은 별개이며, 이번 품질 작업을 정책의 전체 소비 연결 구현으로 진행하지 않는다.

Main은 워커 작업 전 저장한 dirty baseline으로 기존 20개 파일을 복원하고, 이번에 변경한 기존 clean 파일 37개를 당시 HEAD 내용으로 복원했다. 새 source·test 17개를 제거했고 기존 source·test 및 `.pnpm-store/`는 보존했다. 복원 직후 파일 바이트 비교는 모두 일치했다. 회수한 구현은 임시 사본으로만 보관하고 stage·commit·push·실제 데이터 작업은 하지 않았다. 위 205개 검사의 구현은 회수됐으므로 현재 코드의 검사 결과로 사용하지 않는다.

후속 리뷰·수정의 현재 기준은 기존 동작을 유지하며 가독성·응집도·책임 이해와 수정 부담을 개선하는 Spec 목표다. 기능 결함과 정책 연결 누락은 발견 사실로 구별하고 품질 개선의 자동 선행 조건으로 삼아 계속 구현을 넓히지 않는다.

복구 후 Main의 전체 client Jest 재실행은 7개 suite의 기존 90개 test가 모두 통과했다. 제품 코드·기존 네트워크 테스트와 보존 사본의 바이트 일치, 이번에만 변경한 파일의 HEAD 일치, 새 source·test 제거를 최종 재확인했다. `git diff --check`도 통과했다.
