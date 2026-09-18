# Network Store 첫 결과의 가독성 보완

첫 단계의 기능·회귀 결과를 보고한 뒤 사용자가 “코드 스타일좀 다듬어봐 원래 목표가 그건데”라고 짚었다. [Spec의 개선 기준](../current/memory/spec/04-quality-and-completion.md)은 동작 검사와 코드 이해·수정 부담의 개선을 함께 요구한다. 첫 구현의 정책·동작은 유지하고 남긴 읽기 부담을 이번 단계에서 보완했다.

## 전후 코드에서 확인한 변화

Store의 refresh action에는 Promise 생성·timer·현재 구독/요청/관측 비교·성공/실패/cleanup의 완료 처리가 섞였고, init과 refresh가 각각 같은 등록 실패 catch를 갖고 있었다. 현재 action은 초기화·진행 중 요청 재사용·안내 시작·구독 확인·요청 실행 순서를 드러낸다.

같은 파일의 createRefreshRequest가 한 요청의 Promise·대기 timer·최신 결과 적용 조건·성공·실패·완료를 함께 맡는다. canApplyResult가 최신성 조건을 모으고 accept/fail은 같은 finish로 정리된다. subscribe는 등록과 실패 안내를 맡아 호출자는 성공 여부만 확인한다. 반환된 action만 짧게 만들기 위해 관계없는 파일이나 범용 비동기 도구로 이동하지 않았다.

안내 timer와 함께 unknown·확인 중 상태도 바꾸는 함수는 beginUnknownCheck로 이름을 맞췄다. 안내 시간과 미응답 요청의 앱 대기 시간은 별도 이름의 상수로 구별했다. 두 값은 현재 모두 10초이며 정책 변경은 없다.

Router는 네 함수의 동일한 Local/Remote 계약을 RouteOperations로 모으고 Local 반환 이후 Remote 제한 확인이 이어지게 중첩 else를 제거했다. 타입·본문을 반복한 긴 주석은 Trip의 전역 활성 여부와 Child의 대상 여행 활성 여부 차이를 남기도록 줄였다. 실제 대상별 Trip 분기 정상화는 다음 작업이다.

Debug의 icon·색·글자색·label은 세 상태별 표시 정의로 모아 중첩 삼항식과 반복 상태 판정을 제거했다. 상태 표현을 바꿀 때 함께 맞출 위치가 가까워졌다. 화면의 표현 정의가 네트워크 요청 정책까지 맡지는 않는다.

## 동작 확인과 남은 범위

Test 기대값과 검사 구조를 바꾸지 않고 전체 client Jest 81개 test가 다시 통과했다. 변경한 세 코드 파일은 기존 Prettier 호환 규칙을 제외한 lint와 별도 포맷 검사를 통과했다. Typecheck는 기존 지도 오류 세 개만 남았다.

Main이 전후 실제 코드와 Spec 기준으로 판단한 개선이며 독립 reviewer나 실기기 검증 결과가 아니다. 함수 분리·test 개수 자체가 아니라 위 책임·조건·추적 위치의 변화가 개선 근거다.

Network Store 첫 단계에 이 보완을 포함하고 다음 작업은 대상 여행별 Router·inactive child 경로 정상화로 유지한다. 자동 Maintain의 실패·pending은 복구하지 않았으며 Main이 현재 문서에 실제 변경을 직접 연결했다.
