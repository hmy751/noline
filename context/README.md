# Noline Project context와 Work context

이 디렉터리는 Noline의 여러 작업이 함께 쓰는 Project common context와, 개별 작업의 지속 상태를 분리한다. 기존 제품·AI harness 문서의 Owner를 옮기지 않으며, 필요한 공통 사실을 다시 서술하고 Work context가 이를 선택해 사용하게 한다.

- [`project/`](project/): 여러 Workspace가 공유하는 Noline의 제품 목적·구조·제약·채택 결정을 실제 내용으로 정리하는 Project common context
- [`work/`](work/): Workspace의 current·source·output·records와 이를 Recover·Maintain·Verify하는 교체 가능한 Harness 운영 경계

`.claude/context/`는 Noline의 깊은 제품·기능 설명을, `.claude/rules/`·`guards/`·`runbooks/`는 작업 지침을 계속 소유한다. 이 `context/`는 그것들을 복제하거나 대체하지 않고, 작업 재진입과 증거 보존을 위한 별도 운영 층이다. 상세 Owner와 충돌하면 상세 Owner와 실제 코드를 우선하고 이 층을 다시 대조한다.

## 시작점

- 여러 작업이 공유하는 제품 기준을 확인하거나 바꿀 때: [`project/README.md`](project/README.md)
- 현재 작업을 복구하거나 Workspace·Harness를 다룰 때: [`work/README.md`](work/README.md)
- Noline의 구현 규칙·깊은 맥락을 찾을 때: root [`CLAUDE.md`](../CLAUDE.md)와 [`.claude/README.md`](../.claude/README.md)

Harness를 제거하거나 다른 실행 장치로 바꾸더라도 Project common context와 각 Workspace의 README·`current/`·`source/`·`output/`·`records/` 의미는 남아야 한다.
