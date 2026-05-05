# Noline Project Guide

> Noline: 네트워크가 없어도 여행은 계속된다. Selective Local-First 여행 관리 앱.

이 파일은 루트 탐색 허브다. 상세 정책은 `.claude/core/`, `.claude/features/`, workspace `CLAUDE.md`가 소유한다. 더 구체적인 owner 문서가 있으면 그 문서를 우선한다.

## Claude/Codex Bridge

- `CLAUDE.md`가 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 `CLAUDE.md`를 가리키는 Codex bridge다.
- 같은 bridge가 적용되는 workspace:
  - [apps/client/CLAUDE.md](./apps/client/CLAUDE.md)
  - [apps/server/CLAUDE.md](./apps/server/CLAUDE.md)
  - [packages/schema/CLAUDE.md](./packages/schema/CLAUDE.md)
  - [packages/ui/CLAUDE.md](./packages/ui/CLAUDE.md)
- 하네스 구조와 변경 규칙은 [Noline AI Harness](./.claude/harness/README.md)를 따른다.

## Start Here

| 필요 | 읽을 문서 |
| --- | --- |
| `.claude` 자료 역할 파악 | [Document Map](./.claude/README.md) |
| 하네스/bridge 작업 | [Noline AI Harness](./.claude/harness/README.md) |
| 코드 변경 전후 보호 정책 점검 | [Noline Guard Map](./.claude/guards/README.md) |
| 반복 작업 시작 순서 | [Noline Workflow Map](./.claude/workflows/README.md) |
| 하네스 개편 배경 | [Decision: AI Harness Restructure](./.claude/decisions/2026-05-06-ai-harness-restructure.md) |

## Common Workflows

