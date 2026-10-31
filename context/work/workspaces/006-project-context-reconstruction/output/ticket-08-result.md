# Ticket 08 — 개발 시작과 전체 읽기 경로 정리

2026-10-31. Ticket 07 작업 `1a614ab`, Workspace 기록 `f466a32`를 분리 커밋한 뒤 `recover 006-project-context-reconstruction`으로 이어 진행했다. 제품 코드는 변경하지 않았다. 이 결과는 문서 이관·정합성 점검이며 제품 결함 해결이나 006 전체 목표의 사용자 수락을 뜻하지 않는다.

## 현재 결과와 형식 판단

[개발 시작](../../../../../START_GUIDE.md)은 첫 로컬 실행·다음 실행·실패 확인 순서를 소유한다. 실제 환경변수 소비, OAuth, 공유 schema build, Compose와 새 DB의 `db:push`, native 개발 빌드를 대조해 고정 테스트 유저·없는 변수·Expo Go 안내를 교정했다. 명령과 환경 표는 실행 순서와 값의 역할을 함께 이해하는 데 필요해 유지했다. 실제 비밀값·DB·앱을 조작하지 않았다.

[루트 소개](../../../../../README.md)는 동기·기존 GIF·기능 장면·설계 이유를 유지했다. 긴 의사코드·정량 성능 수치·무손실과 삭제 후 복구 보장은 현재 근거가 없어 제거·정정했다. 모두 링크로 줄이지 않고 입력 보존·데이터와 서비스 책임·미전송 보호가 필요한 이유를 소개에 남겼다. [서버 안내](../../../../../apps/server/README.md)는 환경·명령·라우트와 배포 전제를, [SQL 안내](../../../../../apps/server/scripts/README.md)는 각 SQL의 전제·현재 사용 가능 여부·삭제 범위를 설명한다. 상세 schema 필드 전체를 재복제하지 않고 실제 schema와 연결했다.

[앱 실행 형성 맥락](../../../../project/current/app-runtime/_background/context.md)에 초기 실패 화면 최소화와 후속 `restore-failed`·명시 재시도의 관계를 보강했다. 로컬 읽기 전용·전체 차단은 계정 귀속과 미전송 보존 책임을 없애지 못하고 여행 기록을 끊으므로 채택하지 않았다. sync 종료를 기다리면 로그아웃이 늦어지는 비용과 성공 전송을 강제하지 않는 경계를 보존했다. 앱 강제 종료 뒤 journal 기반 복구는 당시 사용자가 명시 제외한 범위이며 자동 필수 과제로 되살리지 않는다. 현재 계약을 바꾸거나 오래된 ‘자동 다른 계정 전환’을 복원하지 않았다.

[여행 접근 형성 맥락](../../../../project/guidance/travel-access/_background/context.md)은 기존 Data/Service·Policy 분리 이유와 새 여행 생성·목록 보호 이유를 유지했다. 두 책임을 함께 이해할 부담·지도 전환·좌표 없는 수동 입력의 보완 비용을 추가했다. 선택 이유를 설명하는 문단 형식은 적합해 유지했고 오래된 API 예제·완료 체크리스트를 옮기지 않았다.

## 옛 원본과 현재 Owner

다음 링크는 **이관 조사·역사 확인 전용**이다. 현재 제품 진입점이나 개발 절차가 이 원본을 다음 읽기로 요구하지 않는다. 여섯 결정과 옛 색인은 이동 전 HEAD 원문 그대로 보존했고, 기존 경로에는 stub을 남기지 않았다. `.claude`의 실행 지침·bridge·하네스 결정은 유지했다.

