# Ticket 05 — 구조·계층·UI·schema 이관 결과

구조·component·TypeScript 본문과 Store 결정의 현재 의미를 코드·후속 작업에 대조하여 Project로 재구성했다. 현재 위치를 찾는 구조 지도와 관련 개발에서 적용할 기준을 나눴다. 제품 코드는 변경하지 않았으며, 기존 계층 예외를 제거하거나 새로 허용한 작업도 아니다. 독립 개선 검토와 별도 요구 검증·수정 후 재검증을 마쳤다. 작업 변경은 `0e49e13`으로 커밋했고 Workspace 기록은 별도 커밋으로 분리한다.

## 실제 산출물과 구성을 고른 이유

- [개발 기준](../../../../project/guidance/development-boundaries/INDEX.md)은 변경 책임에서 계층·UI·schema 본문을 선택하게 한다.
- [계층·재사용](../../../../project/guidance/development-boundaries/layers.md)은 application, 화면·feature·entity·shared의 기준과 실제 의존 예외를 함께 설명한다.
- [UI 책임](../../../../project/guidance/development-boundaries/ui.md)은 primitive·앱 조합·domain 표시·workflow, 부모 간격과 interaction 상태를 구별한다.
- [공유 schema·타입](../../../../project/guidance/development-boundaries/schema-and-types.md)은 정적 추론·런타임 검증·물리 DB·전송 표현의 차이와 기존 TypeScript 규약을 설명한다.
- [형성 맥락](../../../../project/guidance/development-boundaries/_background/context.md)은 Store/service/Policy 선택, 조회 조합의 제한적 재사용과 비용, 오래된 예제를 바꾼 이유를 보존한다.
- [현재 구조](../../../../project/current/architecture.md)는 실제 app/package와 DB 책임, 지원·검증의 한계를 연결한다.

원자료의 파일 수를 그대로 새 문서 수로 바꾸지 않았다. 현재 구조는 구현 위치를 찾는 역할을 유지하고, 실제 변경 판단은 하나의 개발 기준 묶음에서 필요에 따라 고른다. 계층·UI·schema는 같은 작업에서 연결되지만 읽을 질문과 변경 책임이 달라 본문을 나눴다. 공통 기준마다 세 물리 layer의 문서를 추가하지 않았다.

기존 책임 표·비교는 유지했다. 반복 체크리스트는 해당 조건과 행동 가까이에 통합했고, 긴 교육 코드·web 예시·없는 export는 실제 경로와 한정된 예시로 바꿨다. 기존 형식이 다르다는 이유로 제거한 것이 아니라 어떤 판단을 도와주는지 따졌다. 규칙을 선언한 문장과 현재 코드가 그 규칙을 준수한다는 주장은 구별했다.

## 원본별 유지·정정·격리

| 원본과 보존판 | 현재 반영과 판단 |
| --- | --- |
| `.claude/context/architecture.md` → [보존판](../../../../../.claude/_archive/architecture-pre-project-2026-10-31.md) | 계층 책임·feature/widget 통합·routing·재사용·workspace 의존성 기준 유지. 없는 packages/db·Prisma와 빠진 application 정정. shared 순수성·모든 route가 단순 렌더라는 과장 정정. |
| `.claude/context/components.md` → [보존판](../../../../../.claude/_archive/components-pre-project-2026-10-31.md) | primitive·domain·workflow, 외부 margin, RHF adapter·picker 책임 유지. Button 대신 실제 Pressable export로 정정. 폼 전체 수명은 06의 별도 책임으로 유지. |
| `.claude/context/typescript.md` → [보존판](../../../../../.claude/_archive/typescript-pre-project-2026-10-31.md) | type 기본·import·명명·함수·주석·중괄호·진단 기준 유지. z.infer의 검증 보장·type export 불가·존재하지 않는 import·불완전한 타입 guard와 catch/null 예제 정정. |
| Store 계층 결정 → [보존판](../../../../../.claude/_archive/store-layer-decision-pre-project-2026-10-31.md) | Zustand 기준과 상태/실행/규칙의 분리 이유·대안·이동 비용 보존. 모든 관련 hook의 발견 가능성과 소유 일관성을 유지하되 과거 4개→1개를 영구 물리 파일 수 규칙으로 일반화하지 않음. 당시 성능 개선을 현재 실측 보장으로 가져오지 않음. |

네 옛 경로는 제거했고 compatibility stub을 만들지 않았다. 보존판은 역사 안내를 앞에 붙이고 원문을 유지한다. 새 Project 본문·형성 자료는 보존판이나 옛 제품 본문에 읽기를 의존하지 않는다. 이 output의 보존 링크는 역사 조사 접근점이다.

## 직접 대조한 핵심 근거

