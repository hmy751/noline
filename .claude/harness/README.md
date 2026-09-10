# Noline AI 하네스

이 문서는 Noline의 AI/developer 지침이 어디에 있고 어떤 책임을 갖는지 정의한다. 새 규칙집이 아니라 owner와 bridge 지도다.

## 목적

Noline에는 Selective Local-First, Policy Layer, sync, time, schema, UI 패턴을 다루는 상세 문서가 이미 많다. 하네스의 역할은 루트나 tool-specific 폴더를 비대하게 만드는 것이 아니라, 작업 시점에 필요한 레이어를 빠르게 고르게 하는 것이다.

## 현재 레이어 모델

| 레이어 | Owner | 역할 | 읽는 방식 |
| --- | --- | --- | --- |
| Root guide | [../../CLAUDE.md](../../CLAUDE.md) | 프로젝트 정체성, bridge, 빠른 탐색, 핵심 불변식 | 항상 작게 유지 |
| Context Harness | [../../context/README.md](../../context/README.md) | Project common context, 지속 Workspace와 Recover·Maintain·Verify 운영 | `.claude/context/`의 제품 설명 Owner와 분리 |
| Workspace guides | `apps/*/CLAUDE.md`, `packages/*/CLAUDE.md` | app/package별 구현 규칙과 명령 | 경로에 따라 읽음 |
| Document map | [../README.md](../README.md) | `.claude` corpus의 역할과 읽는 순서 | 문서 작업 시 시작점 |
| Rules | [../rules/](../rules/) | 짧고 검증 가능한 task/path 규칙 | 작업/경로에 따라 읽음 |
| Guards | [../guards/](../guards/) | 데이터 손실, sync 누락, auth 누락 같은 고비용 실패 점검 | 위험한 수정 전후 |
| Runbooks | [../runbooks/](../runbooks/) | 반복 작업의 시작 순서 | 작업 진입점 |
| Context | [../context/](../context/) | 깊은 아키텍처, cross-cutting engineering context, 기능별 설명 | 필요할 때만 |
| Skill | [../skills/README.md](../skills/README.md) | Context Harness 운영 스킬과 deprecated 스킬 이력 | 각 스킬의 호출 조건에 따라 읽음 |
| Agents | [../agents/](../agents/) + [../../.codex/agents/](../../.codex/agents/) | context 수집, policy drift 점검, harness observer | 필요할 때만 report-only |
| Commands | [../commands/](../commands/) | Claude command reference와 문서 관리 workflow | Claude 참고 자료 |
| Decisions | [../decisions/](../decisions/) | 정책, 용어, 하네스 구조가 왜 바뀌었는지 | 근거 기록 |
| Audits | [../audits/](../audits/) | 문서 품질 검증과 하네스 점검 evidence | 근거 기록, policy 아님 |
| Sessions | [../sessions/](../sessions/) | 작업 이력과 증거 | history |
| Archive | [../_archive/](../_archive/) | 과거 맥락, 오래된 reference, deprecated guidance | history |

예전 `core/`와 `features/` 본문 문서는 [context](../context/)로 이동했다. 새 하네스 entrypoint는 `rules/`, `guards/`, `runbooks/`, `context/`를 기준으로 유지한다.

## Claude/Codex 브릿지

- `CLAUDE.md`는 사람이 읽는 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 Codex가 같은 가이드를 읽기 위한 bridge다. 두 번째 원천이 아니다.
- 루트 `AGENTS.md`는 루트 `CLAUDE.md`를 가리킨다.
- 주요 workspace의 `AGENTS.md`도 같은 폴더의 `CLAUDE.md`를 가리킨다.
  - `apps/client/`
  - `apps/server/`
  - `packages/schema/`
  - `packages/ui/`
