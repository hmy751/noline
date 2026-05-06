# Noline Server Workspace Guide

> Express/TypeScript server harness entrypoint.

## Harness Role

이 파일은 `apps/server`를 수정할 때 AI 작업자가 먼저 읽는 path-scoped 실행 가이드다. 목적은 server-only 책임과 위험 경계를 빠르게 잡는 것이고, 배포/운영 참고서를 늘리는 것이 아니다.

- `apps/server/CLAUDE.md`가 서버 workspace guide의 원천이다.
- `apps/server/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업 실행 순서는 루트 [noline-work skill](../../.claude/skills/noline-work/SKILL.md)을 따른다.
- client/schema와 함께 지켜야 하는 정책은 이 파일에 복사하지 않고 `rules/`, `guards/`, `runbooks/`, `context/` 중 가장 작은 owner로 보낸다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| API endpoint 추가/수정 | [API endpoint runbook](../../.claude/runbooks/README.md#api-endpoint), [Schema First rule](../../.claude/rules/schema-first.md) |
| auth/user ownership | [Auth/User Scope rule](../../.claude/rules/auth-user-scope.md), [Guard Map](../../.claude/guards/README.md) |
| client-created ID create flow | [Client-Side ID rule](../../.claude/rules/client-side-id.md) |
| sync endpoint | [Transaction + Sync Queue rule](../../.claude/rules/transaction-sync-queue.md), [Sync debug runbook](../../.claude/runbooks/README.md#sync-debug) |
| time fields | [ISO Time rule](../../.claude/rules/iso-time.md), [Time context](../../.claude/context/time.md) |
| error handling | [Error handling context](../../.claude/context/error-handling.md) |

## Ownership

| Area | Server가 소유하는 것 | 다른 owner로 보낼 것 |
| --- | --- | --- |
| `src/routes/*` | route boundary, request parse, response shape, ownership filter | shared request/response schema는 `packages/schema` |
| `src/middleware/auth.ts` | auth transport와 `req.user` boundary | auth policy drift는 rule/decision |
| `src/middleware/errorHandler.ts` | HTTP error conversion | client error UI는 `apps/client` |
| `src/db/schema.ts` | PostgreSQL/Drizzle table shape | cross-workspace contract는 schema package |
| `src/routes/sync.ts` | authenticated sync pull/push boundary | client queue mechanics는 `apps/client` |
| `src/services/*` | server-side OAuth/JWT/external service integration | client policy UI는 client guide |

## High-Risk Checks

- route는 request boundary에서 Zod schema로 parse한다.
- user-owned row를 읽거나 쓰기 전에 인증과 ownership filter를 확인한다.
- sync endpoint는 인증된 사용자 밖의 row를 반환하거나 수정하지 않는다.
- sync-owned create route는 client ID를 대체하지 말고 수용한다.
- `deletedAt`, `updatedAt`, version, timestamp 의미가 client/schema와 어긋나지 않는지 본다.
- server response wrapper는 `packages/schema/src/responses/*`와 맞춘다.
- 현재 코드에 없는 운영/로깅/배포 인프라를 이 파일의 예시만 보고 새 기본값처럼 만들지 않는다.

## Current Path Map

```text
apps/server/src/
├── app.ts
├── index.ts
├── config/
├── db/
├── middleware/
├── routes/
└── services/
```

## Commands

```bash
pnpm server dev
pnpm server typecheck
pnpm server build
pnpm server db:generate
pnpm server db:push
pnpm server db:studio
pnpm harness:check
```

## Update Rule

이 파일에는 server 작업자가 시작 전에 알아야 할 경계만 남긴다. 상세 route 예시, 배포 후보, 긴 운영 블루프린트는 코드 확인 뒤 `context/`나 `_archive/`로 분리한다.
