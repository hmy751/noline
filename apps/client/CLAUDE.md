# Noline Client App Guide

> React Native·Expo 클라이언트의 코드 경로 안내.

## 이 가이드의 책임

이 파일은 `apps/client`를 수정할 때 클라이언트의 구현 책임·위험 경계·명령과 필요한 Project 본문을 안내한다. 개발 수행과 저장소 공통 규칙은 [루트 가이드](../../CLAUDE.md)에서 연결한다.

- `apps/client/CLAUDE.md`가 클라이언트 app guide의 원천이다.
- `apps/client/AGENTS.md`는 이 파일을 가리키는 Codex bridge symlink다. 별도 정책 원천처럼 수정하지 않는다.
- 작업에 필요한 본문은 아래 Start Here에서 직접 선택한다. 본문별 적용 조건에 따라 필요한 내용만 추가로 읽는다.
- 아래 위험 경계는 클라이언트 변경에서 놓치기 쉬운 제품 기준의 요약이다. 상세 계약·조건·예외·검증 방법은 연결한 Project 주제 본문에서 관리한다.

## Start Here

| 작업 | 먼저 볼 문서 |
| --- | --- |
| client 기능/버그 공통 | [제품 기준·적용 가이드](../../context/project/guidance/README.md) |
| 앱 준비, 재로그인, 로그아웃·탈퇴, 세션 변경과 저장 조율 | [앱 실행·세션·데이터 보존](../../context/project/current/app-runtime/INDEX.md) |
| Data Entity, repository, React Query | [API·repository·query 계약](../../context/project/guidance/api-contracts.md), [Activation Router 기준](../../context/project/guidance/travel-access/INDEX.md) |
| local write, sync queue, soft delete | [저장·동기화·정리 기준](../../context/project/guidance/data-lifecycle/INDEX.md) |
| 작성 초안, 장소 선택, 날짜·시간 picker와 manual input | [작성·입력 Context](../../context/project/guidance/writing-and-input/INDEX.md) |
| 네트워크 감지, 조회·캐시 표시, 홈 요약과 복구 | [네트워크·조회·화면 복구](../../context/project/guidance/travel-access/INDEX.md), [오류 전달·공개 응답](../../context/project/guidance/error-handling.md) |
| policy 제한 UI | [여행 접근·Policy 기준](../../context/project/guidance/travel-access/INDEX.md) |
| offline map/routing | [지도 준비·공유·경로 표시](../../context/project/guidance/offline-maps-and-routes/INDEX.md) |
| 구조·계층·재사용 | [계층과 현재 예외](../../context/project/guidance/development-boundaries/layers.md) |
| UI composition | [Component context](../../context/project/guidance/development-boundaries/ui.md), [UI package guide](../../packages/ui/CLAUDE.md) |

## Ownership

| 코드 영역 | 이 경로의 구현 책임 | 관련 계약·다른 코드 영역 |
| --- | --- | --- |
| `application/*` | 앱 전체 준비 순서·실패·재시도와 실행 수명 조합 | 여행 선택 규칙은 entity, DB·인증·cleanup 실행은 각 shared 모듈 |
| `entities/*/model` | schema에서 `z.infer`로 client model 연결 | 공유 shape의 정의는 `packages/schema` |
| `entities/*/api` | remote 호출과 response validation | 서버 route 정책은 `apps/server` |
| `entities/*/lib` | SQLite datasource와 Local mutation 구현 | 원자성·queue 동시 확정의 계약과 검증 조건은 [데이터 수명](../../context/project/guidance/data-lifecycle/INDEX.md) |
| `entities/*/repository` | Activation Router를 통한 Local/Remote 실행 연결 | 분기 조건과 목록·생성 예외는 [여행 접근](../../context/project/guidance/travel-access/INDEX.md) |
| `entities/*/data` | React Query keys/hooks | query 계약은 [API 기준](../../context/project/guidance/api-contracts.md) |
| `features/*` | 사용자 workflow와 form submit 조합 | 초안·제출·실패 처리는 Project 작성·입력 가이드 |
| `shared/components` | 앱 공용 composition | 순수 primitive는 `packages/ui` |
| `shared/services/*` | client-side policy/service integration | Data/Service 경계는 [여행 접근](../../context/project/guidance/travel-access/INDEX.md) |

## High-Risk Checks

- sync-owned Data Entity는 `model -> api/lib -> repository -> data` 경계를 유지한다.
- UI나 feature screen에서 SQLite/API를 직접 골라 Local/Remote routing을 우회하지 않는다.
- sync-owned Entity의 Local mutation과 해당 `sync_queue` 추가는 같은 `withTransaction` 안에서 원자적으로 확정한다.
- create flow는 `generateId()`와 client-created ID 전략을 따른다.
- 대상 여행의 활성 여부로 분기하는 조회·변경, 계정 전체 여행 목록, 새 여행 생성은 Router의 서로 다른 경로다. 목록·생성을 현재 선택한 여행의 활성 상태로 분기하지 않는다.
- 날짜/시간은 [날짜와 시각의 데이터 의미](../../context/project/common/date-and-time.md)에서 필드 의미와 현재 경계 차이를 확인하고, 한 시점을 나타내는 값은 저장/전송 boundary에서 ISO 8601 datetime with timezone을 유지한다.
- offline/active/inactive 제한은 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 같은 기존 policy primitive를 먼저 확인한다.
- Map/Search/Directions 같은 Service Layer는 sync-owned Data Entity처럼 취급하지 않는다.

## Current Path Map

```text
apps/client/src/
├── application/       # 앱 전체 준비와 실행 수명 조합 (Expo 라우트는 app/)
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
pnpm client test --runInBand
pnpm client test:typecheck
pnpm harness:check
```

`test`는 `tests/`의 Jest 검사를, `test:typecheck`는 client tsconfig 범위의 타입 검사를 실행한다. 관련 검사만 고를 때는 Jest의 파일 경로·필터를 사용한다. 범위가 schema/server까지 번지면 `pnpm schema build`, `pnpm server typecheck`, `pnpm server build`도 함께 고려한다. 명령 안내는 현재 검사 통과를 뜻하지 않는다.

## Update Rule

이 파일에는 client 작업자가 시작 전에 알아야 할 경계만 남긴다. 지속할 제품 설명은 `context/project/`의 해당 Owner에, 이번 구현·조사·검증은 Work 기록에 남긴다. 정확한 과거 원문은 재검토·복구 목적의 보존물로 구별한다.
