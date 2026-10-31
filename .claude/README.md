# Noline Document Map

이 문서는 Noline의 `.claude` 자료가 어떤 역할을 갖는지 정리하는 지도다. 기존 자료를 대체하는 새 규칙집이 아니라, 작업자가 현재 정책, 깊은 맥락, 과거 기록을 구분해서 읽도록 돕는 진입점이다.

## 읽는 순서

1. 루트 [CLAUDE.md](../CLAUDE.md)에서 프로젝트 정체성, bridge, 빠른 링크를 확인한다.
2. 작업 위치에 맞는 workspace guide를 연다. 이 파일들은 상세 참고서가 아니라 path-scoped harness entrypoint다.
   - [apps/client/CLAUDE.md](../apps/client/CLAUDE.md)
   - [apps/server/CLAUDE.md](../apps/server/CLAUDE.md)
   - [packages/schema/CLAUDE.md](../packages/schema/CLAUDE.md)
   - [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md)
3. 코드 작업이면 [제품 개발 기준](../context/project/guidance/README.md)에서 주제를 골라 계약·실패 위험·변경 시 확인할 조건을 함께 읽는다.
4. 관련 작업의 의미·계약·현재 차이를 이해할 때 [Project 주제별 진입](../context/project/README.md)에서 본문을 선택한다. 제품 선택 이유는 해당 Project 형성 자료에서 읽고, 하네스 변경 이유는 decisions에서 찾는다. 옛 제품 원본은 역사 조사에만 사용한다. 본문 선택·근거 대조·재사용은 [USAGE](../context/USAGE.md)를 따른다.

## 역할 구분

| 위치 | 역할 | 읽는 방식 |
| --- | --- | --- |
| [harness/](harness/) | Claude/Codex bridge, 문서 owner, 하네스 변경 규칙 | AI/developer 운영 구조를 바꿀 때 먼저 읽는다. |
| [../context/](../context/) | Personal 판단 기준·경험, 승인된 주제의 Project-wide 의미·current canonical, Workspace current/source/output/records, Recover·Maintain·Verify | 지속 작업을 복구하거나 새 Context Workspace를 만들 때 읽는다. 주제별 Owner는 [Project context](../context/project/README.md)에서 확인한다. |
| [skills/](skills/README.md) | 로컬 운영 스킬과 deprecated 스킬 이력 | 각 스킬의 호출 조건을 따른다. `noline-work`는 deprecated이며 호출하지 않는다. |
| [agents/](agents/) | Claude report-only 실행자 | context 수집, policy drift 점검, harness observer가 필요할 때만 사용한다. |
| [Project](../context/project/README.md) | 제품 의미·현재 구조·개발 기준·실패 위험과 선택 이유 | 같은 주제 본문에서 적용 조건과 확인 방법을 읽고 실제 코드와 대조한다. |
| [commands/](commands/) | Claude command reference와 문서 관리 workflow | Claude 전용 command 자료다. Codex command로 자동 이식하지 않는다. 먼저 [commands/README.md](commands/README.md)를 확인한다. |
| [decisions/](decisions/) | 하네스 구조·운영 변경의 이유 | 당시 결정과 후속 변경을 구별한다. 현재 책임 배치는 harness와 Project가 소유한다. |
| [sessions/](sessions/) | 설계/구현 세션 기록 | 왜 그런 선택을 했는지 확인하는 기록이다. active policy로 바로 사용하지 않는다. |
| [_archive/](_archive/) | 과거 구현 가이드와 deprecated 맥락 | 역사 자료다. 명시 요청 없이 현재 구현 기준으로 끌어올리지 않는다. |
| [audits/](audits/) | 문서 품질 검증, 하네스 점검, 리팩터링 테스트 | active guide가 아니다. 현재 정책과 충돌하면 active source를 우선한다. |
| [CHANGELOG.md](CHANGELOG.md) | 정책/기능 변화의 긴 이력 | 큰 흐름을 볼 때 사용한다. 세부 구현은 코드와 active guide를 확인한다. |
| [settings.json](settings.json) | 공유 Claude Code lifecycle hook 설정 | `SessionStart`·prompt·response-end·session-end를 explicit-unbound Maintain adapter에 연결한다. 개인 권한은 여기 넣지 않는다. |
| [settings.local.json](settings.local.json) | Claude 로컬 설정 | 개인 권한과 machine-specific 선택만 둔다. 공유 hook을 덮어쓰거나 하네스 개편 이유만으로 수정하지 않는다. |

