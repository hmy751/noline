# Noline Schema Package Guide

> `@repo/schema` 공유 계약의 코드 경로 안내.

## Package Purpose

`@repo/schema`는 client/server가 공유하는 Zod contract의 원천이다. 공유 shape는 schema에서 정의하고 TypeScript type은 `z.infer`로 추론한다. 각 사용처의 추론이 기본이며 `AuthProvider`처럼 schema에서 추론해 export하는 현재 타입도 있다. 타입 추론은 런타임 검증을 실행하지 않는다.

## 이 가이드의 책임

이 파일은 `packages/schema`를 수정할 때 공유 계약의 변경 영향·소비 경계·명령과 필요한 Project 본문을 안내한다. 개발 수행과 저장소 공통 규칙은 [루트 가이드](../../CLAUDE.md)에서 연결한다.

- `packages/schema/CLAUDE.md`가 schema package guide의 원천이다.
- `packages/schema/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업에 필요한 본문은 아래 Start Here에서 직접 선택한다. 본문별 적용 조건에 따라 필요한 내용만 추가로 읽는다.
- schema 변경은 client/server 양쪽에 영향을 준다. 아래 계약 경계는 공유 계약 변경에서 놓치기 쉬운 기준의 요약이며 상세 조건·예외·검증 방법은 연결한 Project 주제 본문에서 관리한다. 실제 요청·응답·저장 소비자를 변경 범위에 맞춰 대조한다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| schema contract 공통 | [공유 schema·타입 기준](../../context/project/guidance/development-boundaries/schema-and-types.md) |
| 새 Entity 추가 | [schema·공개 export·검증 기준](../../context/project/guidance/development-boundaries/schema-and-types.md), [Entity 저장·조회 경계](../../context/project/guidance/development-boundaries/layers.md#entity를-바꾸면-저장조회-경계를-따라간다). 생성·동기화·삭제가 관련되면 [데이터 수명](../../context/project/guidance/data-lifecycle/INDEX.md)을 함께 선택한다. |
| create request ID 전략 | [Client-Side ID 기준](../../context/project/guidance/data-lifecycle/INDEX.md#생성-id는-localqueue서버에서-같은-값을-유지한다) |
| datetime field | [날짜·시점 기준](../../context/project/common/date-and-time.md) |
| API/data usage | [API 계약과 변경](../../context/project/guidance/api-contracts.md) |
| server/client 영향 확인 | [제품 기준·위험 점검](../../context/project/guidance/README.md) |

## Ownership

| 코드 영역 | 이 경로의 구현 책임 | 관련 계약·다른 코드 영역 |
| --- | --- | --- |
| `src/entities/*` | 공유 entity shape (물리 DB 표현과 직렬화는 별도) | local/remote routing은 client repository |
| `src/primitives/datetime.ts` | 공유 datetime 검증 표현 | 필드별 날짜·시점 의미는 Project, 표시는 client util |
| `src/requests/*` | API request payload validation | form-only local state는 client feature |
| `src/responses/*` | API response wrapper and data shape. 공통 envelope 정의는 `_envelope.ts` | HTTP status/error handling은 server |
| `src/sync/*` | sync payload/status contract | client queue mechanics와 server transaction flow |
| `src/index.ts`·`package.json`·`tsup.config.ts` | 공개 export와 소비할 빌드 진입 | app별 호출·저장 처리는 client/server |

## Contract Rules

- schema가 원천이다. 같은 shape의 DTO type을 손으로 복제하지 않는다.
- entity create request는 sync-owned/client-created ID flow를 깨지 않도록 `id` 수용 여부를 확인한다.
- 날짜/시간은 [필드별 의미](../../context/project/common/date-and-time.md)를 확인한다. 한 시점은 timezone이 있는 ISO datetime, Expense date는 date-only 계약과 기존 호환을 따른다.
- response schema는 실제 server response wrapper와 맞아야 한다.
- schema 변경 뒤 client model, server route, sync payload, test/build 영향 범위를 확인한다.

## Current Path Map

```text
packages/schema/src/
├── entities/
├── primitives/       # datetime 검증
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

schema 변경이 API route나 client data hook까지 닿으면 `pnpm server typecheck`, `pnpm server build`, `pnpm client test:typecheck`와 관련 client/server 테스트도 고려한다. `build`는 schema 빌드·선언 생성을 확인하며 실제 payload의 런타임 검증을 대신하지 않는다.

## Update Rule

이 파일에는 schema 작업자가 시작 전에 알아야 할 계약 경계만 남긴다. 공유 타입·검증과 표현 차이의 상세는 [TypeScript/Zod context](../../context/project/guidance/development-boundaries/schema-and-types.md)에서 관리한다.
