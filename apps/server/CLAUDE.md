# Noline Server App Guide

> Express·TypeScript 서버의 코드 경로 안내.

## 이 가이드의 책임

이 파일은 `apps/server`를 수정할 때 서버의 구현 책임·위험 경계·명령과 필요한 Project 본문을 안내한다. 개발 수행과 저장소 공통 규칙은 [루트 가이드](../../CLAUDE.md)에서 연결한다.

- `apps/server/CLAUDE.md`가 서버 app guide의 원천이다.
- `apps/server/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업에 필요한 본문은 아래 Start Here에서 직접 선택한다. 본문별 적용 조건에 따라 필요한 내용만 추가로 읽는다.
- 아래 위험 경계는 서버 변경에서 놓치기 쉬운 제품 기준의 요약이다. 상세 계약·조건·예외·검증 방법은 연결한 Project 주제 본문에서 관리한다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| API endpoint 추가/수정 | [API 계약과 변경 가이드](../../context/project/guidance/api-contracts.md), [Schema First 기준](../../context/project/guidance/development-boundaries/schema-and-types.md) |
| auth/user ownership | [Auth/User Scope 기준](../../context/project/guidance/api-contracts.md), [제품 기준·위험 점검](../../context/project/guidance/README.md) |
| client-created ID create flow | [Client-Side ID 기준](../../context/project/guidance/data-lifecycle/INDEX.md#생성-id는-localqueue서버에서-같은-값을-유지한다) |
| sync endpoint | [Transaction + Sync Queue 기준](../../context/project/guidance/data-lifecycle/INDEX.md) |
| time fields | [날짜·시점 기준](../../context/project/common/date-and-time.md) |
| error handling | [오류 전달·공개 응답](../../context/project/guidance/error-handling.md) |

## Ownership

| 코드 영역 | 이 경로의 구현 책임 | 관련 계약·다른 코드 영역 |
| --- | --- | --- |
| `src/routes/*` | route boundary, request parse, response shape, ownership filter | shared request/response schema는 `packages/schema` |
| `src/middleware/auth.ts` | auth transport와 `req.userId` boundary | 인증·소유권 계약은 [Project API 기준](../../context/project/guidance/api-contracts.md) |
| `src/middleware/errorHandler.ts` | HTTP error conversion | client error UI는 `apps/client` |
| `src/db/schema.ts` | PostgreSQL/Drizzle table shape | cross-workspace contract는 schema package |
| `src/routes/sync.ts` | 인증된 sync pull과 아직 501을 반환하는 push 진입. 현재 client push는 Entity REST route를 사용 | client queue mechanics는 `apps/client` |
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
pnpm server test
pnpm server test:integration
pnpm server db:generate
pnpm server db:push
pnpm server db:studio
pnpm harness:check
```

`test`는 PostgreSQL integration을 제외한 Vitest 검사를 실행한다. `test:integration`은 Docker와 Compose가 필요하며 별도 테스트 DB를 띄워 현재 schema를 적용하고 검사 뒤 테스트 DB·volume을 정리한다. 서버 실행·환경과 DB 도구의 사용 조건은 [서버 안내](README.md)를 따른다. 명령 안내는 현재 검사 통과를 뜻하지 않는다.

## Update Rule

이 파일에는 서버 작업의 경로·책임·위험과 명령을 남긴다. 지속할 제품 계약·현재 지원과 선택 이유는 Project의 해당 Owner에, 환경 준비는 서버 안내에, 이번 구현·조사·검증과 미채택 배포 후보는 Work에 둔다. 역사 원문은 재검토·복구 목적의 보존물로 구별한다.
