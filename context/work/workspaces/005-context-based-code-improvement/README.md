# 새 Context로 02의 코드와 판단을 재검토한다

002의 기록·선택 이유·검증 근거를 현재 코드와 대조하고, 현재 Personal·Project Context로 유지·개선·보류를 판단한다. 채택한 개선은 구현·검증까지 이어간다. 002의 후속이지만 자체 목표와 상태를 가진 독립 Workspace다.

- [Spec과 검토 범위](current/memory/index.md): 전체 목표·보존 조건·완료 기준
- [Ticket](current/memory/tickets/index.md): 지금 실행할 결과와 다음 구성 방향
- [현재 상태](current/state/index.md): 지금까지 확인한 것과 첫 행동
- [원자료](source/index.md), [산출물](output/index.md), [기록](records/README.md)

첫 실행은 저장 용량 Hook의 책임 분리 재검토다. 다음은 조회 공통화와 인증·세션 책임을 다룬다. 각 Ticket은 당시 선택·현재 코드 대조부터 채택한 개선과 검증까지 맡는다. 현행 유지도 근거 있는 결과가 될 수 있다. 문서 구성은 제품 개선 완료나 session activation을 뜻하지 않는다.

`workspace.json`은 identity, `recover.json`은 Project 선택, `verify.json`은 고정 검증 계약이다. 마지막 검증 결과와 receipt는 `current/state/status.json`이 소유한다. 현재 Verify는 초기 JSON 구문 확인으로 제한하며 제품 검증을 대신하지 않는다.

명시적 재진입: `python3 -B -m context.work.harness recover 005-context-based-code-improvement --json`
