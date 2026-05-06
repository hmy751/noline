# Noline 개발 하네스 재설계 플랜

> 임시 루트 플랜.
> 생성일: 2026-05-06
> 브랜치: `docs/harness-doc-prune`
> 상태: 하네스 레이어 모델 패스의 구현 체크포인트.

이 파일은 다음 Claude/Codex 세션이 현재 작업을 단순한 `core/` 축소나 완료된 cleanup으로 오해하지 않도록 루트에 임시로 둔다.

영구 정책 문서가 아니다. 재설계가 끝나면 필요한 재진입 메모만 `.claude/audits/`나 `.claude/decisions/`로 옮기고 이 루트 파일은 제거한다.

## 왜 이 작업을 하는가

최근 병합된 `docs/noline-harness-restructure` 브랜치는 root guide, document map, harness map, guard map, workflow map, Codex bridge, archive hygiene를 만들며 Noline의 AI/developer 문서를 훨씬 안전하게 정리했다.

이번 후속 작업의 질문은 더 깊다.

- `.claude/core/`가 현대적인 AI coding harness의 중심으로 여전히 맞는가?
- `core/`와 `features/`가 오래된 구현 가이드를 항상 적용되는 지침처럼 보이게 하지 않는가?
- `blog`나 `dev-hub`를 그대로 복사하지 않고, Noline에 맞는 하네스 구조로 번역할 수 있는가?

현재 답은 이렇다. `core/`는 앱 아키텍처 맥락 이름으로는 유용하지만, 하네스의 중심 레이어로는 적합하지 않다. Noline은 아래 구조로 이동한다.

- 작은 root guide
- 작업/경로별 짧은 규칙
- 고비용 실패를 막는 guard
- 반복 작업 runbook
- 필요할 때 여는 context/reference
- `.claude`에 강제하지 않는 Claude/Codex bridge ownership
- 반복 사용이 확인된 뒤에만 추가하는 agent/skill 후보
- decisions/audits/archive를 통한 history와 검증 보존

## 현재 작업 상태

나중에 이어서 작업할 때 먼저 실행한다.

```bash
git status --short --branch
```

예상 브랜치:

```text
docs/harness-doc-prune
```

현재 중요한 상태:

- 2026-05-06 초기에 만들었던 1차 doc-pruning 변경은 되돌렸다.
- 지금 작업은 큰 문서 이동이나 archive 전에 레이어 모델을 먼저 세우는 방향이다.
- 현재 구현된 방향:
  - `.claude/rules/`: 짧은 작업/경로별 규칙
  - `.claude/runbooks/`: 반복 작업 진입점
  - `.claude/context/`: 깊은 맥락과 `core/` / `features/` 호환성 지도
  - `.claude/workflows/README.md`: runbooks로 보내는 호환성 redirect
  - `.claude/decisions/2026-05-06-harness-layer-model.md`: owner/bridge 모델 결정 기록
- 아래 untracked 파일은 이 패스에서 건드리지 않았다.
  - `.claude/decisions/2026-05-06-commit-message-convention.md`
- 출처가 애매한 staged/untracked 작업을 삭제하거나 덮어쓰지 않는다.

이어 작업할 때는 먼저 확인한다.

```bash
git diff --stat
git diff --name-status
```

## 참고 입력

아래 자료는 복사할 template이 아니라 pattern source로만 사용한다.

### 외부 도구 참고

- AGENTS.md standard: agent-specific instruction은 README를 보완하고, 큰 monorepo는 nested instruction file을 둔다.
  - Source: https://agents.md/
- OpenAI Codex agent loop: project instruction은 모아 읽히며 기본 project-doc budget이 있으므로 root instruction은 작아야 한다.
  - Source: https://openai.com/index/unrolling-the-codex-agent-loop/
- Claude Code memory/rules docs: `CLAUDE.md`는 200줄 이하를 목표로 하고, 크거나 경로별인 지침은 `.claude/rules/`나 skill로 뺀다.
  - Source: https://code.claude.com/docs/en/memory
- Cursor project rules: rule은 always-on, path/glob, agent-requested, manual activation처럼 scope가 있을 때 가장 잘 작동한다.
  - Source: https://docs.cursor.com/en/context/rules
