---
name: noline-work
description: Noline repo에서 기능 구현, 버그 수정, sync/activation/policy 작업, 하네스 변경을 시작할 때 쓰는 실행 dispatcher. 작업 유형에 맞는 guide/rule/runbook/context를 고르고 필요한 report-only agent와 검증 명령을 연결한다.
---

# noline-work

이 skill은 Noline 작업의 실행층이다. 기준 본문을 새로 소유하지 않고, 루트 guide, workspace guide, `rules/`, `guards/`, `runbooks/`, `context/`를 작업 유형에 맞게 꺼내는 dispatcher로만 동작한다.

## 실행 흐름

```text
Context -> Workplan -> Implementation -> Policy Check -> Verification -> Handoff
```

1. **Context**: 루트 `CLAUDE.md`, 작업 경로의 workspace `CLAUDE.md`, `.claude/runbooks/README.md`에서 작업 유형을 고른다.
2. **Workplan**: 관련 `rules/`와 `guards/`를 1차로 읽고, 모호한 경우에만 `context/`로 내려간다.
3. **Implementation**: 코드 변경은 기존 workspace 패턴을 따른다. 문서나 하네스 변경은 가장 작은 owner에 둔다.
4. **Policy Check**: sync-owned data, server auth, schema, time, policy UI가 닿으면 `noline-policy-checker`를 report-only로 사용한다.
5. **Verification**: 변경 범위에 맞는 build/typecheck/lint/test와 `pnpm harness:check`를 실행한다.
6. **Handoff**: 변경 요약, 실행한 검증, 남은 위험을 짧게 남긴다.

## 작업 유형 라우팅

| 작업 | 먼저 읽을 자료 | 후속 실행자 |
| --- | --- | --- |
| 새 Entity / schema / API | `.claude/runbooks/README.md#add-entity`, `rules/schema-first.md`, `rules/client-side-id.md`, `rules/auth-user-scope.md` | `noline-context-collector`, `noline-policy-checker` |
| sync / activation / offline bug | `.claude/runbooks/README.md#sync-debug`, `rules/activation-router.md`, `rules/transaction-sync-queue.md`, `guards/README.md` | `noline-context-collector`, `noline-policy-checker` |
| client form / policy UI | `.claude/runbooks/README.md#form-pattern`, `rules/policy-ui.md`, `rules/iso-time.md` | `noline-policy-checker` |
| UI component | `.claude/runbooks/README.md#component-guide`, `packages/ui/CLAUDE.md`, `context/components.md` | 필요 시 `noline-context-collector` |
| 하네스 / bridge / docs | `.claude/harness/README.md`, `.claude/README.md`, 관련 decision | `noline-harness-observer` |

## Workspace 진입 기준

루트 guide 다음에는 작업 경로와 가장 가까운 workspace guide 하나를 먼저 읽는다.

| Path | Workspace guide | 하네스상 기대 |
| --- | --- | --- |
| `apps/client/**` | `apps/client/CLAUDE.md` | client-only 구현 패턴, Router/local DB/policy UI 경계 확인 |
| `apps/server/**` | `apps/server/CLAUDE.md` | route/auth/user scope/DB/sync endpoint 경계 확인 |
| `packages/schema/**` | `packages/schema/CLAUDE.md` | Zod contract와 client/server blast radius 확인 |
| `packages/ui/**` | `packages/ui/CLAUDE.md` | pure primitive와 app composition 경계 확인 |

workspace guide가 공통 정책을 길게 복사하거나 오래된 이력을 현재 정책처럼 들고 있으면, 구현 전에 owning doc로 분리하거나 active guide를 줄인다.

## Agent 사용 기준

- `noline-context-collector`: 관련 코드, 문서, decision, 최근 commit을 한 장의 context card로 모을 때만 사용한다.
- `noline-policy-checker`: 구현 후 Router, transaction, schema, auth, time, soft delete, policy UI drift를 확인할 때 사용한다.
- `noline-harness-observer`: 하네스/bridge/agent/skill 변경 후 층위 배치와 Claude/Codex parity를 볼 때 사용한다.

agent는 report-only다. 파일 수정은 메인 작업자가 한다.

## Team Workflow

agent 파일이 있다고 해서 자동으로 팀이 실행되지는 않는다. `noline-work`는 어떤 agent를 붙일지 고르는 dispatcher이고, 실제 호출 순서와 병렬화는 메인 작업자가 작업 범위에 맞게 결정한다.

기본 팀 흐름:

```text
1. noline-context-collector (optional, before implementation)
2. main worker implementation
3. noline-policy-checker (when code touches high-cost policy)
4. noline-harness-observer (only when harness/bridge changes)
5. deterministic verification scripts
```

병렬화 기준:

- `noline-context-collector`는 메인 구현 전 blocker면 직접 읽고, sidecar 수집이면 subagent로 맡긴다.
- `noline-policy-checker`는 구현 diff가 생긴 뒤에만 의미가 있다.
- `noline-harness-observer`는 일반 기능 구현 팀에 끼우지 않는다.

## 검증 기준

항상:

```bash
pnpm harness:check
git status --short --branch
```

범위별 추가:

```bash
pnpm schema build
pnpm server typecheck
pnpm server build
pnpm lint
```

client-only 변경은 workspace guide의 Expo/React Native 명령을 우선 확인한다. 전체 명령이 느리거나 환경 의존적이면 실행하지 못한 이유를 남긴다.

## 경계

- 이 skill에 정책 본문을 축적하지 않는다.
- Claude command를 Codex command로 자동 변환하지 않는다.
- `.claude/agents`나 `.codex/agents`에 파일을 둔 것만으로 자동 팀 실행이 생긴다고 가정하지 않는다.
- hook/config/rule은 deterministic enforcement가 필요할 때만 만든다.
- 한 번의 작업 불편을 곧장 새 agent나 새 rule로 승격하지 않는다.
