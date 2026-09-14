# Noline Project context와 Work context

이 디렉터리는 Noline의 여러 작업이 함께 쓰는 Project context와, 개별 작업의 지속 상태를 분리한다. 기본적으로 기존 제품·AI harness 문서의 Owner를 유지하되, 사용자가 승인한 주제는 Project 관리 계약에 따라 현재 의미의 Owner를 `project/`로 옮길 수 있다. Work context는 그중 현재 작업에 필요한 문서를 선택해 사용한다.

- [`project/`](project/): 여러 Workspace가 공유하는 Noline의 지속 의미·현재 구현·조건부 기준을 common/current/guidance 물리 layer로 나누고 Decision을 연결하는 Project context
- [`work/`](work/): Workspace의 current·source·output·records와 이를 Recover·Maintain·Verify하는 교체 가능한 Harness 운영 경계

`.claude/context/`는 Owner가 이동하지 않은 깊은 제품·기능 설명과 이동 뒤 남은 구현 배경·호환 routing을, `.claude/rules/`·`guards/`·`runbooks/`는 작업 지침을 계속 소유한다. 승인되어 이동한 주제의 현재 의미는 [`project/README.md`](project/README.md)가 가리키는 대응 canonical이 소유한다. 구현 사실과 충돌하면 현재 기준과 실제 코드를 대조해 영향받은 본문을 갱신하며, authority 충돌은 Project 관리 계약에 따라 판단한다.

## 시작점

- 여러 작업이 공유하는 제품 기준의 구조와 실제 내용 위치를 찾을 때: [`project/README.md`](project/README.md)
- 관련 작업에서 필요한 Project 본문을 선택하고 적용할 때: [읽기 기준](project/REFERENCE/reading.md)과 [읽기 스킬](../.claude/skills/read-project-context/SKILL.md)의 호출 조건
- Project context를 작성·복원·갱신할 때: [`project/MAINTENANCE.md`](project/MAINTENANCE.md)의 내용 충분성·변경·관리 기준
- 현재 작업을 복구하거나 Workspace·Harness를 다룰 때: [`work/README.md`](work/README.md)
- Noline의 구현 규칙·깊은 맥락을 찾을 때: root [`CLAUDE.md`](../CLAUDE.md)와 [`.claude/README.md`](../.claude/README.md)

Harness를 제거하거나 다른 실행 장치로 바꾸더라도 Project common context와 각 Workspace의 README·`current/`·`source/`·`output/`·`records/` 의미는 남아야 한다.
