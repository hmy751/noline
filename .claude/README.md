# Noline Document Map

이 문서는 Noline의 `.claude` 자료가 어떤 역할을 갖는지 정리하는 지도다. 기존 자료를 대체하는 새 규칙집이 아니라, 작업자가 현재 정책, 깊은 맥락, 과거 기록을 구분해서 읽도록 돕는 진입점이다.

## 읽는 순서

1. 루트 [CLAUDE.md](../CLAUDE.md)에서 프로젝트 정체성, bridge, 빠른 링크를 확인한다.
2. 작업 위치에 맞는 workspace guide를 연다. 이 파일들은 상세 참고서가 아니라 path-scoped harness entrypoint다.
   - [apps/client/CLAUDE.md](../apps/client/CLAUDE.md)
   - [apps/server/CLAUDE.md](../apps/server/CLAUDE.md)
   - [packages/schema/CLAUDE.md](../packages/schema/CLAUDE.md)
   - [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md)
3. 코드 작업이면 [rules/README.md](rules/README.md)에서 관련 compact rule을 고른다.
4. 비용이 큰 실수는 [guards/README.md](guards/README.md)에서 전후로 점검한다.
5. 반복 작업은 [runbooks/README.md](runbooks/README.md)에서 시작 순서와 관련 문서를 찾는다.
6. 관련 작업의 의미·계약·현재 차이를 이해할 때 [Project 주제별 진입](../context/project/README.md)에서 본문을 선택한다. 아직 이동하지 않은 상세는 [context/README.md](context/README.md)에서 찾고, 선택 이유나 과거 근거가 필요할 때 decision·history로 내려간다. 호출 조건이 맞으면 [읽기 스킬](skills/read-project-context/SKILL.md)을 사용한다.

## 역할 구분

| 위치 | 역할 | 읽는 방식 |
| --- | --- | --- |
| [harness/](harness/) | Claude/Codex bridge, 문서 owner, 하네스 변경 규칙 | AI/developer 운영 구조를 바꿀 때 먼저 읽는다. |
| [../context/](../context/) | 승인된 주제의 Project-wide 의미·current canonical, Workspace current/source/output/records, Recover·Maintain·Verify | 지속 작업을 복구하거나 새 Context Workspace를 만들 때 읽는다. 주제별 Owner 이동과 미이동 범위는 [Project context](../context/project/README.md)에서 확인한다. |
| [skills/](skills/README.md) | Context Harness 운영 스킬과 deprecated 스킬 이력 | 각 스킬의 호출 조건을 따른다. `noline-work`는 deprecated이며 호출하지 않는다. |
| [agents/](agents/) | Claude report-only 실행자 | context 수집, policy drift 점검, harness observer가 필요할 때만 사용한다. |
| [rules/](rules/) | 짧고 검증 가능한 task/path 규칙 | 관련 코드 수정 중 scoped rule로 읽는다. |
| [guards/](guards/) | 데이터 손실, sync 누락, auth 누락처럼 비용이 큰 실수 방지 지도 | 코드 변경 전후 체크용으로 읽는다. |
| [runbooks/](runbooks/) | 반복 작업별 시작 순서 | 작업 시작 1-5분 안에 무엇을 확인할지 정한다. |
| [context/](context/) | Owner가 이동하지 않은 깊은 아키텍처·기능 설명과 이동 뒤 남은 구현 배경·호환 routing | rule/runbook만으로 부족할 때 열고, 주제별 현재 canonical과 코드를 대조한다. |
| [commands/](commands/) | Claude command reference와 문서 관리 workflow | Claude 전용 command 자료다. Codex command로 자동 이식하지 않는다. 먼저 [commands/README.md](commands/README.md)를 확인한다. |
| [decisions/](decisions/) | 정책, 용어, 구조 변경의 이유 | 현재 정책의 근거로 읽되, source 문서가 더 최신이면 source를 우선한다. |
| [sessions/](sessions/) | 설계/구현 세션 기록 | 왜 그런 선택을 했는지 확인하는 기록이다. active policy로 바로 사용하지 않는다. |
| [_archive/](_archive/) | 과거 구현 가이드와 deprecated 맥락 | 역사 자료다. 명시 요청 없이 현재 구현 기준으로 끌어올리지 않는다. |
| [audits/](audits/) | 문서 품질 검증, 하네스 점검, 리팩터링 테스트 | active guide가 아니다. 현재 정책과 충돌하면 active source를 우선한다. |
| [CHANGELOG.md](CHANGELOG.md) | 정책/기능 변화의 긴 이력 | 큰 흐름을 볼 때 사용한다. 세부 구현은 코드와 active guide를 확인한다. |
| [settings.json](settings.json) | 공유 Claude Code lifecycle hook 설정 | `SessionStart`·prompt·response-end·session-end를 explicit-unbound Maintain adapter에 연결한다. 개인 권한은 여기 넣지 않는다. |
| [settings.local.json](settings.local.json) | Claude 로컬 설정 | 개인 권한과 machine-specific 선택만 둔다. 공유 hook을 덮어쓰거나 하네스 개편 이유만으로 수정하지 않는다. |