- GitHub Copilot custom instructions: repository-wide와 path-specific instruction을 함께 적용할 수 있다.
  - Source: https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot

### 로컬 reference project

`blog`에서 가져올 만한 점:

- `editorial/`이 `core/`, `lenses/`, `guards/`, `reference-profiles/`, `context/`, `decisions/`, `audits/`를 분리한다.
- `editorial/core/reference-use.md`의 핵심은 reference를 관찰하고, 효과를 추상화한 뒤, 현재 프로젝트에 맞게 적응하고, hardcoding을 피하는 것이다.
- 단, blog taxonomy를 그대로 복사하지 않는다. Noline은 writing harness가 아니라 development harness다.

`dev-hub`에서 가져올 만한 점:

- `CLAUDE.md`/`AGENTS.md` bridge가 명시적이다.
- `.claude/rules/`와 `.codex/rules/`를 이름이 같다는 이유로 같은 것으로 취급하지 않는다.
- always-loaded rule은 format lock-in과 token noise를 만들 수 있음을 decision으로 보존한다.
- global reusable skeleton과 local project profile을 분리한다.
- 실제 문제는 문서의 양보다 re-entry cost라는 관점이 유용하다.

## 목표 구조

현재 목표 구조다. 이미 일부 구현됐지만, 링크와 파일 역할을 확인하면서 계속 조정한다.

Root/shared 표면:

```text
CLAUDE.md        # Claude/human이 읽는 현재 root guide 원천
AGENTS.md        # Codex bridge. 현재는 CLAUDE.md symlink
.claude/         # 현재 repository-local harness surface와 기존 project docs
.codex/          # 구체적인 Codex-only 필요가 있을 때만 생성
.agents/         # 구체적인 shared-agent/skill 필요가 있을 때만 생성
```

`.claude/` 내부 후보:

```text
.claude/
├── harness/        # 하네스 ownership, Claude/Codex bridge, layer model
├── rules/          # plain Markdown project rule. Codex/Claude loader rule로 자동 취급하지 않음
├── guards/         # 데이터 손실, auth leak, sync break 같은 고비용 실수 지도
├── runbooks/       # add entity, debug sync, add API 같은 반복 절차
├── context/        # startup reading이 아닌 깊은 subsystem 설명
├── references/     # PRD, wireframe, image 등 제품/source material
├── decisions/      # 왜 구조나 정책이 바뀌었는지
├── audits/         # 검증, inventory, drift check, handoff note
└── _archive/       # 오래된 긴 guide와 historical material
```

열린 설계 질문:

- 이번 패스에서는 common harness docs를 `.claude/` 아래에 유지하고 bridge ownership을 명확히 한다.
- 나중에 필요하면 `.agents/harness/`나 `docs/ai-harness/` 같은 중립 표면으로 옮길 수 있다.

링크 churn과 tool loading behavior를 확인하기 전에는 이동하지 않는다. `.agents/`, `.codex/`, local agent, local skill도 플랜에 언급됐다는 이유만으로 만들지 않는다. 이들은 목표가 아니라 optional surface다.

## 현재 mapping 후보

| 현재 | 후보 | 메모 |
| --- | --- | --- |
| `.claude/core/architecture.md` | `.claude/context/architecture.md` | deep architecture context. always-on 아님. |
| `.claude/core/typescript.md` | `.claude/rules/schema-first.md` + context/archive | schema-first rule과 일반 TS style을 분리. |
| `.claude/core/selective-activation-architecture.md` | `.claude/rules/activation-router.md` + context | guard-worthy rule과 background context 분리. |
| `.claude/core/api-data.md` | `.claude/context/api-data.md` 또는 runbook link | rule-like인지 설명인지에 따라 결정. |
| `.claude/core/policy-architecture.md` | `.claude/rules/policy-ui.md` + context | UI policy는 rule-like, matrix/background는 context. |
| `.claude/core/time.md` | `.claude/rules/iso-time.md` | compact current rule. |
| `.claude/core/components.md` | `.claude/rules/component-boundaries.md` 또는 context | 검증 가능한 boundary만 rule로 유지. |
| `.claude/core/error-handling.md` | `.claude/context/error-handling.md` | hard rule이 생기기 전에는 context. |
| `.claude/features/*` | `.claude/context/*` 또는 `.claude/runbooks/*` | feature docs는 보통 harness center가 아니라 context. |
| `.claude/workflows/README.md` | `.claude/runbooks/README.md` | 반복 절차는 runbooks가 더 명확함. |

