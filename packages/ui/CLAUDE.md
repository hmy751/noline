# Noline UI Package Guide

> `@repo/ui` pure primitive harness entrypoint.

## Overview

`@repo/ui`는 비즈니스 로직 없는 React Native UI primitive 패키지다. 앱 조합 컴포넌트와 screen workflow는 `apps/client`가 소유한다.

## Harness Role

이 파일은 `packages/ui`를 수정할 때 AI 작업자가 먼저 읽는 path-scoped 실행 가이드다. 목적은 pure primitive 경계와 앱 composition 경계를 빠르게 잡는 것이고, 디자인 시스템 문서를 길게 보존하는 것이 아니다.

- `packages/ui/CLAUDE.md`가 UI package guide의 원천이다.
- `packages/ui/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업 실행 순서는 루트 [noline-work skill](../../.claude/skills/noline-work/SKILL.md)을 따른다.
- policy UI, form composition, domain UI는 이 파일에 누적하지 않고 client/context owner로 보낸다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| primitive 추가/수정 | [Component runbook](../../.claude/runbooks/README.md#component-guide), [Component context](../../.claude/context/components.md) |
| policy 제한 UI | [Policy UI rule](../../.claude/rules/policy-ui.md), [Policy context](../../.claude/context/policy-architecture.md) |
| app composition | [Client guide](../../apps/client/CLAUDE.md), [Form context](../../.claude/context/form.md) |
| TypeScript props style | [TypeScript/Zod context](../../.claude/context/typescript.md) |

## Ownership

| Area | UI package가 소유하는 것 | 다른 owner로 보낼 것 |
| --- | --- | --- |
| `src/components/*` | domain-free primitive and shell components | Trip/Schedule/Expense UI |
| `src/lib/utils.ts` | className/style utility | app business helper |
| `src/index.tsx` | public primitive export surface | screen-level composition |
| `styles/*` export | shared style assets | feature-specific layout |

## Component Boundary

- 컴포넌트는 자신이 놓일 화면 위치를 가정하지 않는다.
- 외부 margin, screen position, navigation side effect는 부모가 소유한다.
- 내부 padding, visual variants, basic interaction state는 primitive가 소유할 수 있다.
- `Trip`, `Expense`, `Schedule`, auth, API, DB, policy decision이 들어오면 `apps/client` 쪽 composition으로 보낸다.
- 새 blocked-state component를 만들기 전에 existing policy UI 패턴을 먼저 확인한다.

## Current Path Map

```text
packages/ui/src/
├── components/
├── lib/
└── index.tsx
```

## Commands

```bash
pnpm --filter @repo/ui lint
pnpm harness:check
```

## Update Rule

이 파일에는 UI primitive 작업자가 시작 전에 알아야 할 경계만 남긴다. 컴포넌트 철학의 긴 설명, 레거시 web 예시, 앱 조합 사례는 [Component context](../../.claude/context/components.md) 또는 `_archive/`로 보낸다.
