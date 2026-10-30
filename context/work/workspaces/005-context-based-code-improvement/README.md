# 02의 제품·구조·계약을 Project Context에 복원한다

002에서 실제로 채택·구현한 제품 의미와 구조·계약을 현재 코드에 대조하고, 다음 개발자가 과거 기록을 다시 조립하지 않도록 Project Context의 본문과 읽기 경로를 보완한다. 002의 후속이지만 자체 목표와 상태를 가진 독립 Workspace다. 개인 판단·협업·스킬 개선은 후순위다.

- [Spec과 검토 범위](current/memory/index.md): 전체 목표·보존 조건·완료 기준
- [Ticket](current/memory/tickets/index.md): 지금 실행할 결과와 다음 구성 방향
- [현재 상태](current/state/index.md): 지금까지 확인한 것과 첫 행동
- [원자료](source/index.md), [산출물](output/index.md), [기록](records/README.md)

실행은 앱 준비·세션·데이터 보존, 네트워크·조회·화면 복구, 작성·장소·날짜 입력의 세 결과로 묶는다. 각 Ticket은 기록·코드 대조, 본문 보완, 필요한 읽기 경로와 확인까지 맡는다. 이미 충실히 반영된 의미는 재사용한다. 이전 저장 용량 보완은 완료된 결과로 보존한다.

`workspace.json`은 identity, `recover.json`은 Project 선택, `verify.json`은 고정 검증 계약이다. 마지막 검증 결과와 receipt는 `current/state/status.json`이 소유한다. 현재 Verify는 초기 JSON 구문 확인으로 제한하며 제품 검증을 대신하지 않는다.

명시적 재진입: `python3 -B -m context.work.harness recover 005-context-based-code-improvement --json`
