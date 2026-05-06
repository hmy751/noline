# Noline Client Workspace Guide

> React Native/Expo client harness entrypoint.

## Harness Role

이 파일은 `apps/client`를 수정할 때 AI 작업자가 먼저 읽는 path-scoped 실행 가이드다. 목적은 client-only 책임과 위험 경계를 빠르게 잡는 것이고, 긴 기능 설명을 보존하는 것이 아니다.

- `apps/client/CLAUDE.md`가 클라이언트 workspace guide의 원천이다.
- `apps/client/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업 실행 순서는 루트 [noline-work skill](../../.claude/skills/noline-work/SKILL.md)을 따른다.
- 공통 정책은 이 파일에 복사하지 않고 `rules/`, `guards/`, `runbooks/`, `context/` 중 가장 작은 owner로 보낸다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| client 기능/버그 공통 | [Runbooks](../../.claude/runbooks/README.md), [Guard Map](../../.claude/guards/README.md) |
| Data Entity, repository, React Query | [API/Data context](../../.claude/context/api-data.md), [Activation Router rule](../../.claude/rules/activation-router.md) |
| local write, sync queue, soft delete | [Transaction + Sync Queue rule](../../.claude/rules/transaction-sync-queue.md) |
| form/manual input | [Form runbook](../../.claude/runbooks/README.md#form-pattern), [Form context](../../.claude/context/form.md) |
| policy 제한 UI | [Policy UI rule](../../.claude/rules/policy-ui.md), [Policy context](../../.claude/context/policy-architecture.md) |
| offline map/routing | [Offline map context](../../.claude/context/offline-map.md), [Offline routing context](../../.claude/context/offline-routing.md) |
| UI composition | [Component context](../../.claude/context/components.md), [UI package guide](../../packages/ui/CLAUDE.md) |

## Ownership

| Area | Client가 소유하는 것 | 다른 owner로 보낼 것 |
| --- | --- | --- |
| `entities/*/model` | schema에서 `z.infer`로 client model 연결 | schema shape 자체는 `packages/schema` |
| `entities/*/api` | remote 호출과 response validation | 서버 route 정책은 `apps/server` |
| `entities/*/lib` | SQLite datasource와 local mutation | 공통 transaction 정책은 rule |
| `entities/*/repository` | Activation Router 경계 | Router 정책 본문은 rule/context |
| `entities/*/data` | React Query keys/hooks | query key 원칙은 context |
| `features/*` | 사용자 workflow와 form submit 조합 | 공통 form 원칙은 runbook/context |
| `shared/components` | 앱 공용 composition | 순수 primitive는 `packages/ui` |
| `shared/services/*` | client-side policy/service integration | Data/Service 분리 정책은 guard/context |

## High-Risk Checks

- sync-owned Data Entity는 `model -> api/lib -> repository -> data` 경계를 유지한다.
- UI나 feature screen에서 SQLite/API를 직접 골라 Local/Remote routing을 우회하지 않는다.
- local mutation과 `sync_queue` 추가는 가능한 한 같은 `withTransaction` 안에 둔다.
- create flow는 `generateId()`와 client-created ID 전략을 따른다.
- 날짜/시간은 저장/전송 boundary에서 ISO 8601 datetime with timezone을 유지한다.
- offline/active/inactive 제한은 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 policy primitive를 먼저 확인한다.
- Map/Search/Directions 같은 Service Layer는 sync-owned Data Entity처럼 취급하지 않는다.

## Current Path Map

```text
apps/client/src/
├── entities/          # model/api/lib/repository/data/ui
├── features/          # user workflow slices
├── screens/           # screen-level composition
└── shared/
    ├── api/           # API client boundary
    ├── components/    # app composition components
    ├── db/            # SQLite schema/migrations
    ├── lib/           # client utilities
    ├── policy/        # app policy primitives
    └── services/      # sync, offline prep, map/directions, auth, id
```

## Commands

```bash
pnpm client start
pnpm client lint
pnpm harness:check
```

범위가 schema/server까지 번지면 `pnpm schema build`, `pnpm server typecheck`, `pnpm server build`도 함께 고려한다.

## Update Rule

이 파일에는 client 작업자가 시작 전에 알아야 할 경계만 남긴다. 긴 feature 설명, 과거 구현 과정, 디버깅 사례는 `context/`, `sessions/`, `_archive/`로 보낸다.
