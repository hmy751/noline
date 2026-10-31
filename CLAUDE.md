# Noline Project Guide

> Noline: 네트워크가 없어도 여행은 계속된다. Selective Local-First 여행 관리 앱.

이 파일은 Noline의 제품 경계, 코드 영역과 작업·Context 진입점을 안내하고 저장소 공통 규칙을 정한다. 제품 계약·위험·적용과 검증 방법은 [Project context](context/project/README.md)의 주제별 본문이, 코드 경로의 책임·명령은 아래 app/package 가이드가 소유한다.

## 요청에 맞는 작업과 Context 진입

개발 구현·수정·검토·재개는 [development](.agents/skills/development/SKILL.md)를 적용한다. 이 스킬이 요청 해석부터 구현·독립 검토·검증·완료·기록 연결까지 Main의 수행을 조율하며, 아래 제품·경로별 기준을 선택한다. 설명만 요청받으면 explain, 지정된 Personal·Project 갱신만 요청받으면 context-update의 호출 조건과 범위를 따른다.

| 요청 | 진입점 |
| --- | --- |
| 코드·결과·앞선 말의 의미와 선택 이유 설명 | [explain](.agents/skills/explain/SKILL.md) |
| 허용된 Personal·Project 반영·누락 복원 | [context-update](.agents/skills/context-update/SKILL.md) |
| 새 독립·후속 Context Workspace 생성 | [create-context-workspace](.agents/skills/create-context-workspace/SKILL.md). 기존 Workspace 재개·수정은 [Work 지침](context/work/AGENTS.md)에서 시작한다. |
| 대화를 돌아보고 체계 개선 | [improvement-loop](.agents/skills/improvement-loop/SKILL.md). 작업 종료만으로 자동 실행하지 않는다. |
| 앱 실행 등 다른 작업과 스킬 발견 | [운영 스킬 색인](.agents/skills/README.md)의 호출 조건 |

[Context](context/README.md)는 개인의 판단 관점인 Personal, 제품 의미·현재 구조·개발 기준인 Project, 이번 목표·진행·결과인 Work로 나뉜다. 필요한 본문을 고르고 실제 대상과 대조·재사용하는 방법은 [USAGE](context/USAGE.md)가 소유한다. 이 역할 구분과 수행 스킬의 연결은 session 연결이나 실제 문서 반영을 뜻하지 않는다.