## 설계 원칙

1. Root guide는 작게 유지한다.
   - Root `CLAUDE.md`/`AGENTS.md`는 navigation hub이지 policy database가 아니다.
   - 특별한 이유가 없으면 200줄 안팎을 목표로 한다.

2. Rule은 reference doc이 아니다.
   - rule은 짧고 구체적이며 검증 가능해야 한다.
   - "이 파일을 수정할 때 무엇을 해야 하거나 피해야 하는가?"에 답한다.

3. Guard는 고비용 실패를 다룬다.
   - 데이터 손실, sync drift, auth leakage, contract breakage처럼 비용 큰 것을 다룬다.
   - 일반 tip은 guard로 만들지 않는다.

4. Runbook은 반복 절차를 다룬다.
   - add entity, debug sync, add endpoint, implement form, date/time change 같은 작업.
   - rule과 context를 link할 수 있지만 본문을 복사하지 않는다.

5. 맥락 문서는 깊은 설명을 보존한다.
   - architecture, activation model, offline routing, offline map, old feature rationale.
   - 필요할 때 열고 startup memory처럼 취급하지 않는다.

6. Archive는 공격적으로, 하지만 안전하게 쓴다.
   - 유용하지만 stale하거나 긴 문서는 `_archive/`로 옮긴다.
   - 링크가 많은 path는 짧은 stub이나 redirect를 남긴다.

7. 결정 기록은 이유를 설명한다.
   - layer rename이나 policy center 이동은 decision record를 남긴다.
   - 단순 typo/link fix에는 decision이 필요 없다.

8. Reference는 pattern으로 번역한다.
   - `blog`와 `dev-hub`의 형식을 그대로 복사하지 않는다.
   - Noline에 맞는 효과로 번역한다.

9. Bridge는 별도 레이어다.
   - shared intent와 project policy를 tool-specific implementation file에 숨기지 않는다.
   - `CLAUDE.md`와 `AGENTS.md`는 source를 공유할 수 있지만, Claude rules, Codex rules, agents, skills는 format이 다를 수 있다.
   - tool-specific adapter는 common source를 가리킬 수 있지만 조용히 source가 되면 안 된다.

10. Agent와 skill은 optional execution surface다.
    - agent는 기본적으로 report-only다.
    - skill은 언제 실행하고, 무엇을 읽고, 어떤 output을 낼지 설명한다.
    - policy body는 owning docs가 소유한다.
    - 같은 task shape이 반복되기 전에는 local agent/skill을 만들지 않는다.

## 브릿지 모델

현재 Noline 상태:

- root `AGENTS.md`는 `CLAUDE.md` symlink다.
- workspace `AGENTS.md`는 `apps/client`, `apps/server`, `packages/schema`, `packages/ui`에 있다.
- `.agents/`는 없다.
- `.codex/`는 없다.
- `.claude/agents/`와 `.claude/skills/`도 없다.

목표 bridge model은 아래 surface를 개념적으로 열어두되, 필요 없으면 만들지 않는다.

| Surface | 후보 역할 | source rule |
| --- | --- | --- |
| `CLAUDE.md` | Claude/human용 shared root guide source | 작고 navigation 중심으로 유지. |
| `AGENTS.md` | Codex bridge to root guide | symlink 또는 generated mirror. 조용히 갈라지지 않음. |
| workspace `CLAUDE.md` | workspace owner guide | 해당 workspace에 local하게 유지. |
| workspace `AGENTS.md` | Codex bridge to workspace guide | Codex도 같은 local guide를 봐야 할 때 symlink. |
| `.claude/rules/` | plain Markdown project rules | 현재 harness surface의 common project guidance. Claude-only loader rule이 아님. |
| `.codex/rules/` | optional Codex-specific command/runtime policy | 구체적인 Codex-only 필요가 있을 때만 생성. `.claude/rules/`를 맹목적으로 mirror하지 않음. |
| `.claude/agents/` | optional Claude agent definitions | 반복되는 report-only role이 분명해진 뒤 생성. |
| `.codex/agents/` | optional Codex TOML agent definitions | 양쪽 모두 필요할 때만 의미 기준으로 pair. |
| `.claude/skills/` | optional Claude skill source | Noline-specific repeated workflow가 있을 때만 생성. |
| `.agents/skills/` | optional Codex-compatible skill bridge | local skill에 Codex bridge가 필요할 때만 생성. |
| `.agents/README.md` | optional bridge manifest | `.agents/`가 필요해졌을 때만 생성. |