| 보존한 원문 | 현재 의미와 이유를 읽는 곳 |
| --- | --- |
| [Data/Service 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2025-11-20-data-service-separation.md) | Project의 제품·여행 접근·선택 근거. Router 대안의 미전송 위험, 사용자 모드 전환 부담과 채택 비용 유지 |
| [Policy 책임 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2025-11-20-policy-layer-separation.md) | 여행 접근 본문·형성 근거. hook 안 UI 가용성 결합의 비용, useAppPolicy·작업별 정책, 후속 초안 보존 조건 유지 |
| [용어 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-03-21-terminology-unification.md) | Project 결정 0001. Selective Local-First·Activation Router·Client-Side ID·오프라인 보험의 이유와 역사 용어 보존 |
| [새 여행·목록 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-10-04-inactive-trip-creation.md) | 여행 접근 본문·형성 근거. 서버 생성·조회 반영·미전송 부모 보존·출처별 선택·단일 캐시·실패 분기 |
| [기기 세션 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-09-18-device-session-and-local-access.md) | app-runtime 본문·형성 맥락. 초안 당시 자동 계정전환과 후속 같은 계정 복구를 구별 |
| [앱 시작 실패 결정](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/decisions/2026-09-18-app-startup-failure-recovery.md) | app-runtime. DB 진입조건·인증 실패 구별·sync 종료 조율·명시 제외를 후속 코드와 대조 |
| [옛 context 색인](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-08/context/README.md) | [Project 입구](../../../../project/README.md). 더 이상 `.claude/context` 경유 불필요 |
| [기존 루트 소개](../../../../../_archive/2026-10-31-project-context-reconstruction/development-start/README.md) · [시작 안내](../../../../../_archive/2026-10-31-project-context-reconstruction/development-start/START_GUIDE.md) | 현재 루트 README·START_GUIDE, 제품 의미는 Project |
| [기존 서버 안내](../../../../../_archive/2026-10-31-project-context-reconstruction/development-start/apps/server/README.md) · [SQL 안내](../../../../../_archive/2026-10-31-project-context-reconstruction/development-start/apps/server/scripts/README.md) | 현재 서버·scripts README. 과거 SQL은 실행 대상이 아니라 전제 확인 대상임을 설명 |

앞선 Ticket 02–07의 원본·현재 Owner 대응은 [산출물 색인](index.md)의 각 결과에 보존했다. 옛 제품 결정 원문이 사라진 것이 아니라 일반 제품 읽기와 역사 조사를 분리한 것이다.

## 첫 조사 후보의 처리와 대표 질문

첫 조사의 일곱 보완 후보를 아래 결과와 대조했다. 모든 역사 문서를 완독하거나 002의 미실행 리팩터링 티켓을 완료한 것으로 넓히지 않았다. 도시 검색·저장 용량·동작 보존 리팩터링의 기존 본문은 자기 범위와 근거 상한이 이미 분명하여 새 틀로 다시 쓰지 않았다.

| 후보·대표 개발 질문 | 현재 읽기에서 얻는 답과 남는 경계 |
| --- | --- |
| 활성 여행·단절: 카드는 보이는데 내용은 왜 제한되는가? | Ticket 02, 제품·여행 접근. 목록/선택 보존과 비활성 내용 공개, 작성 초안 보존을 구별한다. 현재 일정 수정의 차이도 명시 |
| 오프라인 준비: 활성 표시가 지도·모든 경로 완료인가? | Ticket 04, 지도·경로. metadata/native pack/geometry/표시가 다르며 재시도·최신성·실기기 공백을 확인 |
| 저장·동기화·정리: 모든 미전송이 보호되는가? | Ticket 03, 데이터 수명·app-runtime. 계정 종료와 여행별 cleanup 보호 범위가 다름. PENDING 한정 판정 등 제품 공백 보존 |
| 구조·UI·schema: 공개 feature import면 일반 허용인가? | Ticket 05, 개발 경계. 특정 조회 조합의 조건·비용과 Project 전체 FSD 기준을 구별 |
| 입력·날짜: 초안·선택·저장과 경비 날짜는 같은 값인가? | Ticket 06, 작성·입력·날짜. 부모 수명, 날짜/시점 계약·호환·시간대와 현재 차이를 구별 |
| 통화·API·오류: 표시 자릿수나 auth middleware만으로 보장이 끝나는가? | Ticket 07, 통화·API·오류. 저장 정밀도·합산·입력과 ownership·공개 오류의 미충족을 별도 확인 |
| 개발 시작·세션: 어떤 DB·로그인·native 준비가 필요한가? | Ticket 08, START_GUIDE·서버·SQL과 app-runtime. 과거 seed 대신 OAuth, 새 DB schema 적용, 시작/로그인/오프라인 실행 증거의 차이를 확인 |

