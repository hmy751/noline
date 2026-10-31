# Noline Project Guide

> Noline: 네트워크가 없어도 여행은 계속된다. Selective Local-First 여행 관리 앱.

이 파일은 루트 탐색 허브다. 제품 계약·위험 점검·개발 기준은 [Project context](./context/project/README.md)의 주제별 본문이, 경로별 진입과 명령은 workspace guide가 소유한다.

## Claude/Codex Bridge

- `CLAUDE.md`가 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 `CLAUDE.md`를 가리키는 Codex bridge다.
- 같은 bridge가 적용되는 workspace:
  - [apps/client/CLAUDE.md](./apps/client/CLAUDE.md)
  - [apps/server/CLAUDE.md](./apps/server/CLAUDE.md)
  - [packages/schema/CLAUDE.md](./packages/schema/CLAUDE.md)
  - [packages/ui/CLAUDE.md](./packages/ui/CLAUDE.md)
- 도구별 연결은 같은 공통 본문을 가리키거나 host 차이만 적응한다. 연결을 바꿀 때 원본·adapter·의도적인 차이를 구별하고 양쪽 소비 경로를 확인한다.
- 작업의 지속 상태와 선택된 Project context는 root [Context Harness](./context/README.md)를 따른다. 제품 의미·현재 구조·개발 기준과 필요한 선택 이유는 [`context/project/`](./context/project/README.md)의 대응 문서가 소유한다. 옛 제품 원본은 일반 읽기에서 제외했다.
- 실행층은 [운영 skill 색인](./.agents/skills/README.md)에서 찾는다. `.claude/settings.json`과 `.codex/hooks.json`은 각각의 host lifecycle을 explicit-unbound Maintain adapter에 연결한다. 제품 기준 본문은 Project의 주제별 Owner가 소유하며, 실행층은 필요한 본문을 직접 선택한다.

## Start Here