| 다루는 대상 | 읽을 기준 |
| --- | --- |
| 제품 주제의 의미·권위와 내용 선택 | [Project README](context/project/README.md), [읽기와 적용](context/project/REFERENCE/reading.md) |
| Personal·Project 작성·복원·갱신 | [Context의 본문 관리 진입](context/README.md#본문을-관리할-때)에서 공통 정책과 해당 영역의 관리 계약을 선택한다. Project 반영은 [Project 관리 계약](context/project/MAINTENANCE.md)을 직접 읽는다. |
| Workspace의 Spec·Ticket·state·기록 또는 Harness | [Work 지침](context/work/AGENTS.md). Main·Maintain의 갱신 책임은 기존 Work 계약을 따른다. |
| Maintain의 session 연결·전환·해제와 host lifecycle | [session binding 계약](context/work/harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md) |
| 스킬의 의미·구성 변경 | [스킬 관리 정책](.agents/skills/SKILLS-CONTENT-POLICY.md) |

## 제품의 정체성과 개발 기준

Noline은 불안정한 네트워크 환경에서도 여행 계획과 경비 기록을 이어갈 수 있게 하는 모바일 앱이다. 선택한 여행 데이터를 기기에 준비하는 Selective Local-First를 사용하며, 데이터 실행 위치는 Activation Router, 생성 식별자는 Client-Side ID Generation으로 설명한다. 오프라인 준비의 UX 표현은 오프라인 보험이다. 과거 명칭과 변경 이유는 [현재 용어의 선택 이유](context/project/decisions/0001-selective-local-first.md#현재-이름이-뜻하는-것)에서 찾는다. 역사 원문의 용어와 현재 정책 설명을 구별한다.

아래는 작업에서 놓치기 쉬운 제품 경계의 요약이다. 상세 조건·예외와 현재 미충족은 연결한 주제 본문에서 확인한다.

| 작업 주제 | 핵심 경계와 기준 본문 |
| --- | --- |
| 여행 데이터의 Local/Remote 실행 | 대상 여행의 활성 여부에 따른 조회·변경은 활성 여행의 Local SQLite와 비활성 여행의 Server API로 나눈다. 계정 전체 여행 목록은 온라인·서버 인증 상태에서 서버 목록과 보존할 Local 여행을 조합하며, 연결·인증 제한 시 Local 조회에는 활성 여행이 필요하다. 새 여행 생성은 별도 온라인 경로다. repository의 [Activation Router 계약](context/project/guidance/travel-access/INDEX.md#router와-계정-전체-여행-목록의-계약)을 따른다. |
| Policy·UI와 외부 Service | 기능 가용성·데이터 실행 위치·화면 표시를 구별한다. 제한 UI는 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 등 기존 패턴을 우선하며 Map/Search/Directions를 sync-owned Data Entity로 다루지 않는다. [여행 접근·Policy](context/project/guidance/travel-access/INDEX.md), [지도·경로 준비](context/project/guidance/offline-maps-and-routes/INDEX.md)를 선택한다. |
| Local 변경·동기화·생성 ID | sync-owned Local mutation과 `sync_queue` 추가는 같은 `withTransaction`에서 확정한다. 해당 Entity의 생성 ID는 클라이언트의 `generateId()`로 만들고 서버가 수용한다. [저장·동기화 기준](context/project/guidance/data-lifecycle/INDEX.md)에서 원자성·전송·반영 조건을 확인한다. |
| 삭제·기기 사본 정리 | 사용자 삭제의 soft delete와 비활성화 뒤 기기 사본 정리를 구별하고 미전송 변경을 보호한다. [삭제·cleanup 계약](context/project/guidance/data-lifecycle/INDEX.md#사용자-삭제와-기기-사본-정리를-구별한다)과 현재 구현 공백을 함께 확인한다. |
| 공유 schema·타입 | `@repo/schema`가 client/server 공유 계약의 원천이며 타입은 schema에서 `z.infer`로 추론한다. [Schema·타입 기준](context/project/guidance/development-boundaries/schema-and-types.md)에서 런타임 검증과 저장 표현의 경계를 확인한다. |
| 날짜·시각·금액 | 한 시점은 timezone을 포함한 ISO datetime, 달력 날짜는 date-only 계약을 따른다. [날짜와 시각](context/project/common/date-and-time.md)의 필드별 의미·현재 차이와 [통화와 금액](context/project/common/currency.md)을 확인하고 표시는 기존 shared util을 사용한다. |
| API·인증·소유권 | 서버 route의 인증과 user ownership, request·response·repository·query 경계는 [API 계약](context/project/guidance/api-contracts.md)을 따른다. |

앱 실행·세션·입력·계층 등 다른 제품 주제는 [Project의 주제별 진입](context/project/README.md#읽는-경로)과 [개발 기준](context/project/guidance/README.md)에서 찾는다. 제품 지식과 개발 기준을 같은 주제에 둔 이유는 [Owner 통합 결정](context/project/decisions/0002-topic-ownership.md)에 있다.

## 코드 영역과 경로별 가이드

여기서 app/package는 pnpm workspace의 코드 영역이며, `context/work/`의 작업 단위인 Context Workspace와 구별한다.

| 코드 영역·가이드 | 구현 책임 |
| --- | --- |
| [apps/client](apps/client/CLAUDE.md) | React Native·Expo, NativeWind·React Query, FSD, Local SQLite·Drizzle ORM, Activation Router와 Policy UI |
| [apps/server](apps/server/CLAUDE.md) | Express·TypeScript, 인증·소유권, PostgreSQL·Drizzle ORM, API·sync endpoints |
| [packages/schema](packages/schema/CLAUDE.md) | client/server 공유 Zod entity·request·response·sync 계약 |
| [packages/ui](packages/ui/CLAUDE.md) | React Native 공유 UI primitive. 앱 조합과 domain workflow는 client가 소유 |

```text
noline/
├── apps/                # client·server
├── packages/            # schema·ui·eslint-config·typescript-config
├── context/             # Personal·Project·Work와 각 관리 계약
├── .agents/skills/      # 공통 스킬 원본과 Codex 발견 경로
├── .claude/             # settings.json·hooks/와 skills 연결
├── .codex/              # Codex 설정과 lifecycle hook
├── _archive/            # 과거 원문·복구 근거
└── CLAUDE.md            # 저장소 진입과 공통 규칙
```

로컬 환경 준비는 [개발 시작](START_GUIDE.md), 앱 실행·DB·app/package별 빌드와 테스트는 위 경로별 가이드의 Commands에서 찾는다. 저장소 공통 명령은 다음과 같다.

```bash
pnpm lint
pnpm harness:check
```

`pnpm lint`는 저장소 코드 lint다. 지침·문서 Owner·bridge·스킬 연결을 바꾼 뒤에는 `pnpm harness:check`를 실행한다. 후자는 경로·연결·형식 검사이며 의미 충분성이나 실제 host 호출 성공은 별도로 확인한다.

## 지침과 도구 연결을 관리한다

- 루트 `CLAUDE.md`가 이 프로젝트 가이드의 원천이고 `AGENTS.md`는 이를 가리키는 Codex bridge다. 위 네 app/package도 같은 연결을 사용하며 bridge에 별도 본문을 만들지 않는다.
- 도구별 연결은 같은 공통 본문을 가리키거나 host 차이만 적응한다. 연결 변경 시 원본·adapter·의도적인 차이와 양쪽 소비 경로를 확인한다. 스킬 원본·host 발견 경로는 [공통 스킬 연결](.agents/skills/README.md#도구-연결과-이식), lifecycle은 위 session binding 계약에서 찾는다.
- 하위 가이드는 해당 경로의 구현 책임·위험 경계·명령과 필요한 Project 본문을 안내한다. 제품 상세·선택 이유는 Project의 대응 본문·형성 자료에, 실행 방식의 형성 이유는 해당 스킬·관리 본문 가까이에, 이번 작업의 선택·조사·검증은 Work에 둔다.
- 역사 자료를 정리할 때 해당 Owner의 관리 계약과 실제 소비 경로를 확인한다. 당시 원문·기록과 현재 기준을 구별하며, archive의 옛 제품 자료를 현재 읽기의 필수 경로나 우회 Owner로 되살리지 않는다.

## 커밋 메시지

새 커밋은 변경의 책임과 의도를 추적하도록 가능한 한 `type(scope): summary` 형태를 사용한다. runtime 변경은 `client`·`server`·`schema`·`ui`, 문서 변경은 `context`·`harness`·`readme`·`archive`처럼 가장 작은 유효 scope를 고른다. 여러 app/package에 걸친 기능은 `auth` 같은 domain scope를 사용할 수 있고, repo 전체 변경이거나 유용한 scope가 없으면 생략할 수 있다. 기존 이력은 이 기준에 맞춰 다시 쓰지 않는다.
