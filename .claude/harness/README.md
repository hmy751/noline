# Noline AI 하네스

이 문서는 Noline의 AI/developer 지침이 어디에 있고 어떤 책임을 갖는지 정의한다. 새 규칙집이 아니라 owner와 bridge 지도다.

## 목적

Noline에는 Selective Local-First, Policy Layer, sync, time, schema, UI 패턴을 다루는 상세 문서가 이미 많다. 하네스의 역할은 루트나 tool-specific 폴더를 비대하게 만드는 것이 아니라, 작업 시점에 필요한 레이어를 빠르게 고르게 하는 것이다.

## 현재 레이어 모델

| 레이어 | Owner | 역할 | 읽는 방식 |
| --- | --- | --- | --- |
| Root guide | [../../CLAUDE.md](../../CLAUDE.md) | 프로젝트 정체성, bridge, 빠른 탐색, 핵심 불변식 | 항상 작게 유지 |
| Context Harness | [../../context/README.md](../../context/README.md) | Project context, 지속 Workspace와 Recover·Maintain·Verify 운영 | 주제별 제품 본문과 작업 운영을 구분 |
| Workspace guides | `apps/*/CLAUDE.md`, `packages/*/CLAUDE.md` | app/package별 구현 규칙과 명령 | 경로에 따라 읽음 |
| Document map | [../README.md](../README.md) | `.claude` corpus의 역할과 읽는 순서 | 문서 작업 시 시작점 |
| Project context | [../../context/project/](../../context/project/) | 제품·아키텍처·개발 기준·실패 위험·확인 조건과 선택 이유 | 주제별 Owner에서 함께 읽고 실제 구현과 대조 |
| Skill | [../skills/README.md](../skills/README.md) | 로컬 운영 스킬 | 각 스킬의 호출 조건에 따라 읽음 |
| Archive | [../_archive/](../_archive/) | 과거 맥락, 오래된 reference, deprecated guidance | history |

제품 본문은 [Project](../../context/project/README.md)에 통합했다. 옛 `core/`·`features/`·`.claude/context/`와 제품 결정은 현재 읽기 경로로 사용하지 않는다. `.claude`의 실행 지침·도구 연결과 하네스 결정 이력은 유지한다.

제품 기준을 주제별로 통합한 배경과 수용한 비용은 [Owner 통합 결정](../../context/project/decisions/0002-topic-ownership.md)에서, Project의 구성과 검증 관계는 [Project 구성 결정](../../context/project/decisions/0003-context-structure-and-verification.md)에서 확인한다.

## Claude/Codex 브릿지

- `CLAUDE.md`는 사람이 읽는 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 Codex가 같은 가이드를 읽기 위한 bridge다. 두 번째 원천이 아니다.
- 루트 `AGENTS.md`는 루트 `CLAUDE.md`를 가리킨다.
- 주요 workspace의 `AGENTS.md`도 같은 폴더의 `CLAUDE.md`를 가리킨다.
  - `apps/client/`
  - `apps/server/`
  - `packages/schema/`
  - `packages/ui/`
- 제품 기준과 위험 점검은 `context/project/`의 주제별 본문을 공통으로 읽는다. 도구별 자동 rule loader에 기대지 않는다.
- `.claude/skills/create-context-workspace`는 설치된 Context Harness에서 새 Workspace를 구성하는 Claude skill 원천이고 `.agents/skills/create-context-workspace`는 Codex bridge다.
- `.claude/settings.json`은 Claude Code lifecycle hook을 `.claude/hooks/maintain.py`에 연결한다. `.codex/hooks.json`은 Codex lifecycle을 `.codex/hooks/maintain.py`에 연결한다. 둘 다 새 session을 자동 binding하지 않으며, Claude payload의 `agent_id`가 있는 subagent event는 Main binding과 분리하기 위해 adapter가 조용히 무시한다.

## 브릿지 규칙

1. 도구별 파일은 공통 지침을 가리키거나 얇게 적응한다.
2. 도구별 파일이 별도 정책 원천처럼 조용히 갈라지면 안 된다.
3. Claude/Codex 양쪽 버전이 생기면 같은 내용인지, adapter인지, 의도적으로 다른지 기록한다.
4. skill은 호출 조건·판단·수행 방법을 충분히 설명하고, 제품 정책과 지속 context 관리 계약은 해당 Owner에 남긴다. 공통 실행 기준은 실제 consumer가 함께 쓰는 위치에서 소유한다. agent는 필요한 자료와 반환을 정한 report-only 실행자로 유지한다.
5. bridge, agent, skill을 추가하거나 크게 바꾸면 최종 응답 전에 bridge drift를 점검한다.

## Workspace Guide Contract

하위 `CLAUDE.md`는 구현 참고서이기 전에 path-scoped harness entrypoint다. 각 파일은 아래 질문에 짧게 답해야 한다.

- 이 workspace가 소유하는 구현 책임은 무엇인가.
- 같은 폴더의 `AGENTS.md`가 bridge symlink인지, 별도 정책 원천인지.
- 작업자가 루트 guide에서 들어온 뒤 변경할 책임에 맞는 어떤 Project 본문을 선택할 수 있는가.
- 어떤 내용은 이 파일에 쌓지 않고 Project의 주제별 설명·적용 가이드나 해당 기록 Owner에 두어야 하는가.

