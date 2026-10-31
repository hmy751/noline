# Noline UI Package Guide

> `@repo/ui` 공유 UI primitive의 코드 경로 안내.

## Overview

`@repo/ui`는 비즈니스 로직 없는 React Native UI primitive 패키지다. 앱 조합 컴포넌트와 screen workflow는 `apps/client`가 소유한다.

## 이 가이드의 책임

이 파일은 `packages/ui`를 수정할 때 primitive와 앱 조합의 책임 경계·명령과 필요한 Project 본문을 안내한다. 개발 수행과 저장소 공통 규칙은 [루트 가이드](../../CLAUDE.md)에서 연결한다.

- `packages/ui/CLAUDE.md`가 UI package guide의 원천이다.
- `packages/ui/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업에 필요한 본문은 아래 Start Here에서 직접 선택한다. 본문별 적용 조건에 따라 필요한 내용만 추가로 읽는다.
- policy UI·form composition·domain UI의 구현은 client가 맡고, 제품 계약과 UI 조합 기준은 Project의 해당 주제 본문이 소유한다. 아래 Component Boundary는 primitive 변경에서 놓치기 쉬운 경계의 요약이며 상세 조건·예외·검증 방법은 연결한 Project 본문에서 관리한다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| primitive 추가/수정 | [UI의 표현·상태·작업 책임](../../context/project/guidance/development-boundaries/ui.md) |
| policy 제한 UI | [여행 접근·Policy 기준](../../context/project/guidance/travel-access/INDEX.md) |
| app composition | [Client guide](../../apps/client/CLAUDE.md), [Form context](../../context/project/guidance/writing-and-input/INDEX.md) |
| TypeScript props style | [TypeScript/Zod context](../../context/project/guidance/development-boundaries/schema-and-types.md) |

## Ownership

| 코드 영역 | 이 경로의 구현 책임 | 관련 계약·다른 코드 영역 |
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

공개 컴포넌트의 props·export를 바꾸면 실제 client 소비자를 확인하고 [client 가이드](../../apps/client/CLAUDE.md)의 타입·관련 렌더링 검사를 선택한다.

## Update Rule

이 파일에는 UI primitive 작업자가 시작 전에 알아야 할 경계만 남긴다. 컴포넌트 철학의 긴 설명, 레거시 web 예시, 앱 조합 사례는 [Component context](../../context/project/guidance/development-boundaries/ui.md) 에서 설명한다. 과거 web 예시는 현재 기준으로 사용하지 않는다.