브릿지 규칙:

- Claude만 load할 수 있으면 shared라고 부르지 않는다.
- 구체적 use case 없이 Claude/Codex-specific version을 만들지 않는다.
- 양쪽 버전이 생기면 equivalent, adapter, intentionally different 중 무엇인지 기록한다.
- agents/skills/bridges를 추가하거나 바꾸면 final response 전에 bridge audit을 돌린다.

## 마이그레이션 체크리스트

### 0단계. 멈추고 안정화

- [x] 브랜치가 `docs/harness-doc-prune`인지 확인.
- [x] staged/unstaged 변경 확인.
- [x] 1차 pruning 변경을 유지/되돌림/적응할지 결정.
- [x] broader layer model에서 시작하도록 1차 pruning 변경 되돌림.
- [x] `.claude/decisions/2026-05-06-commit-message-convention.md`는 origin/intent 확인 전까지 건드리지 않음.
- [x] 파일 이동 전 이 문서를 다시 읽음.

### 1단계. Owner와 브릿지 모델

- [x] `.claude/harness/README.md`에 target layer model 반영.
- [x] Claude/Codex bridge model 명시.
- [x] 이번 패스에서는 common harness docs를 `.claude/`에 유지하기로 결정.
- [x] always read / scoped / on-demand layer 정의.
- [x] `.claude/decisions/`에 model 기록.
- [x] owner model이 분명해지기 전에는 큰 파일 이동을 피함.

### 2단계. 새 레이어 directory와 manifest

- [x] `.claude/rules/README.md` 생성.
- [x] `.claude/runbooks/README.md` 생성.
- [x] `.claude/context/README.md` 생성.
- [x] 각 layer를 언제 쓰는지 설명.
- [x] concrete tool-specific need 없이 `.agents/`나 `.codex/`를 만들지 않음.
- [x] `.agents/` manifest는 만들지 않음. 이번 패스에 불필요.
- [x] `.codex/` subdirectory도 만들지 않음. 이번 패스에 불필요.
- [x] 기존 `guards/`, `decisions/`, `audits/`, `references/`, `_archive/` 유지.

### 3단계. 핵심 규칙 추출

- [x] schema-first rule 추출.
- [x] Activation Router / Local-Remote routing rule 추출.
- [x] transaction + `sync_queue` rule 추출.
- [x] ISO 8601 time rule 추출.
- [x] auth/user-scope rule 추출.
- [x] Policy UI rule 추출.
- [x] high-cost sync invariant라서 Client-Side ID를 별도 compact rule로 추가.
- [x] Claude `.claude/rules/` frontmatter path scope는 적용하지 않음. 현재 파일은 plain Markdown이며 Claude-only loader rule이 아님.
- [x] 각 rule을 짧고 구체적으로 유지.

### 4단계. workflows를 runbooks로 전환

- [x] `.claude/workflows/README.md`를 `.claude/runbooks/README.md`로 재구성.
- [x] 스캔성이 좋아질 때만 split한다는 기준 유지. 이번 패스에서는 README 중심.
- [x] root와 harness link 업데이트.
- [x] old workflow path에는 compatibility redirect를 남김.

### 5단계. 깊은 source를 context로 이동

- [ ] explanatory `core/` docs를 `.claude/context/`로 실제 이동.
- [ ] explanatory feature guide를 `.claude/context/`로 실제 이동.
- [x] 기존 long version은 `_archive/`에 보존.
- [x] 링크가 많은 old path는 유지하거나 context map으로 연결.
- [x] 이번 선택: link stability를 위해 `core/`와 `features/`를 제자리에 두고, `.claude/context/README.md`를 compatibility map으로 둠.

### 6단계. root와 workspace guides

