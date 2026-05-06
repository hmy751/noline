# Noline Document Map

이 문서는 Noline의 `.claude` 자료가 어떤 역할을 갖는지 정리하는 지도다. 기존 자료를 대체하는 새 규칙집이 아니라, 작업자가 현재 정책, 깊은 맥락, 과거 기록을 구분해서 읽도록 돕는 진입점이다.

## 읽는 순서

1. 루트 [CLAUDE.md](../CLAUDE.md)에서 프로젝트 정체성, bridge, 빠른 링크를 확인한다.
2. 작업 위치에 맞는 workspace guide를 연다.
   - [apps/client/CLAUDE.md](../apps/client/CLAUDE.md)
   - [apps/server/CLAUDE.md](../apps/server/CLAUDE.md)
   - [packages/schema/CLAUDE.md](../packages/schema/CLAUDE.md)
   - [packages/ui/CLAUDE.md](../packages/ui/CLAUDE.md)
3. 코드 작업이면 [rules/README.md](rules/README.md)에서 관련 compact rule을 고른다.
4. 비용이 큰 실수는 [guards/README.md](guards/README.md)에서 전후로 점검한다.
5. 반복 작업은 [runbooks/README.md](runbooks/README.md)에서 시작 순서와 관련 문서를 찾는다.
6. 판단이 애매할 때만 [context/README.md](context/README.md), decision, history 문서로 내려간다.

## 역할 구분

| 위치 | 역할 | 읽는 방식 |
| --- | --- | --- |
| [harness/](harness/) | Claude/Codex bridge, 문서 owner, 하네스 변경 규칙 | AI/developer 운영 구조를 바꿀 때 먼저 읽는다. |
| [rules/](rules/) | 짧고 검증 가능한 task/path 규칙 | 관련 코드 수정 중 scoped rule로 읽는다. |
| [guards/](guards/) | 데이터 손실, sync 누락, auth 누락처럼 비용이 큰 실수 방지 지도 | 코드 변경 전후 체크용으로 읽는다. |
| [runbooks/](runbooks/) | 반복 작업별 시작 순서 | 작업 시작 1-5분 안에 무엇을 확인할지 정한다. |
| [context/](context/) | 깊은 아키텍처, cross-cutting engineering context, 기능별 동작/edge case | rule/runbook만으로 부족할 때 열고 코드와 대조한다. |
| [commands/](commands/) | Claude command reference와 문서 관리 workflow | Claude 전용 command 자료다. Codex command로 자동 이식하지 않는다. 먼저 [commands/README.md](commands/README.md)를 확인한다. |
| [decisions/](decisions/) | 정책, 용어, 구조 변경의 이유 | 현재 정책의 근거로 읽되, source 문서가 더 최신이면 source를 우선한다. |
| [implementation/](implementation/) | 구현 추적표와 테스트 시나리오 | evidence/history로 읽는다. 완료/미완료 표기는 코드와 대조한다. |
| [sessions/](sessions/) | 설계/구현 세션 기록 | 왜 그런 선택을 했는지 확인하는 기록이다. active policy로 바로 사용하지 않는다. |
| [references/](references/) | PRD, wireframe, image notes 같은 원천 자료 | 제품/기획 source로 읽는다. 구현 정책과 충돌하면 active guide를 우선한다. |
| [_archive/](_archive/) | 과거 구현 가이드와 deprecated 맥락 | 역사 자료다. 명시 요청 없이 현재 구현 기준으로 끌어올리지 않는다. |
| [audits/](audits/) | 문서 품질 검증, 하네스 점검, 리팩터링 테스트 | active guide가 아니다. 현재 정책과 충돌하면 active source를 우선한다. |
| [CHANGELOG.md](CHANGELOG.md) | 정책/기능 변화의 긴 이력 | 큰 흐름을 볼 때 사용한다. 세부 구현은 코드와 active guide를 확인한다. |
| [settings.local.json](settings.local.json) | Claude 로컬 설정 | 프로젝트 정책 문서가 아니다. 하네스 개편 이유만으로 수정하지 않는다. |

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
| Deep architecture/feature context | [context/README.md](context/README.md) |

## 보존 규칙

- 기존 `.claude` 문서를 생각 없이 삭제하지 않는다.
- 오래된 가이드가 유용하지만 현재 기준으로 위험하면 `_archive/`로 이동하고, 현재 깊은 맥락은 `context/`에서 다시 연결한다.
- 오래된 용어가 history, session, implementation, reference, archive에 남아 있어도 현재 정책처럼 고치지 않는다.
- active guide에서 현재 코드와 충돌하는 표현은 코드 확인 후 수정한다.
- 문서를 이동하기 전에 먼저 이 지도나 [corpus inventory](audits/2026-05-06-doc-corpus-inventory.md)에서 현재 역할과 목표 역할을 분명히 한다.
- 하네스 구조나 작업 방식이 바뀌면 [decisions/](decisions/)에 결정 기록을 남긴다.
