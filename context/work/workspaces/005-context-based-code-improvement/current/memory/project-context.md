# 적용할 Context

Recover는 Project의 제품 의미·현재 구조·동작 보존 기준을 선택한다. Ticket마다 필요한 구체 본문은 아래와 해당 Ticket에서 추가로 읽는다. 링크를 선택한 사실을 본문 이해·적용으로 간주하지 않는다.

- [제품 의미](../../../../../project/common/product.md): Local/Remote 소유, 서비스 정책과 입력 보존의 공통 제약.
- [현재 구조](../../../../../project/current/architecture.md): 실제 코드 Owner와 지원·검증 범위. 현재 코드와 관찰 시점을 대조한다.
- [리팩터링 기준](../../../../../project/guidance/behavior-preserving-refactoring.md): 동작 보존과 이해·수정 부담의 개선을 따로 판단한다.
- [저장 용량 계약](../../../../../project/current/storage-statistics.md): Ticket 01 시작 전에 부분 실패·표시·최신 요청 반영의 실제 제품 계약을 읽는다.
- [코드 표현과 진단](../../../../../personal/development/code-expression/INDEX.md): Ticket 01에서 함수 배치·값 흐름·실패 뒤 진단의 현재 부담을 판단하기 전에 읽는다.
- [계약과 수명](../../../../../personal/development/contracts-and-lifetime/INDEX.md): 세 Ticket에서 오류 의미·부분 결과·요청/세션 수명을 대조할 때 읽는다.
- [공통 제공과 사용처 선택](../../../../../personal/development/shared-boundaries/INDEX.md): Ticket 02의 조회 조합이 공동 계약과 사용처 차이를 함께 표현하는지 판단한다.
- [이름·책임·완료](../../../../../personal/development/naming-and-completion/INDEX.md): 책임 이름과 반환·종료가 소비자에게 약속하는 결과를 판단한다.

추가 문서는 [Personal](../../../../../personal/development/README.md)과 [Project](../../../../../project/README.md)에서 실제 질문별로 선택한다. 날짜·통화·API·폼 계약은 영향받는 작업에서 해당 Owner를 직접 읽는다. 경험 모음의 열린 후보를 채택 규칙으로 취급하지 않는다.

실행은 [development](../../../../../../.claude/skills/development/SKILL.md)를 따른다. 협업 경험과 체계 자체의 회고·개선을 요청받을 때는 improvement-loop의 조건을 적용한다. 이번 반복 검토는 상시 자동화나 개인 기준의 새 채택이 아니다.
