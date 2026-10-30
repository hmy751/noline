# Noline Personal·Project·Work context

이 디렉터리는 여러 작업에 적용할 Personal 판단 기준·경험, Noline의 Project context와 개별 작업의 지속 상태를 분리한다. 기본적으로 기존 제품·AI harness 문서의 Owner를 유지하되, 사용자가 승인한 주제는 Project 관리 계약에 따라 현재 의미의 Owner를 `project/`로 옮길 수 있다. Work context는 그중 현재 작업에 필요한 문서를 선택해 사용한다.

- [`personal/`](personal/): 여러 작업에 가져올 개인의 판단 관점·조건과 협업 경험. 제품 계약·이번 작업 상태와 구별한다.
- [`project/`](project/): 여러 Workspace가 공유하는 Noline의 지속 의미·현재 구현·조건부 기준을 common/current/guidance 물리 layer로 나누고 Decision을 연결하는 Project context
- [`work/`](work/): Workspace의 current·source·output·records와 이를 Recover·Maintain·Verify하는 교체 가능한 Harness 운영 경계

`.claude/context/`는 Owner가 이동하지 않은 깊은 제품·기능 설명과 이동 뒤 남은 구현 배경·호환 routing을, `.claude/rules/`·`guards/`·`runbooks/`는 작업 지침을 계속 소유한다. 승인되어 이동한 주제의 현재 의미는 [`project/README.md`](project/README.md)가 가리키는 대응 canonical이 소유한다. 구현 사실과 충돌하면 현재 기준과 실제 코드를 대조해 영향받은 본문을 갱신하며, authority 충돌은 Project 관리 계약에 따라 판단한다.

## 시작점

- 여러 작업이 공유하는 제품 기준의 구조와 실제 내용 위치를 찾을 때: [`project/README.md`](project/README.md)
- 관련 작업에서 필요한 Project 본문을 선택하고 적용할 때: [USAGE](USAGE.md)와 [Project 읽기 기준](project/REFERENCE/reading.md)
- Project context를 작성·복원·갱신할 때: [`project/MAINTENANCE.md`](project/MAINTENANCE.md)의 내용 충분성·변경·관리 기준
- 현재 작업을 복구하거나 Workspace·Harness를 다룰 때: [`work/README.md`](work/README.md)
- Noline의 구현 규칙·깊은 맥락을 찾을 때: root [`CLAUDE.md`](../CLAUDE.md)와 [`.claude/README.md`](../.claude/README.md)

Harness를 제거하거나 다른 실행 장치로 바꾸더라도 Project common context와 각 Workspace의 README·`current/`·`source/`·`output/`·`records/` 의미는 남아야 한다.

## 본문을 관리할 때

Personal·Project 본문과 형성 자료를 만들거나 의미·구성을 바꿀 때 [CONTENT-POLICY](CONTENT-POLICY.md), 본문을 작성·수정할 때 [WRITING-FORMAT](WRITING-FORMAT.md)의 역할별 적용 범위를 따른다. 체계 지침의 진입·분할·이름은 [SYSTEM-GUIDANCE](SYSTEM-GUIDANCE.md)를 읽는다. 허용된 갱신·누락 복원은 [context-update](../.claude/skills/context-update/SKILL.md)와 각 영역의 관리 계약으로 수행한다.

Work에는 기존의 Spec·Ticket·current·source·output·records와 Main·Maintain 책임을 유지한다. 위 관리·형식 정책을 Work에 자동 확장하지 않는다. 형성 의도와 선택 경위는 [_background](_background/README.md), 이번 Noline 적용 범위는 [적용 안내](_background/records/2026-10-30-noline-partial-reapplication.md)에서 찾는다.