- `app/_layout.tsx`, `application/AppInitialization.tsx`, `useTripListRefresh.ts`: 앱 준비·인증 후 효과·navigation/provider 조합의 분리. Root layout은 단순 screen re-export가 아니다.
- `shared/store/network.ts`, `shared/store/auth.ts`, auth service와 기존 app-runtime 본문: 상태와 그 수명에 필요한 실행을 함께 둔 현재 구조. Zustand 기준을 side effect 금지로 바꾸지 않았다.
- `shared/policy/useAppPolicy.ts`, 지도 UI·cleanup·route downloader·currency imports: 실제 shared→entity 참조가 남아 있다. 일반 계층 기준의 충족으로 숨기거나 새 역방향 참조의 선례로 올리지 않았다.
- 일정/경비 조회 feature와 일정 생성·수정, 경비 생성·일정 선택 소비자: 공개 조회 훅 재사용이 현재 코드에 있다. [002 배치 기록](../../002-code-readability-refactoring/records/2026-09-29-09-policy-query-ownership-and-migration.md)의 좁은 조건과 결합 비용을 보존했고 Project-wide feature import 허용으로 승격하지 않았다.
- `packages/ui/src/index.tsx`, `Pressable.tsx`, `shared/components/Form/TimeField.tsx`: 실제 공개 컴포넌트와 RHF/임시 선택/확정 경계. 기존 interface 사용과 type 기본 기준을 구별했다.
- `packages/schema/package.json`, `src/index.ts`, entity/request/response/sync와 Expense client API·server route: 지원 subpath, AuthProvider type export, request/response parse와 payload z.any의 보장 상한. 코드 주석의 DB 1:1 설명과 실제 decimal/timestamp·JSON string 표현은 다르다.
- `apps/server/src/middleware/auth.ts`: server guide의 req.user 설명을 실제 req.userId로 바로잡았다.
- `packages/eslint-config/src/index.js`: 지침의 스타일 전체를 lint가 검사한다고 표현하지 않았다.

위 대조는 대표 경로의 코드 관찰이다. 모든 import의 순환 의존 검사나 전체 API 검증, native 앱 실행을 수행한 것은 아니다.

## 현재 읽기 경로와 검토 판단

Project README·guidance 색인·현재 구조, client/UI/schema guide, context map·UI runbook, 문서 관리 command의 현재 경로를 바꿨다. Personal README는 제품 기준으로 가는 두 링크만 바꿨고 기존 경험 문서의 별도 변경은 건드리지 않았다. source-map의 당시 분석 문장은 보존하고 이동한 원문 링크만 archive로 전환했다.

독립 개선 검토자는 원본 네 문서·002 배치 기록과 실제 코드에서 내용·구성을 대조했다. 분리 구성의 이득과 기존 표·조건·비용 보존을 확인했다. 초안에서 Zustand 필수 기준이 단순 현황으로 약해진 발견을 받아들여 기존 규칙 강도를 복원했다. 한 소유 위치에서 관련 hook을 찾게 하는 설명은 현재 Network/Auth 책임과 맞으므로 유지했다.

선택 의견인 UI 본문→옛 form Owner 직접 링크는 추가하지 않았다. 이 본문에 필요한 picker/adapter 책임은 직접 설명했고 전체 폼 수명은 Project README의 미이관 주제 진입이 이미 연결한다. 06에서 새 작성·입력 Owner를 만든 뒤 이 문장의 직접 연결을 함께 맞춘다. 링크를 생략한 것을 폼 전체 이관 완료로 해석하지 않는다.

## 확인과 남은 범위

Main의 최종 변경 문서 상대 링크 315개 검사(관련 Personal README 포함)와 `git diff --check`가 통과했다. 별도 검증자는 네 archive의 안내문 이후가 HEAD 원본과 byte 단위로 같고, 옛 경로가 없음을 확인했다. 새 UI 배치·조회 feature 재사용·Expense schema/HTTP/DB 경계의 세 대표 읽기에서 본문과 현재 코드만으로 필요한 판단을 복원했다. Main은 현재 explicit binding의 Workspace는 002·006임을 운영 metadata만으로 확인했다. 006·002·001 explicit Recover와 default 001 Recover가 성공했다. 선택되는 Project 경로는 유지되고 새 본문으로 읽기 연결이 이어지므로 Recover 계약을 바꾸지 않았다.

독립 검증에서 default 001의 실행 가능한 Verify 선언에 이번에 이동한 네 evidence path가 남은 것을 발견해 새 개발 기준 7개 본문으로 전환했다. 검증 claim·argv·receipt·status는 바꾸지 않았다. 이전 작업부터 남아 있던 다른 missing evidence path 8개는 전체 현재 읽기·검증 선언 점검인 08의 후속 대상으로 명시한다. Recover 성공과 전체 Verify 목록의 유효성은 다르며 durable Verify를 실행하거나 기존 receipt를 최신 증거로 올리지 않았다.

`node scripts/check-harness.mjs`는 역사 자료의 끊어진 링크 25건으로 실패했다. 직전 티켓의 22건에 비해 이번에 archive로 이동한 component 문서를 가리키던 역사 005 자료 3건이 추가됐다. 이 기록들을 현재 제품 안내로 고치거나 옛 stub을 복구하지 않았다. 로그는 `/tmp/noline-006-ticket05-harness.log`다. 링크 검사는 경로 검증이고 의미 충분성은 위 원문·코드 대조와 별도 읽기 검증으로 판단했다. 제품 소스·테스트 변경이 없어 제품 test/build·앱 실행은 이번 문서 검증 범위에서 수행하지 않았다.

별도 검증자는 001 Verify 입력의 수정 뒤 새 7개 파일과 나머지 필드 불변, 기존 누락 8개의 분리를 재확인했고 Ticket 05 범위의 blocking 발견이나 중요한 미확인을 남기지 않았다. 001 전체 Verify나 006 전체 완료를 의미하지 않는다.

다음 문서 실행은 06 작성·입력·날짜다. 일정 수정의 정책 전환 중 초안 표시·편집, 생성/수정 reset과 picker 확정 시점, 폼 값·request·저장 표현의 차이를 현재 코드와 대조한다. 05에서 발견한 shared 역방향 참조·스타일 불일치는 문서로 구별한 현재 차이이며 이번 범위에서 제품 코드 수정이나 일괄 계층 정리를 수행하지 않았다.