workspace guide는 짧게 유지한다. 긴 feature 설명, 교육용 예시, 디버깅 사례, 배포 후보가 필요하면 owning context나 archive로 분리한다. `pnpm harness:check`는 각 workspace guide가 `Harness Role`, local `AGENTS.md` bridge를 갖고 있고 과도하게 길어지지 않는지 확인한다.

작은 진입 가이드와 상세 Owner를 구별한 이유는 [Owner 통합 결정](../../context/project/decisions/0002-topic-ownership.md)에 있다.

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
5. `context/project/`의 주제별 Owner에서 계약·위험·이유와 제품별 적용·검증 방법을 함께 관리한다. 필요한 본문 선택은 기존 Project 색인과 경로별 guide가 안내한다. 개발 수행의 조율은 해당 스킬이 맡는다.
6. 지속할 프로젝트 구조 선택은 Project decisions에, 실행 방식의 형성 이유는 해당 스킬·관리 본문 가까이에, 이번 작업의 선택·검증은 Work 기록에 남긴다.
7. 제품 설명은 Project 관리 계약에 따라 현재 의미·필요한 선택 이유·authority를 함께 관리한다. 옛 원본을 현재 본문의 필수 읽기 경로로 연결하지 않는다.

## 커밋 메시지 기준

새 커밋은 가능한 한 Conventional Commit 형태를 사용한다.

```text
type(scope): summary
```

- runtime code는 `client`, `server`, `schema`, `ui` 같은 workspace scope를 우선한다.
- documentation/harness 변경은 `harness`, `context`, `readme`, `archive`처럼 가장 작은 문서 owner를 scope로 쓴다.
- scope는 변경이 진짜 repo-wide이거나 유용한 owner가 없을 때만 생략한다.

변경의 책임과 의도를 로그에서 추적하기 위한 규칙이다. 여러 workspace를 가로지르는 기능은 추적에 더 유용하면 `auth` 같은 domain scope를 사용할 수 있다. 기존 commit 이력을 이 규칙에 맞춰 다시 쓰지는 않는다.

## 실행 검증

하네스 구조나 문서 owner를 바꾼 뒤에는 아래 검증을 실행한다.

```bash
pnpm harness:check
```

이 검증은 `AGENTS.md -> CLAUDE.md` bridge, legacy 하네스 경로 부활 여부, active Markdown 링크, root 임시 계획 파일, whitespace diff를 확인한다.
실행층이 추가된 뒤에는 `.claude/skills`와 `.agents/skills`의 예상 파일과 bridge도 함께 확인한다.

## 실행층

현재 active 실행층:

- `create-context-workspace`: 설치 뒤 새 독립 또는 후속 Context Workspace를 구성·bounded 재진입 검토하는 skill이다. 최초 이식이나 기존 Workspace 단순 수정에는 사용하지 않는다.
- `start-app`: 직접 실행 요청 또는 실제 앱 검증이 필수인 작업에서 개발 DB·서버·클라이언트를 실행하고 연결을 확인한다.

`noline-work`는 2026-09-10 사용자 요청으로 deprecated 처리했다. 작업별 기준은 root·workspace guide와 Project 주제별 기준에서 직접 찾는다. 2026-10-31에 원본과 bridge를 현재 경로에서 제거했고 원본은 Ticket 10 archive에 보존했다.

agent/skill 파일은 discoverable 역할 정의일 뿐, 자동 team runner가 아니다. 여러 agent를 팀처럼 쓸 때의 호출 순서, 병렬화, 결과 통합은 메인 작업자가 정한다.

새 실행자는 반복 사용으로 모양이 충분히 안정된 뒤에만 추가한다. 제품 정책·지속 의미가 실행자에 쌓이면 owning docs로 되돌린다. skill의 수행 방법과 조건부 상세는 [스킬 관리 정책](../skills/SKILLS-CONTENT-POLICY.md)에 따라 충분히 유지하고, agent의 report-only 경계는 바꾸지 않는다.

## Context Harness 보완

[Project layer](../../context/project/README.md)와 [Spec·Ticket](../../context/work/workspaces/spec-and-tickets/README.md)이 지속 내용과 유지 책임을 소유한다. [운영 skill 색인](../skills/README.md)은 생성·Personal/Project 한정 갱신·논의·재판단·설명을 연결한다. `.claude/skills/` 원본과 `.agents/skills/` 상대 bridge를 유지하며 각 host adapter를 대체하지 않는다. Project 구성과 읽기·검증의 선택 이유는 [Project 구성 결정](../../context/project/decisions/0003-context-structure-and-verification.md)에 있다.

공통 읽기는 [USAGE](../../context/USAGE.md)로 연결한다. 최신 Personal·설명·한정 갱신의 부분 반영과 기존 경로 호환 이유는 [부분 반영 기록](../../context/_background/records/2026-10-30-noline-partial-reapplication.md)에 있다. Maintain·Work 전환 계약과 각 host 연결은 이번 보완에서 유지했다.

개발 수행·요청된 경험 개선의 추가와 옛4개 실행 경로 제거는 [development의 Noline 적응 기록](../skills/development/_background/records/2026-10-30-existing-work-contract-adaptation.md)을 따른다. 위 이전 부분 반영의 호환 유지 판단에서 현재 consumer 전환을 마친 범위만 이어 변경했다. Maintain 운영 계약은 유지한다.

2026-10-31 사용자 요청으로 옛 Noline agent 3종의 Claude·Codex 정의를 현재 경로에서 제거했다. 역할별 검토·검증은 development의 배정과 관련 Project 기준을 따르며, Maintain role과 lifecycle은 별도 Work 계약을 유지한다.