Codex bridge:

- `.agents/skills/noline-work`는 deprecated 원본 `.claude/skills/noline-work`를 가리키는 보존용 symlink다.
- `.agents/skills/create-context-workspace`는 `.claude/skills/create-context-workspace`를 가리키는 symlink다. 최초 Context Harness 이식에는 쓰지 않고, 설치 후 새 독립 또는 후속 Workspace를 만들 때만 쓴다.
- `.codex/agents/`는 `.claude/agents/`와 같은 의미의 report-only agent 정의를 Codex 형식으로 둔다.
- bridge parity는 `pnpm harness:check`가 확인한다.

## Active Task Index

| 필요 | 시작점 |
| --- | --- |
| Local/Remote routing | [rules/activation-router.md](rules/activation-router.md) |
| Local mutation + sync queue | [rules/transaction-sync-queue.md](rules/transaction-sync-queue.md) |
| Schema/type contract | [rules/schema-first.md](rules/schema-first.md) |
| Create ID strategy | [rules/client-side-id.md](rules/client-side-id.md) |
| Date/time handling | [rules/iso-time.md](rules/iso-time.md) |
| Auth/user ownership | [rules/auth-user-scope.md](rules/auth-user-scope.md) |
| Policy-driven UI | [rules/policy-ui.md](rules/policy-ui.md) |
| Repeated task flow | [runbooks/README.md](runbooks/README.md) |
| 운영 스킬과 호출 조건 | [skills/README.md](skills/README.md) |
| Project 본문 선택과 적용 | [Project 읽기 경로](../context/project/README.md), [read-project-context](skills/read-project-context/SKILL.md) |
| Context Workspace 생성·전환 | [../context/work/workspaces/CREATE-AND-TRANSITION.md](../context/work/workspaces/CREATE-AND-TRANSITION.md), [create-context-workspace](skills/create-context-workspace/SKILL.md) |
| Deep architecture/feature context | [context/README.md](context/README.md) |

## 보존 규칙

- 기존 `.claude` 문서를 생각 없이 삭제하지 않는다.
- 오래된 가이드가 유용하지만 현재 기준으로 위험하면 `_archive/`로 이동하고, 현재 깊은 맥락은 `context/`에서 다시 연결한다.
- 오래된 용어가 history, session, implementation, reference, archive에 남아 있어도 현재 정책처럼 고치지 않는다.
- active guide에서 현재 코드와 충돌하는 표현은 코드 확인 후 수정한다.
- 문서를 이동하기 전에 먼저 이 지도나 [corpus inventory](audits/2026-05-06-doc-corpus-inventory.md)에서 현재 역할과 목표 역할을 분명히 한다.
- 하네스 구조나 작업 방식이 바뀌면 [decisions/](decisions/)에 결정 기록을 남긴다.
- workspace guide가 길어지면 상세 설명을 owning `context/`, `runbooks/`, `rules/`, `sessions/`, `_archive/`로 분리한다.