- `.claude/commands/`는 Claude command reference다. Codex command나 rule로 자동 포팅하지 않는다.
- `.claude/rules/`의 Markdown은 현재 공통으로 읽을 수 있는 프로젝트 지침이지만 Claude 전용 loader 의미를 갖지는 않는다.
- `.claude/skills/noline-work`와 `.agents/skills/noline-work`는 deprecated 원본과 Codex bridge로 보존한다. 현재 작업에서 호출하지 않는다.
- `.claude/skills/create-context-workspace`는 설치된 Context Harness에서 새 Workspace를 구성하는 Claude skill 원천이고 `.agents/skills/create-context-workspace`는 Codex bridge다.
- `.claude/agents/*.md`는 Claude report-only agent 정의이고 `.codex/agents/*.toml`은 같은 의미의 Codex agent 정의다.
- `.claude/settings.json`은 Claude Code lifecycle hook을 `.claude/hooks/maintain.py`에 연결한다. `.codex/hooks.json`은 Codex lifecycle을 `.codex/hooks/maintain.py`에 연결한다. 둘 다 새 session을 자동 binding하지 않으며, Claude payload의 `agent_id`가 있는 subagent event는 Main binding과 분리하기 위해 adapter가 조용히 무시한다.

## 브릿지 규칙

1. 도구별 파일은 공통 지침을 가리키거나 얇게 적응한다.
2. 도구별 파일이 별도 정책 원천처럼 조용히 갈라지면 안 된다.
3. Claude/Codex 양쪽 버전이 생기면 같은 내용인지, adapter인지, 의도적으로 다른지 기록한다.
4. 새 agent/skill은 정책 본문을 복사하지 말고 어떤 문서를 읽고 어떤 산출물을 반환할지만 얇게 정의한다.
5. bridge, agent, skill을 추가하거나 크게 바꾸면 최종 응답 전에 bridge drift를 점검한다.

## Workspace Guide Contract

하위 `CLAUDE.md`는 구현 참고서이기 전에 path-scoped harness entrypoint다. 각 파일은 아래 질문에 짧게 답해야 한다.

- 이 workspace가 소유하는 구현 책임은 무엇인가.
- 같은 폴더의 `AGENTS.md`가 bridge symlink인지, 별도 정책 원천인지.
- 작업자가 루트 guide에서 들어온 뒤 어떤 rule, guard, runbook을 먼저 확인해야 하는가.
- 어떤 내용은 이 파일에 쌓지 않고 `rules/`, `guards/`, `runbooks/`, `context/`, `sessions/`, `_archive/`로 보내야 하는가.

workspace guide는 짧게 유지한다. 긴 feature 설명, 교육용 예시, 디버깅 사례, 배포 후보가 필요하면 owning context나 archive로 분리한다. `pnpm harness:check`는 각 workspace guide가 `Harness Role`, local `AGENTS.md` bridge를 갖고 있고 과도하게 길어지지 않는지 확인한다.

결정 기록: [Workspace Guide Harness Contract](../decisions/2026-05-06-workspace-guide-harness-contract.md)

현재 workspace guide 역할:

| Workspace | Harness role | Drift signal |
| --- | --- | --- |
| `apps/client` | React Native, FSD, local DB, Activation Router, policy UI 실행 가이드 | schema/server 공통 정책이나 긴 기능 이력이 client guide에 누적됨 |
| `apps/server` | Express route, auth/user scope, DB/sync endpoint 실행 가이드 | schema 계약이나 운영 추정 예시가 현재 서버 정책처럼 굳어짐 |
| `packages/schema` | Zod contract, request/response, cross-workspace type boundary 실행 가이드 | client/server 구현 절차가 schema guide에 쌓임 |
| `packages/ui` | 순수 UI primitive와 앱 조합 컴포넌트 경계 실행 가이드 | domain logic, API, screen state가 package guide나 primitive에 들어옴 |

## 하네스 변경 규칙

1. 새 규칙은 담을 수 있는 가장 작은 owner에 둔다.
2. 루트 `CLAUDE.md`는 탐색용으로 유지한다. 모든 상세 패턴을 루트로 끌어올리지 않는다.
3. 한 번의 디버깅 세션에서 생긴 불편을 바로 일반 규칙으로 승격하지 않는다. 반복되거나 비용이 큰 실패일 때만 하네스화한다.
4. reference project에서 영향을 받았다면 표면 형식을 복사하지 말고 Noline의 역할 모델로 번역한다.
5. `rules/`는 짧고 검증 가능하게, `context/`는 깊은 설명을 보존하게, `runbooks/`는 실행 순서만 빠르게 유지한다.
6. 이후 작업 방식에 영향을 주는 하네스 변경은 [decisions/](../decisions/)에 기록한다.
7. Context Harness는 `.claude/context/`의 깊은 제품 설명을 복제하지 않고, 상세 Owner를 우선하는 Project common context와 Work state만 소유한다.