- [x] root `CLAUDE.md`를 startup/navigation guide로 축약.
- [x] workspace `CLAUDE.md`는 local owner rule과 command 중심으로 유지.
- [x] workspace guide가 `rules/`, `runbooks/`, `context/` 중 어디로 연결할지 결정.
- [x] 같은 rule을 root/workspace/rules에 중복 복사하지 않음.
- [x] workspace guide quick link를 `rules/`, `runbooks/`, `context/` 우선으로 정렬.

### 7단계. 검증

- [x] active markdown local link scan 실행.
- [x] `.claude/core/`, `.claude/features/`, `.claude/workflows/` stale path scan 실행.
- [x] `git diff --check` 실행.
- [x] staged file list가 documentation/harness 변경만 포함하는지 확인.
- [x] `AGENTS.md -> CLAUDE.md` symlink check 실행.
- [x] `.agents/`, `.codex/`, `.claude/agents/`, `.claude/skills/`가 바뀌지 않았음을 확인.
- [x] global/project harness 또는 bridge file 변경 후 `tooling-map-auditor` 실행.
- [ ] merge 전 이 임시 플랜을 `.claude/audits/`로 옮기거나 필요한 내용을 보존한 뒤 제거.

검증 메모:

- root, workspace guide, 새 harness layer를 포함한 23개 markdown file의 local link/anchor scan 통과.
- `git diff --check` 통과.
- tracked/untracked file list는 documentation/harness-only다. 단, `.claude/decisions/2026-05-06-commit-message-convention.md`는 origin/intent가 이번 패스 범위가 아니어서 untouched 상태로 남아 있다.
- `AGENTS.md -> CLAUDE.md` symlink bridge는 root, `apps/client`, `apps/server`, `packages/schema`, `packages/ui`에서 유지된다.
- `.agents/`, `.codex/`, `.claude/agents/`, `.claude/skills/` surface는 만들지 않았다.
- stale path scan은 `core/`, `features/`, `workflows/`에 대한 의도적 compatibility/context reference를 찾는다. root와 active map은 새 작업을 `rules/`, `runbooks/`, `context/`로 라우팅한다.
- `tooling-map-auditor`는 must-fix bridge issue가 없다고 보고했다. root temporary plan은 merge 전에 이동/제거해야 한다고 했고, workspace guide cleanup은 optional이라고 봤다. 이후 workspace quick link를 `rules/`, `runbooks/`, `context/`로 정렬했다.

## 멈춤 조건

아래 상황에서는 계속 진행하기 전에 사용자에게 확인한다.

- 역할이 불명확한 문서를 삭제해야 할 때.
- 한 파일에 current policy와 irreplaceable history가 섞여 안전하게 분리하기 어려울 때.
- runtime code 변경이 필요해질 때.
- local에서 검증되지 않은 Claude/Codex bridge behavior가 필요할 때.
- 새 agent/skill이 owning docs로 link하지 않고 policy를 복제하게 될 때.
- `.claude` path를 쓰는 이유가 "이미 있어서"뿐이고 Claude ownership이 분명하지 않을 때.
- historical folder의 link를 대규모로 바꾸지만 이득이 cosmetic 수준일 때.

## 검증 명령어

고정 ritual은 아니지만 기본 출발점으로 쓴다.

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
git diff --check
```

링크 scan은 작은 throwaway Node script로 active markdown link를 확인한다. repo tooling으로 유지할 가치가 생기기 전에는 script file을 commit하지 않는다.

## 완료 기준

이 재설계는 아래 조건이 맞을 때 완료로 본다.

- 새 세션이 always-on instruction, path rule, guard, runbook, deep context, decision, audit, archive의 위치를 구분할 수 있다.
- root `CLAUDE.md`가 더 이상 `core/`와 `features/`를 하네스 중심처럼 가리키지 않는다.
- `core/` / `features/`는 제거, archive, 또는 compatibility/context source로 명확히 분류된다.
- Claude/Codex bridge ownership이 명시된다.
- 향후 local agent/skill의 home과 drift-check rule이 분명하다.
- high-cost rule이 짧고 찾기 쉽다.
- 반복 작업은 runbook에서 시작한다.
- historical material은 복구 가능하게 남아 있다.
- 검증이 통과한다.
- 이 temporary root plan은 제거되거나 audit handoff로 대체된다.
