# Ticket 06 Network Store 첫 단계

사용자의 “작업 하나씩 진행해보자”에 따라 Store와 필수 소비부 호환을 먼저 실행했다. 시작 기준은 `7cfa7db`, 브랜치는 `refactor/app-startup-lifecycle`이다. 정책 선택은 [앞선 논의 기록](2026-09-16-01-network-policy-and-implementation-boundaries.md), 전체 책임과 다음 구현은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)이 소유한다.

## 구현한 동작과 이유

Store는 unknown에서 시작하고 NetInfo 두 값 중 명시적 false가 있으면 offline, 둘 다 true이면 online, 나머지는 unknown으로 변환한다. 변환은 순수 함수로 분리하고 관측 변경은 같은 내부 함수에서 처리한다. 첫 상태는 listener 등록 자체의 조회로 받으며 앱의 추가 fetch는 제거했다.

Store 인스턴스 내부의 현재 구독 정보에 listener·안내 timer·재확인 요청을 함께 둬 중복 init과 cleanup 뒤 늦은 callback을 다룬다. Root의 별도 effect가 네트워크를 시작·정리하고 DB·auth 준비는 첫 관측을 기다리지 않는다.

unknown은 처음 확인 중으로 표시하고 10초 뒤 확인 불가로 바뀌지만 실제 상태는 유지한다. 같은 unknown 관측은 안내 시간을 연장하지 않고 명시적 재확인만 시간을 재시작한다. 재확인 시작·실패는 기존 확정 상태를 임의 unknown/offline으로 만들지 않는다.

재확인 연타는 한 Promise를 공유하고 refresh 반환도 같은 관측 규칙으로 변환한다. 시작 이후 listener 관측이 왔다면 이전 refresh 반환·실패로 덮지 않는다. 미응답 refresh는 10초 뒤 앱의 대기를 해제해 재시도를 영구 점유하지 않게 한다. 이후 실제 관측은 listener로 받을 수 있다. 이 시간은 앱의 대기·안내 기준이며 NetInfo 내부 probe 취소나 설정 변경이 아니다.

비React 실행 상태와 실제 관측 훅은 realStatus를 사용하고 화면용 훅은 override를 우선한다. Debug는 실제/강제 상태를 구별하고 unknown 강제·실제 연결 재확인을 제공한다.

타입만 추가하면 Router가 unknown Remote를 허용하고 Policy는 없는 key를 조회하므로 필수 호환 수정도 포함했다. Router는 실제 online에서만 Remote를 시작하고 unknown의 이유를 기존 OfflineError로 전달한다. Override 중 Router mutation의 Local/Remote 실행을 거부한다. Policy는 Store 상태 타입과 기존 offline 권한 모드를 재사용한다. SyncProvider는 실제 관측을 소비하고 최초 unknown→online에서도 시작하며 자동·수동 실행 직전 실제 online과 override 해제를 확인한다.

## 검사와 한계

변경 전 설치된 Jest로 client baseline 18개 test가 통과했다. 변경 뒤 전체 7개 파일의 81개 test가 통과했다. 새 네트워크 검사 63개는 관측 조합·10초 timer·중복 init·동기 첫 관측·등록 실패·cleanup·재확인 연타와 실패·미응답·늦은 결과, 실제/화면 훅 분리, Router 호출 횟수·debug 차단, Policy·SyncProvider 호환을 다룬다.

NetInfo·활성 정보·sync engine을 mock하고 timer를 제어한 검사다. 실제 서버 요청·SQLite 변경·queue 원자성·NetInfo 실기기 빈도까지 증명하지 않는다. Root의 실제 Expo lifecycle과 debug 화면을 기기에서 실행하지 않았다.

Typecheck는 변경 전부터 있던 mapbox.ts의 좌표 tuple 오류 하나와 offline-map/download.ts의 OfflinePack 필드 오류 두 개만 남았다. 기존 eslint-plugin-prettier가 Prettier 3의 제거된 resolveConfig.sync를 호출해 일반 lint는 중단됐다. 해당 규칙만 끈 변경 경로 lint는 오류 없이 통과하고 기존 Root Mapbox 토큰의 non-null assertion 경고 하나만 남았다. 포맷은 Prettier로 별도 검사했고 git diff --check도 통과했다. 의존성 설치·업데이트는 하지 않았다.

NetInfo 11.4.1의 초기 listener 내부 native 조회에는 앱이 구독할 비동기 오류 전달 경로가 없다. 앱의 동기 등록 실패는 확인 불가로 처리하고 미응답은 안내 timer로 다룬다. 라이브러리 내부 초기 조회의 unhandled rejection이나 refresh queue 자체를 수정·복구한 것으로 주장하지 않는다.

## 다음 작업과 기록 상태

다음은 대상 여행별 Router 분기와 inactive Schedule·Expense 수정·삭제의 Local 선조회 문제를 정상화하는 작업이다. 비활성 내용 제한·폼 오류와 입력 유지·복구 조회·토스트, 활성 정보 로딩, sync의 DB·auth·동시 실행·debug 해제 및 foreground 재확인은 남아 있다. 이번 결과는 Store 단계이며 Ticket 06 전체 완료나 사용자 수락이 아니다.

자동 Maintain generation 2의 실패·pending은 그대로다. Main이 실제 결과를 Ticket·state·output에 직접 반영한 것이며 과거 자동 boundary의 성공이나 자동 기록 복구를 주장하지 않는다.