## 커밋 메시지 기준

새 커밋은 가능한 한 Conventional Commit 형태를 사용한다.

```text
type(scope): summary
```

- runtime code는 `client`, `server`, `schema`, `ui` 같은 workspace scope를 우선한다.
- documentation/harness 변경은 `harness`, `rules`, `runbooks`, `context`, `guards`, `readme`, `archive`처럼 가장 작은 문서 owner를 scope로 쓴다.
- scope는 변경이 진짜 repo-wide이거나 유용한 owner가 없을 때만 생략한다.

결정 기록: [Commit Message Convention](../decisions/2026-05-06-commit-message-convention.md)

## 실행 검증

하네스 구조나 문서 owner를 바꾼 뒤에는 아래 검증을 실행한다.

```bash
pnpm harness:check
```

이 검증은 `AGENTS.md -> CLAUDE.md` bridge, legacy 하네스 경로 부활 여부, active Markdown 링크, root 임시 계획 파일, whitespace diff를 확인한다.
실행층이 추가된 뒤에는 `.claude/skills`, `.agents/skills`, `.claude/agents`, `.codex/agents`의 예상 파일과 report-only/parity도 함께 확인한다.

## 최근 정리 결과

2026-05-06 하네스 정리 패스에서 완료한 일:

- 오래된 `references/`와 `implementation/` 자료를 active surface에서 제거하고 `_archive/`로 보존
- `noline-work` skill과 `noline-*` report-only agents로 실행층 추가
- 완료 기록을 [Harness Execution Record](../audits/2026-05-06-harness-execution-plan.md)에 보존
- `pnpm harness:check`로 bridge, legacy surface, active Markdown link, whitespace diff를 반복 검증

이 정리에서 의도적으로 하지 않은 일:

- runtime code 변경
- Claude command를 Codex command로 자동 변환
- hook/config enforcement를 모양상 생성
- decisions, sessions, audits, archive history를 현재 정책처럼 재작성

## 실행층

현재 active 실행층:

- `create-context-workspace`: 설치 뒤 새 독립 또는 후속 Context Workspace를 구성·bounded 재진입 검토하는 skill이다. 최초 이식이나 기존 Workspace 단순 수정에는 사용하지 않는다.
- `noline-context-collector`: feature/bug 단위로 관련 코드, 문서, decision, 최근 커밋을 모아 compact card를 반환하는 report-only collector.
- `noline-policy-checker`: Router, `withTransaction`, `generateId`, schema-first, ISO time, auth ownership, soft delete 정책 drift를 보는 report-only checker.
- `noline-harness-observer`: 하네스/bridge 변경 뒤 구조 drift와 Claude/Codex parity를 보는 report-only observer.

`noline-work`는 2026-09-10 사용자 요청으로 deprecated 처리했다. 작업별 기준은 root·workspace guide와 rules·guards·runbooks·context에서 직접 찾는다. 기존 스킬 본문과 bridge는 이력으로 남기며 현재 workflow로 실행하지 않는다. [결정 기록](../decisions/2026-09-10-deprecate-noline-work.md)

agent/skill 파일은 discoverable 역할 정의일 뿐, 자동 team runner가 아니다. 여러 agent를 팀처럼 쓸 때의 호출 순서, 병렬화, 결과 통합은 메인 작업자가 정한다.

새 실행자는 반복 사용으로 모양이 충분히 안정된 뒤에만 추가한다. agent나 skill이 커지면 내용을 owning docs로 되돌리고 실행자는 읽을 자료와 출력 형식만 남긴다.

## Context Harness 보완

[Project layer](../../context/project/README.md)와 [Spec·Ticket](../../context/work/workspaces/SPEC-AND-TICKETS.md)이 지속 내용과 유지 책임을 소유한다. [운영 skill 색인](../skills/README.md)은 생성·Project 갱신·논의·재판단·작업물 설명·설명 복구를 연결한다. `.claude/skills/` 원본과 `.agents/skills/` 상대 bridge를 유지하며 report-only agents와 각 host adapter를 대체하지 않는다. 적용 선택은 [2026-09-09 Decision](../decisions/2026-09-09-context-harness-upgrade.md)에 있다.
