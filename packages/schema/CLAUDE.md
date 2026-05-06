# Noline Schema Package Guide

> `@repo/schema` contract harness entrypoint.

## Package Purpose

`@repo/schema`는 client/server가 공유하는 Zod contract의 원천이다. 이 패키지는 schema를 export하고, TypeScript type은 각 사용처에서 `z.infer`로 추론한다.

## Harness Role

이 파일은 `packages/schema`를 수정할 때 AI 작업자가 먼저 읽는 path-scoped 실행 가이드다. 목적은 contract blast radius를 빠르게 잡는 것이고, Zod 전체 사용법을 가르치는 것이 아니다.

- `packages/schema/CLAUDE.md`가 schema package guide의 원천이다.
- `packages/schema/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업 실행 순서는 루트 [noline-work skill](../../.claude/skills/noline-work/SKILL.md)을 따른다.
- schema 변경은 client/server 양쪽에 영향을 주므로 rule, guard, runbook을 함께 확인한다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| schema contract 공통 | [Schema First rule](../../.claude/rules/schema-first.md), [TypeScript/Zod context](../../.claude/context/typescript.md) |
| 새 Entity 추가 | [Add Entity runbook](../../.claude/runbooks/README.md#add-entity) |
| create request ID 전략 | [Client-Side ID rule](../../.claude/rules/client-side-id.md) |
| datetime field | [ISO Time rule](../../.claude/rules/iso-time.md), [Time context](../../.claude/context/time.md) |
| API/data usage | [API/Data context](../../.claude/context/api-data.md) |
| server/client 영향 확인 | [Guard Map](../../.claude/guards/README.md) |

## Ownership

| Area | Schema package가 소유하는 것 | 다른 owner로 보낼 것 |
| --- | --- | --- |
| `src/entities/*` | DB/API 계약의 entity shape | local/remote routing은 client repository |
| `src/requests/*` | API request payload validation | form-only local state는 client feature |
| `src/responses/*` | API response wrapper and data shape | HTTP status/error handling은 server |
| `src/sync/*` | sync payload/status contract | client queue mechanics와 server transaction flow |
| `src/index.ts` | public export surface | workspace-specific import style |

## Contract Rules

- schema가 원천이다. 같은 shape의 DTO type을 손으로 복제하지 않는다.
- entity create request는 sync-owned/client-created ID flow를 깨지 않도록 `id` 수용 여부를 확인한다.
- 날짜/시간 필드는 가능한 곳에서 timezone이 있는 ISO datetime contract를 유지한다.
- response schema는 실제 server response wrapper와 맞아야 한다.
- schema 변경 뒤 client model, server route, sync payload, test/build 영향 범위를 확인한다.

## Current Path Map

```text
packages/schema/src/
├── entities/
├── requests/
├── responses/
├── sync/
└── index.ts
```

## Commands

```bash
pnpm schema build
pnpm harness:check
```

schema 변경이 API route나 client data hook까지 닿으면 `pnpm server typecheck`, `pnpm server build`, `pnpm client lint`도 고려한다.

## Update Rule

이 파일에는 schema 작업자가 시작 전에 알아야 할 계약 경계만 남긴다. 긴 Zod 예제와 교육용 anti-pattern은 [TypeScript/Zod context](../../.claude/context/typescript.md) 또는 `rules/`로 보낸다.