Codex bridge:

- `.agents/skills/noline-work`는 deprecated 원본 `.claude/skills/noline-work`를 가리키는 보존용 symlink다.
- `.agents/skills/create-context-workspace`는 `.claude/skills/create-context-workspace`를 가리키는 symlink다. 최초 Context Harness 이식에는 쓰지 않고, 설치 후 새 독립 또는 후속 Workspace를 만들 때만 쓴다.
- `.agents/skills/start-app`은 `.claude/skills/start-app`을 가리키는 symlink다. 직접 요청되거나 실제 앱 실행이 필수일 때만 사용한다.
- `.codex/agents/`는 `.claude/agents/`와 같은 의미의 report-only agent 정의를 Codex 형식으로 둔다.
- bridge parity는 `pnpm harness:check`가 확인한다.

## Active Task Index

| 필요 | 시작점 |
| --- | --- |
| Local/Remote routing | [여행 접근·Activation Router](../context/project/guidance/travel-access/INDEX.md) |
| Local mutation + sync queue | [저장·동기화·정리](../context/project/guidance/data-lifecycle/INDEX.md) |
| Schema/type contract | [schema·타입](../context/project/guidance/development-boundaries/schema-and-types.md) |
| Create ID strategy | [생성 ID·데이터 수명](../context/project/guidance/data-lifecycle/INDEX.md) |
| Date/time handling | [날짜·시점](../context/project/common/date-and-time.md) |
| Auth/user ownership | [API·인증·사용자 범위](../context/project/guidance/api-contracts.md) |
| Policy-driven UI | [여행 접근·Policy UI](../context/project/guidance/travel-access/INDEX.md) |
| 개발 작업에 적용할 기준 | [Project guidance](../context/project/guidance/README.md) |
| 운영 스킬과 호출 조건 | [skills/README.md](skills/README.md) |
| Project 본문 선택과 적용 | [Project 읽기 경로](../context/project/README.md), [USAGE](../context/USAGE.md) |
| Context Workspace 생성·전환 | [../context/work/workspaces/CREATE-AND-TRANSITION.md](../context/work/workspaces/CREATE-AND-TRANSITION.md), [create-context-workspace](skills/create-context-workspace/SKILL.md) |
| Deep architecture/feature context | [Project](../context/project/README.md) |

## 보존 규칙

- 기존 `.claude` 문서를 생각 없이 삭제하지 않는다.
- 오래된 가이드가 유용하지만 현재 기준으로 위험하면 `_archive/`로 이동하고, 현재 깊은 제품 맥락과 필요한 이유는 `../context/project/`에서 설명한다.
- 오래된 용어가 history, session, implementation, reference, archive에 남아 있어도 현재 정책처럼 고치지 않는다.
- active guide에서 현재 코드와 충돌하는 표현은 코드 확인 후 수정한다.
- 문서를 이동하기 전에 먼저 이 지도나 [corpus inventory](audits/2026-05-06-doc-corpus-inventory.md)에서 현재 역할과 목표 역할을 분명히 한다.
- 하네스 구조나 작업 방식이 바뀌면 [decisions/](decisions/)에 결정 기록을 남긴다.
- workspace guide가 길어지면 제품의 상세 설명·적용 방법은 owning Project 본문에 두고, 필요한 본문 선택은 기존 Project 색인과 경로별 guide에서 안내한다. 당시 기록은 기록 Owner에 보존한다.