이 질문은 현재 Project 입구와 root/runbooks·경로별 guide에서 해당 본문으로 읽었으며 옛 제품 원본을 답의 필수 근거로 열지 않았다. 역사 원문을 제품의 현재 정답으로 재사용하는 것과 위 이관 대조는 다르다.

## 읽기 경로와 검증 선언

Root·Project·Document Map·Harness·rules·guards·runbooks·Claude/Codex agent의 현재 진입을 바꿨다. 세 agent는 report-only 역할을 유지하며 자료 선택만 Project로 맞췄다. 하네스 책임 전환은 [결정 기록](../../../../../_archive/2026-10-31-project-context-reconstruction/history-integration/decisions/2026-10-31-project-product-context-ownership.md.txt)에 남겼다.

Default 001과 current-generation metadata로 확인한 explicit-bound 002·006을 live consumer로 확인했다. 002 output의 당시 결정을 현재 선별 설명인 것처럼 이름 붙이지 않도록 구별하고 현재 읽기는 Project로 전환했다. 과거 기록의 원문은 수정하지 않았다. 001 Verify evidence에서 기존 누락 8개와 이번 이동으로 사라진 입력 4개를 제거하고 실제 여행 접근·데이터 수명·지도·app-runtime Owner와 개발 안내를 선언했다. claim·고정 명령·receipt·status는 바꾸지 않았다.

전체 Harness에는 [보존 기록·현재 비활성 Workspace의 참조 47건](ticket-08-historical-references.md)이 남는다. 기존 45건 그대로가 아니라 현재 진입 누락 해소와 이번 역사 원본 이동을 반영한 결과다. 24건은 records/source, 23건은 현재 live가 아닌 003·004·005의 당시 current/output이다. 검사 범위를 완화하지 않았으므로 전체 Harness·001 Verify 통과는 주장하지 않는다. 이 Work의 현재 제품 읽기 완성과 전체 과거 링크의 복구는 구별한다.

## 검토·실행 근거와 한계

독립 개선 검토는 원문·현재 구성·코드를 대조했다. 수동 ‘좌표’ 품질이라고 새로 쓴 비용을 좌표 없는 수동 입력의 보완 비용으로 바로잡았고, 002 output의 링크가 당시 결정 원문을 가리키는 듯한 이름을 현재 선별 설명으로 정정했다. production bundle의 환경 파일 위치도 dev 소스 실행과 다른 것을 리뷰에서 발견해 서버 안내를 프로세스 환경 주입 기준으로 고쳤다. 코드 경로 수정은 별도 과제로 남겼다. 수정 후 독립 리뷰에서 추가 필수 수정 발견이 없음을 확인했다. 기존 형식이 맞는 부분은 유지하고 단순 형식 통일을 하지 않았다.

세션 관련 기존 검사 10 suites·107 tests가 통과했다. layout·SecureStore·HTTP·sync/native 연결에는 대역을 사용했고 local-preservation은 Node 메모리 SQLite·Drizzle로 종료/쓰기 경합·큐 원본·rollback을 확인했다. 실제 기기·서버 token rotation·강제종료를 입증하지 않는다. 검사 대상은 `tests/app/layout.test.tsx`, `tests/shared/db/startup.test.ts`, auth의 `session-restoration`·`session-concurrency`·`login-service`·`auth-interceptor`·`local-preservation`, sync의 `lifecycle`·`logout-sync`·`cleanup-lifecycle`이며 `apps/client/jest.config.cjs`로 실행했다. 이번 원본 로그는 `/tmp/noline-ticket08-session-tests.log`에 있고 지속 결론은 여기의 대상·결과·대역 한계로 남긴다. 개발 시작 절차는 설정·실제 소비 코드·SQL·package script의 정적 대조이며 설치·기동·운영 배포 성공을 실행 검증하지 않았다.