| 필요 | 읽을 문서 |
| --- | --- |
| 스킬 원본·host 발견 경로 | [공통 스킬 연결](./.agents/skills/README.md#도구-연결과-이식) |
| Maintain·host lifecycle 연결 | [session binding 계약](./context/work/harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md) |
| 현재 작업 복구·새 Context Workspace | [Context Harness](./context/README.md) |
| 코드 수정에 적용할 제품 기준 | [제품 개발 기준](context/project/guidance/README.md) |
| 깊은 아키텍처/기능 맥락 | [Noline Project context](./context/project/README.md) |
| 제품 지식·개발 기준의 책임 선택 | [주제별 Owner 통합 이유](./context/project/decisions/0002-topic-ownership.md) |

## Project Identity

Noline은 불안정한 네트워크 환경에서도 여행 계획과 경비 기록을 이어갈 수 있게 하는 모바일 앱이다.

현재 용어:

| 개념 | 현재 이름 | 과거/역사 문서의 이름 |
| --- | --- | --- |
| 아키텍처 | Selective Local-First | Local-First, Offline-First, Local-First Server-Aware |
| 라우터 | Activation Router | Offline-Prep Router, Hybrid Router |
| ID 전략 | Client-Side ID Generation | Echo Protocol |
| UX 비유 | 오프라인 보험 | 오프라인 구독 |

용어 변경의 이유는 [현재 용어의 선택 이유](./context/project/decisions/0001-selective-local-first.md#현재-이름이-뜻하는-것)에 기록되어 있다. 역사 문서의 오래된 용어는 그대로 둘 수 있지만, 현재 정책 설명에서는 위 용어를 사용한다.

## Core Invariants

1. 활성화된 여행은 Local SQLite가 진실의 원천이다. 비활성 여행은 Server API가 진실의 원천이다.
2. Trip/Schedule/Expense 같은 Data Layer는 Activation Router를 통해 Local/Remote를 분기한다.
3. Map/Search/Directions 같은 Service Layer는 소유권과 sync 대상이 아니므로 Policy 기반 Network-First로 다룬다.
4. 로컬 mutation과 `sync_queue` 추가는 `withTransaction` 안에서 원자적으로 처리한다.
5. Entity 생성 ID는 클라이언트가 `generateId()`로 만들고, 서버는 클라이언트 ID를 수용한다.
6. `@repo/schema`가 클라이언트/서버 타입 계약의 원천이다. 타입은 schema에서 `z.infer`로 추론한다.
7. 시점은 timezone을 포함한 ISO datetime, 달력 날짜는 date-only 계약을 따른다. 필드별 의미와 현재 차이는 [날짜와 시각](./context/project/common/date-and-time.md)에서 확인하고 표시는 shared util에서 처리한다.
8. delete flow는 soft delete와 cleanup 안전 조건을 따른다.
9. 서버 route는 인증과 user ownership을 확인한다.
10. 정책 제한 UI는 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 패턴을 먼저 사용한다.

적용 조건·실패 위험·변경 시 확인할 내용은 [제품 개발 기준](context/project/guidance/README.md)에서 해당 주제 본문을 선택한다.

## 주제별 개발 기준

| 주제 | 기준 본문 |
| --- | --- |
| Local/Remote routing | [Activation Router](context/project/guidance/travel-access/INDEX.md) |
| Local mutation + sync | [Transaction + Sync Queue](context/project/guidance/data-lifecycle/INDEX.md) |
| Schema/type contract | [Schema First](context/project/guidance/development-boundaries/schema-and-types.md) |
| Create ID strategy | [Client-Side ID](context/project/guidance/data-lifecycle/INDEX.md#생성-id는-localqueue서버에서-같은-값을-유지한다) |
| 날짜/시간 | [ISO Time](context/project/common/date-and-time.md) |
| 서버 인증/소유권 | [Auth/User Scope](context/project/guidance/api-contracts.md) |
| 정책 제한 UI | [Policy UI](context/project/guidance/travel-access/INDEX.md) |
| 깊은 맥락 | [Project context](./context/project/README.md) |

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
│   ├── eslint-config/   # Shared lint config
│   └── typescript-config/ # Shared TypeScript config
├── .claude/
│   ├── skills -> ../.agents/skills/ # Claude skill 연결
│   └── _archive/        # Deprecated historical material
├── .agents/skills/      # 공통 스킬 원본과 Codex 발견 경로
├── .codex/              # Codex 설정과 lifecycle hook
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
pnpm harness:check
```

## Documentation Rules

- 루트는 탐색과 핵심 불변식만 소유한다.
- 상세 정책은 가장 작은 owner 문서에 둔다.
- 제품 계약·개발 기준·실패 위험과 적용·검증 방법은 `context/project/`의 같은 주제 본문에서 관리한다.
- 깊은 아키텍처·기능·선택 이유는 `context/project/`의 대응 본문과 형성 자료가 소유한다. 옛 `.claude/context/`·제품 결정·그 archive를 현재 읽기의 필수 경로로 되살리지 않는다.
- root `context/`는 Project context와 Workspace 운영 상태의 별도 층이다. 기본적으로 기존 제품 설명을 복제하지 않으며, 승인된 주제별 Owner 이동은 [Project 관리 계약](./context/project/MAINTENANCE.md)에 따라 유효한 의미와 authority를 함께 전환한다.
- 역사 자료를 정리할 때 해당 Owner의 관리 계약과 실제 소비 경로를 확인한다. 당시 기록·원문과 현재 기준을 구별한다.
- active guide와 코드가 충돌하면 코드를 확인하고 active guide만 최소 수정한다.
- 제품 선택의 이유는 Project의 대응 본문·형성 자료나 `context/project/decisions/`에, 실행 방식의 형성 이유는 해당 스킬·관리 본문 가까이에, 이번 작업의 선택·검증은 Work 기록에 남긴다.
- skill은 호출 조건·판단·수행 방법을 소유하고, 제품 정책과 지속 context의 관리 계약은 owning docs에 남긴다. agent는 report-only 실행자로 유지한다.

하위 app/package 가이드는 해당 경로의 구현 책임·위험 경계·명령과 필요한 Project 본문 선택을 안내한다. 제품 상세는 Project, 이번 작업의 조사·검증은 Work에 두며 가이드에 중복 축적하지 않는다.

지침·문서 Owner·bridge·스킬 연결을 바꾼 뒤에는 `pnpm harness:check`를 실행한다. 이는 경로·연결·형식 검사이며 의미 충분성이나 실제 host 호출 성공은 별도로 확인한다.

## 커밋 메시지

새 커밋은 변경의 책임과 의도를 추적하도록 가능한 한 `type(scope): summary` 형태를 사용한다. runtime 변경은 `client`·`server`·`schema`·`ui`, 문서 변경은 `context`·`harness`·`readme`·`archive`처럼 가장 작은 유효 scope를 고른다. 여러 workspace에 걸친 기능은 `auth` 같은 domain scope를 사용할 수 있고, repo 전체 변경이거나 유용한 scope가 없으면 생략할 수 있다. 기존 이력은 이 기준에 맞춰 다시 쓰지 않는다.

## Context Harness 운영 진입

- 개발 구현·수정·검토·재개는 [development](.agents/skills/development/SKILL.md)를 적용하며 이번 요청의 범위와 Noline의 기존 제품·경로별 기준을 따른다.
- 사용자가 대화를 돌아보고 체계 개선을 찾자고 요청하면 [improvement-loop](.agents/skills/improvement-loop/SKILL.md)를 사용한다. 작업 종료만으로 자동 실행하지 않는다.

- `context/work/`의 Workspace·Harness를 다룰 때 [Work 지침](context/work/AGENTS.md)을 먼저 읽는다.
- 필요한 맥락의 선택·대조·재사용은 [USAGE](context/USAGE.md)를 따른다. 개인 판단 관점은 [Personal](context/personal/README.md), 제품 계약·현재 구조는 [Project](context/project/README.md)에서 질문별로 고른다. 제품별 선택·적용은 [읽기 기준](context/project/REFERENCE/reading.md)을 따르며 이미 확보한 맥락으로 충분하면 반복 읽지 않는다.
- Project 의미·현재 구현·조건부 기준의 구조와 권위 관계는 [Project README](context/project/README.md)를 따른다. 작성·복원·갱신·승인된 주제별 Owner 이동은 [Project 관리 계약](context/project/MAINTENANCE.md)을 직접 읽고, 여러 Work에 계속 유효할 변화·누락 복원·승인된 Owner 이동은 [context-update의 Project 범위](.agents/skills/context-update/SKILL.md)로 연결한다. Workspace Maintain과의 책임 경계는 Project README에서 찾는다.
- 작업 생성·논의·재판단·설명은 [skill 색인](.agents/skills/README.md)의 각 호출 조건을 따른다. 새 독립·후속 Workspace 생성에는 create-context-workspace를 사용하고 기존 Workspace 수정에는 다시 호출하지 않는다.
- Personal·Project의 허용된 갱신은 [context-update](.agents/skills/context-update/SKILL.md), 코드·결과·앞선 말의 의미와 선택 이유 설명은 [explain](.agents/skills/explain/SKILL.md)의 호출 조건을 따른다.
- Personal·Project 본문이나 구성을 바꿀 때 [CONTENT-POLICY](context/CONTENT-POLICY.md), 본문을 작성·수정할 때 [WRITING-FORMAT](context/WRITING-FORMAT.md)의 적용 범위를 확인한다. 체계 지침의 범위·진입·분할은 [SYSTEM-GUIDANCE](context/SYSTEM-GUIDANCE.md), 스킬의 의미·구성 변경은 [스킬 관리 정책](.agents/skills/SKILLS-CONTENT-POLICY.md)을 따른다. Work의 기존 관리 계약에 자동 확장하지 않는다.
- Spec·Ticket·state와 Main·Maintain의 역할은 [운영 기준](context/work/workspaces/spec-and-tickets/README.md)이 소유한다. 스킬 호출을 session activation이나 실제 문서 반영으로 간주하지 않는다.
- Maintain 연결·전환·해제는 [session binding 계약](context/work/harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따른다. Main은 사용자가 명시한 현재 session에만 control을 실행하며 subagent에게 위임하지 않는다. active index나 대화 주제로 binding을 추론하지 않는다.