| 작업 | 시작점 |
| --- | --- |
| 동기화 버그 수정 | [Debug Sync Issues](./.claude/workflows/README.md#sync-debug) |
| 새 Entity 추가 | [Add New Entity](./.claude/workflows/README.md#add-entity) |
| 날짜/시간 처리 | [Work with Dates/Times](./.claude/workflows/README.md#datetime-utils) |
| 통화 표시 | [Display Currency/Amounts](./.claude/workflows/README.md#currency-utils) |
| Form 구현 | [Implement Forms](./.claude/workflows/README.md#form-pattern) |
| UI 컴포넌트 | [Build UI Components](./.claude/workflows/README.md#component-guide) |
| API 추가 | [Add API Endpoint](./.claude/workflows/README.md#api-endpoint) |

## Project Identity

Noline은 불안정한 네트워크 환경에서도 여행 계획과 경비 기록을 이어갈 수 있게 하는 모바일 앱이다.

현재 용어:

| 개념 | 현재 이름 | 과거/역사 문서의 이름 |
| --- | --- | --- |
| 아키텍처 | Selective Local-First | Local-First, Offline-First, Local-First Server-Aware |
| 라우터 | Activation Router | Offline-Prep Router, Hybrid Router |
| ID 전략 | Client-Side ID Generation | Echo Protocol |
| UX 비유 | 오프라인 보험 | 선택적 활성화 |

용어 변경의 이유는 [2026-03-21 terminology decision](./.claude/decisions/2026-03-21-terminology-unification.md)에 기록되어 있다. 역사 문서의 오래된 용어는 그대로 둘 수 있지만, 현재 정책 설명에서는 위 용어를 사용한다.

## Core Invariants

1. 활성화된 여행은 Local SQLite가 진실의 원천이다. 비활성 여행은 Server API가 진실의 원천이다.
2. Trip/Schedule/Expense 같은 Data Layer는 Activation Router를 통해 Local/Remote를 분기한다.
3. Map/Search/Directions 같은 Service Layer는 소유권과 sync 대상이 아니므로 Policy 기반 Network-First로 다룬다.
4. 로컬 mutation과 `sync_queue` 추가는 `withTransaction` 안에서 원자적으로 처리한다.
5. Entity 생성 ID는 클라이언트가 `generateId()`로 만들고, 서버는 클라이언트 ID를 수용한다.
6. `@repo/schema`가 클라이언트/서버 타입 계약의 원천이다. 타입은 schema에서 `z.infer`로 추론한다.
7. 시간 값은 ISO 8601 datetime with timezone으로 저장/전송하고, 표시는 shared util에서 처리한다.
8. delete flow는 soft delete와 cleanup 안전 조건을 따른다.
9. 서버 route는 인증과 user ownership을 확인한다.
10. 정책 제한 UI는 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 패턴을 먼저 사용한다.

상세 체크는 [Guard Map](./.claude/guards/README.md)을 기준으로 한다.

## Architecture Sources

| 주제 | Source |
| --- | --- |
| 전체 구조/FSD | [architecture.md](./.claude/core/architecture.md) |
| Selective Activation, Router, sync | [selective-activation-architecture.md](./.claude/core/selective-activation-architecture.md) |
| API/Data/query key/repository | [api-data.md](./.claude/core/api-data.md) |
| Policy Layer | [policy-architecture.md](./.claude/core/policy-architecture.md) |
| 날짜/시간 | [time.md](./.claude/core/time.md) |
| TypeScript/Zod | [typescript.md](./.claude/core/typescript.md) |
| UI component rules | [components.md](./.claude/core/components.md) |
| Error handling | [error-handling.md](./.claude/core/error-handling.md) |
| Activation system | [activation-system.md](./.claude/features/activation-system.md) |
| Manual input | [manual-input.md](./.claude/features/manual-input.md) |
| Currency | [currency.md](./.claude/features/currency.md) |
| Forms | [form.md](./.claude/features/form.md) |
| Offline map/routing | [offline-map.md](./.claude/features/offline-map.md), [offline-routing.md](./.claude/features/offline-routing.md) |

## Workspace Ownership

| Workspace | 책임 | Guide |
| --- | --- | --- |
| `apps/client` | React Native, FSD, local DB, Router, policy UI, offline features | [apps/client/CLAUDE.md](./apps/client/CLAUDE.md) |
| `apps/server` | Express routes, auth/user scope, PostgreSQL, sync endpoints | [apps/server/CLAUDE.md](./apps/server/CLAUDE.md) |
| `packages/schema` | Zod entity/request/response contract | [packages/schema/CLAUDE.md](./packages/schema/CLAUDE.md) |
| `packages/ui` | 공유 UI primitives와 컴포넌트 철학 | [packages/ui/CLAUDE.md](./packages/ui/CLAUDE.md) |

## Project Structure

```text
noline/
├── apps/
│   ├── client/          # React Native + Expo app
│   └── server/          # Express API server
├── packages/
│   ├── schema/          # Shared Zod contracts
│   ├── ui/              # Shared UI components
│   └── eslint-config/   # Shared lint config
├── .claude/
│   ├── core/            # Active architecture/policy docs
│   ├── features/        # Feature guides
│   ├── guards/          # High-cost rule map
│   ├── workflows/       # Repeated task entry points
│   ├── harness/         # AI/developer harness map
│   ├── commands/        # Claude command references
│   ├── decisions/       # Decision records
│   ├── implementation/  # Trackers/history
│   ├── sessions/        # Session records
│   ├── references/      # PRD/wireframe/source material
│   ├── audits/          # Document audit/test evidence
│   └── _archive/        # Deprecated historical material
└── CLAUDE.md            # This navigation hub
```

## Tech Stack

| Area | Stack |
| --- | --- |
| Mobile client | React Native, Expo, TypeScript, NativeWind, React Query |
| Local data | SQLite, Drizzle-style local schema, sync_queue |
| Server | Node.js, Express, TypeScript, PostgreSQL, Drizzle ORM |
| Shared contract | `@repo/schema`, Zod |
| Workspace tooling | pnpm workspaces |

## Quick Commands

```bash
# 개발 환경
pnpm client start
pnpm server dev

# 데이터베이스
pnpm server db:push
pnpm server db:studio
pnpm server db:generate

# 빌드/검증
pnpm server build
pnpm server typecheck
pnpm lint
pnpm schema build
```

## Documentation Rules

- 루트는 탐색과 핵심 불변식만 소유한다.
- 상세 정책은 가장 작은 owner 문서에 둔다.
- 기존 history, session, reference, archive 문서를 삭제하거나 현재 정책처럼 고치기 전에 [Document Map](./.claude/README.md)에서 역할을 확인한다.
- active guide와 코드가 충돌하면 코드를 확인하고 active guide만 최소 수정한다.
- 정책이나 하네스 구조가 바뀌면 [decisions/](./.claude/decisions/)에 결정 기록을 남긴다.
- `.claude/commands/`는 Claude command reference다. Codex로 자동 이식하지 않는다.

## Claude Commands

문서 관리 command 자료는 [commands/](./.claude/commands/)에 있다. Codex 작업에서는 참고 자료로만 읽고, Claude 전용 실행 전제를 그대로 재현하지 않는다.