최신판의 별도 검증에서 이 문서 이관 범위의 충족 근거를 확인했고 필수 수정 발견은 없었다. 원본 11개 byte 일치, 변경 문서 상대 링크 592개와 `git diff --check`, root·app·package bridge 및 agent 의미 일치를 확인했다. 001 evidence 214개가 모두 존재하고 변경은 `verification/evidence_paths`에 한정됐다. Recover 006·002·001·default를 직접 실행해 모두 성공했다. Activation·durable Verify·receipt·status 쓰기는 하지 않았다. 기존 세션 검사 로그와 대역을 대조해 문서의 지원 주장에 필요한 범위로 재사용했으며 같은 검사를 중복 실행하지 않았다. 전체 Harness의 실패 47건은 목록과 정확히 일치했다. 실행 로그는 `/tmp/noline-ticket08-verify-recover-*`, `/tmp/noline-ticket08-verify-harness.log`에 있으며 지속 결과와 한계는 이 문서와 역사 참조 목록에 남겼다.

## 이관 이후 남는 제품 작업

기존 데이터·지도·입력·접근/공개·금액 보호 공백은 각 Project 본문과 Ticket 03–07 결과에 남는다. 문서 이관이 이를 수정하지 않는다. 접근·공개 안전성은 기존 003과 먼저 대조하고, 금액은 입력/저장/합산/표시 기대값을 함께 정하는 후속이 적합하다. Render HOST·Google 변수명은 설정 파일과 코드가 어긋나며 실제 운영 override는 미확인이다. 서버 source/bundle의 환경 파일 경로 차이도 후속 대상이다. 별도 제품·배포 변경을 이 티켓에서 묵시적으로 수행하지 않았다.

전체 Workspace 수락은 위 재구성과 남은 범위를 사용자가 판단하는 별도 단계다. 역사 Workspace 재개 시 참조 정리, 전체 Harness의 역사 참조 처리와 제품 수정 우선순위를 다음 지시에서 구별해 선택할 수 있다.

## 커밋과 추가 조사에서 보완한 확인

08 작업은 `bebf123`으로 커밋했다. 커밋 전 추가 `.claude` 조사에서 런북이 가리키는 workflows 호환 지도가 삭제된 옛 context로 다시 연결되는 경로를 발견해 Project 입구로 수정했다. 앞선 별도 검증의 현재 읽기 확인은 이 간접 경로까지 전수 검증한 결과가 아니었다. 이 한정 누락과 후속 실행층 정리 후보는 [추가 조사](claude-cleanup-candidates.md)에 구별해 남겼다. 원래 제품 문서·검사 결과는 유지하며 역사 참조47건을 전체 통과로 바꾸지 않는다.

후속 별도 검증에서 `runbooks → workflows → Project`의 실제 연결과 workflows 전체·runbooks·006 current/결과의 상대 링크 155개, `git diff --check`를 확인했다. 전체 Harness 실패 집합은 이전47건과 정확히 같았다. 링크 한 곳의 수정은 기존 제품 설명·원본 보존·agent parity·001 evidence·세션 검사 근거를 무효화하지 않으며, 자동 Maintain 복구 자체는 이 좁은 검증의 범위가 아니다.

기록 복구 뒤 Main의 explicit `activate 006-project-context-reconstruction`은 generation 2로 성공했다. generation 1의 실패 이력은 유지하고 새 연결의 grounding만 확인했으며, 이후 자동 response-end 반영까지 미리 성공했다고 주장하지 않는다.
