# 현재 산출물

이 Workspace에서 선택한 현재 산출물은 공통 Spec·Ticket 운영 기준, 완료된 01·02·04번 Ticket의 제품 코드와 Ticket 05의 서버 테스트 기반·Schedule 날짜 직렬화·response schema 적용 결과다. 실제 파일은 Project의 canonical 위치에 유지한다. 산출물 연결은 전체 Work 완료나 제품 Verify 통과를 뜻하지 않으며 작업 정의와 현재 상황은 [현재 context](../current/memory/index.md)와 [state](../current/state/index.md)가 소유한다.

## 공통 Spec·Ticket 운영 기준

사용자 지시에 따라 검토된 실행 기준을 공통 운영 정본에 반영하고 기존 단일 문서를 책임별 디렉터리 구조로 나눴다. 이후 기준 변경에서 선택 배경과 방지하려던 실패를 잃지 않도록 같은 디렉터리에 변경 이력을 둔다.

- [운영 기준 진입](../../spec-and-tickets/README.md): Spec·Ticket·state의 관계, 상황별 읽기 순서와 기준 변경 전 이력 확인 규칙
- [목표를 실행 결과로 이어가는 기준](../../spec-and-tickets/EXECUTION-CRITERIA.md): 필요한 일의 발견, 범위·품질·분해·실행·완료 판단
- [Spec 작성](../../spec-and-tickets/SPEC.md): Work 목표와 공통 기준의 다섯 관점
- [Ticket 작성](../../spec-and-tickets/TICKET.md): 실행 결과·맥락·접근·완료 근거·실제 결과 작성
- [갱신과 작업의 연속성](../../spec-and-tickets/MAINTENANCE.md): Main·Maintain의 갱신 책임과 재판단 기준
- [선택 배경과 변경 이력](../../spec-and-tickets/HISTORY.md): Ticket 03에서 드러난 문제, 현재 판단을 선택한 이유, reviewer 과정, 문서 분리와 검증 한계 및 후속 변경 기록
- [프로젝트 결정 연결](../../../../../.claude/decisions/2026-09-12-spec-ticket-execution-criteria.md): 기존 프로젝트 결정 목록에서 현재 `HISTORY.md`와 운영 기준으로 이어지는 경로

기존 `context/work/workspaces/SPEC-AND-TICKETS.md`는 과거 링크를 새 진입점으로 연결하는 위치 안내로 남아 있다. `HISTORY.md`는 기준 자체를 변경할 때 읽는 배경 Owner이며 일반 Ticket 실행이나 Maintain의 매 판단 입력에 추가되지 않는다. 실제 구현·완료 행동의 후속 검증과 이 Workspace 전체의 사용자 acceptance는 아직 남아 있다.

공통 운영 기준, 하네스 소비 경로와 이번 재검토의 관련 Workspace 문서는 `d7223b7 feat(harness): Spec·Ticket 실행 기준 강화`로 커밋됐다. read-only commit 조회로 전체 해시 `d7223b7b6622f625e26f7e7457f6eb1373cf91d9`과 관련 파일 포함을 확인했다. Main은 작업 트리가 clean이었다고 보고했다. Maintain 관련 검사 9개와 링크 검사는 통과했다고 보고됐으며, 전체 124개 검사에서는 기존 시간 제한 검사 한 건이 간헐적으로 실패하고 단독 실행은 통과했다.

이후 사용자는 fresh-session 보고에서 드러난 세 간격을 Ticket 구성안이 아니라 공통 지침에 보완하려던 것이라고 정정했다. Main은 Ticket 문서와 제품 구현은 바꾸지 않고 실행 기준과 Ticket 작성 기준에 실제 달라질 결과의 정의, 분리한 일의 성립·선행·담당 관계, 구성안 단계의 목표·담당·미배정·미확인 대조를 추가했다고 보고했다. 이 후속 보완은 `c902230 docs(harness): 티켓 결과와 선행 관계 판단 기준 보완`으로 커밋됐으며 read-only 조회에서 전체 해시 `c90223012b7135d2a221cf4a97036872111f6df0`, 부모 `d7223b7b6622f625e26f7e7457f6eb1373cf91d9`와 공통 실행·Ticket 기준 파일의 포함을 확인했다. Ticket 본문과 제품 코드 파일은 커밋에 포함되지 않았다. 하네스 직접 검사와 `git diff --check`는 통과했다고 Main이 보고했지만 Maintain은 재실행하지 않았고, 대화 맥락 없는 새 세션의 독립 재검증은 아직 없다.

## 01 — 경비 합계 표시

- [currency.ts](../../../../../apps/client/src/shared/lib/currency.ts): `getCurrencyFractionDigits`로 통화별 소수 자릿수 규칙을 모았다.
- [ExpensesScreen.tsx](../../../../../apps/client/src/screens/ExpensesScreen.tsx): 자릿수 규칙을 사용하고 `isFirstCurrencyGroup` 판단을 강조와 ‘주 통화’ 라벨에서 공유한다.

실제 변경과 검사 결과의 출처·미확인 범위는 [01번 Ticket](../current/memory/tickets/01-expense-totals.md)이 소유한다. 사용자는 fixture 비교와 제한된 정적 검사, 실제 React Native 화면 렌더 미실행이라는 한계를 확인하고 결과를 수락했다. 별도 영구 테스트 산출물은 없다.

Main이 보고한 최종 커밋은 `a51b759 refactor(client): 경비 합계 표시 규칙 정리`이며 기존 `1cc6696`을 amend로 대체했다. 당시 작업 트리는 clean이었다고 보고했다.

## 02 — 도시 검색 선별

- [geonames.api.ts](../../../../../apps/client/src/features/trip/create-trip/geonames.api.ts): 요청과 응답 필터가 허용 도시 코드 목록을 공유하고 도시 선별과 `City` 변환 책임을 드러낸다.

변경 전후 fixture·독립 verifier 결과와 미확인 범위는 [02번 Ticket](../current/memory/tickets/02-city-search.md)이 소유한다. 사용자는 실제 GeoNames 연결과 전체 앱 화면 미확인, 영구 테스트 부재를 포함한 결과를 확인하고 수락했다.

Main은 사용자 요청에 따라 기록과 커밋을 마무리했다고 보고했다. 보고 커밋은 `33348de refactor(client): 도시 검색 선별 조건 정리`이며 보고 시점의 작업 트리는 clean이었다.

위 커밋과 Git 상태는 Main 보고다. Maintain은 커밋 내용이나 작업 트리를 독립 확인하지 않았다.

## 04 — 경비 API 흐름

- [expenses.ts](../../../../../apps/client/src/entities/expense/api/expenses.ts): 재전파 catch·진단 출력·반복 주석을 없애고 요청 검증·HTTP·응답 검증·반환 순서를 직접 보여 준다.
- [expenses.test.ts](../../../../../apps/client/tests/entities/expense/api/expenses.test.ts): 다섯 remote export의 정상 흐름·검증 실패·오류 전달·HTTP 횟수를 고정한다.

변경 전후 동일한 8개 검사가 통과했다. 실제 네트워크·Axios interceptor·React Native 화면은 실행하지 않았으며, 정규 ESLint와 client 전체 타입 검사의 기존 실패를 새 회귀로 덮지 않았다. 상세 근거와 사용자 수락 범위는 [04번 Ticket](../current/memory/tickets/04-expense-api.md)이 소유한다.

Main이 보고한 커밋은 `dce576f refactor(client): 경비 API 흐름 정리`이며 Ticket 04 관련 파일 다섯 개만 포함했다. 보고 시점의 작업 트리에는 별도 Ticket 05와 `output/index.md`의 다른 미커밋 변경이 남아 있었다. 이 커밋 내용과 Git 상태는 Maintain이 독립 확인하지 않았다.

## 05 — 서버 테스트 기반과 Schedule 응답 경계

- [server package](../../../../../apps/server/package.json): Vitest·Vite·Supertest exact dependency와 일회·watch test 명령을 소유한다.
- [Vitest 설정](../../../../../apps/server/vitest.config.ts): Node test 환경, server test 검색 범위와 test-only 환경변수를 정의한다.
- [서버 앱 smoke 테스트](../../../../../apps/server/tests/app.smoke.test.ts): exported Express app과 `/api/health`의 기본 연결을 검사한다.
- [Schedule API 응답 계약 테스트](../../../../../apps/server/tests/routes/schedules.response-contract.test.ts): 생성·목록·단건·수정·Trip 하위 목록·activation·sync pull의 status·응답 구조·날짜 JSON을 비교한다.
- [Schedule serializer](../../../../../apps/server/src/serializers/schedule.ts): DB Schedule row의 네 날짜를 API ISO 문자열 또는 null로 바꾸는 순수 변환을 소유한다.
- [Schedule serializer 단위 테스트](../../../../../apps/server/tests/serializers/schedule.test.ts): 필수 날짜와 nullable `deletedAt` 변환을 검사한다.
- [Schedule route](../../../../../apps/server/src/routes/schedules.ts), [Trip route](../../../../../apps/server/src/routes/trips.ts), [Sync route](../../../../../apps/server/src/routes/sync.ts): 일곱 Schedule 응답 소비 지점에서 같은 serializer를 사용한다.
- [공용 테스트 app 준비](../../../../../apps/server/tests/support/test-app.ts): 실제 app import 전에 DB·auth ESM module을 대체하고 route별 fixture와 DB 호출 기록을 제공한다.

Node 20.18.1에서 2개 file의 2개 test와 server build가 통과했다. 실제 PostgreSQL·JWT·배포 process는 검사하지 않았고 기존 `places.ts:138` 타입 오류 때문에 server 전체 typecheck는 실패했다. 이 기반은 Ticket 05의 제품 결과가 아니라 이후 날짜 직렬화·schema·ownership 변경을 비교할 첫 산출물이다. 정확한 구성과 한계는 [구축 기록](../records/2026-09-13-02-server-test-setup.md)이 소유한다.

사용자 요청에 따라 이 서버 테스트 기반과 Ticket 05의 현재 계약·관련 기록은 `fe5722a test(server): add schedule API contract foundation`으로 커밋됐다. read-only 조회에서 전체 해시 `fe5722a0da4dc8234827d5e0da6dee9375c43298`, 부모 `70155641b2bda13df6b905b58ebbe414fa5ee0ed`와 보고된 15개 파일의 포함을 확인했다. Node 20.18.1의 2개 테스트와 `git diff --check` 통과는 Main의 보고이며 Maintain은 재실행하지 않았다. Main은 이 커밋의 staging 잔여는 없지만 관련 없는 별도 변경 때문에 전체 작업 트리는 clean하지 않다고 보고했다.

사용자 요청에 따라 Schedule 날짜 직렬화 공통화와 관련 test·Workspace 현재 문서는 `7dd2521 refactor(server): centralize schedule serialization`으로 커밋됐다. read-only Git 조회에서 전체 해시 `7dd25211d18bcb100850295670e566c432f64da8`, 부모 `fe5722a0da4dc8234827d5e0da6dee9375c43298`과 `schedules.ts`, `trips.ts`, `sync.ts`, 새 serializer, 3개 test file 및 Ticket·state·output 포함을 확인했다. 3개 test file의 10개 test와 server build 통과는 Main의 보고이며 Maintain은 재실행하지 않았다. response schema 적용과 ownership·soft-delete는 다음 단계로 남고, 이 커밋만으로 Ticket 05 전체 완료나 사용자 acceptance가 되지는 않는다.

후속 response schema 단계에서는 세 Schedule GET 경로의 중간 `scheduleEntity` 검증을 제거하고 바깥 `scheduleResponse` 또는 `scheduleListResponse`가 entity를 포함한 전체 응답을 한 번 검사하게 했다. Schedule DELETE에는 `deleteScheduleResponse`, Trip activation에는 `activateTripResponse`를 연결했다. activation Expense의 `date`와 `hasReceipt`도 현재 공유 계약에 맞는 날짜 문자열과 boolean으로 보정했다. 변경 전 세 실패 사례와 수정 후 server test 3개 파일의 13개 test, server build와 diff 검사는 [실행 기록](../records/2026-09-14-01-schedule-serialization-and-response-contract.md)에 정리돼 있다.

이 response schema 변경과 관련 기록은 `9d48b95 refactor(server): enforce schedule response contracts`로 커밋됐다. 이 저장 경계는 Ticket 05의 3번 ownership·soft-delete 완료를 뜻하지 않는다.

후속 ownership·soft-delete 단계에서는 Schedule 생성과 Trip 하위 목록에서 부모 Trip 접근을 먼저 확인하고, 중첩 목록과 activation의 Schedule·Expense query에 자식 user scope와 일반 조회의 non-deleted 조건을 적용했다. Schedule 수정·삭제는 실제 UPDATE 자체가 `id + userId + deletedAt IS NULL`을 만족할 때만 변경하도록 정리했다.

- [PostgreSQL 통합 검사](../../../../../apps/server/tests/integration/schedules.access-boundary.test.ts): 사용자 A/B, 삭제된 부모·자식, 교차 소유 자식과 실제 scoped UPDATE를 확인한다.
- [통합 Vitest 설정](../../../../../apps/server/vitest.integration.config.ts), [Drizzle test 설정](../../../../../apps/server/drizzle.integration.config.ts): 일반 mock test와 실제 PostgreSQL 범위를 분리한다.
- [일회성 PostgreSQL 구성](../../../../../apps/server/docker-compose.test.yml), [실행기](../../../../../apps/server/scripts/run-integration-tests.mjs): 개발 DB를 사용하지 않고 PostgreSQL 14 시작·schema 적용·검사·폐기를 조립한다.

변경 전 mock route 검사 네 개에서 현재 차이를 확인했고, 수정 후 server unit·route 29개 test와 PostgreSQL integration 4개 test, server build와 형식 검사가 통과했다. 실제 JWT·배포 process와 기존 `places.ts:138` typecheck 오류는 남아 있다. 상세 근거는 [접근 경계 실행 기록](../records/2026-09-14-03-schedule-access-boundary.md)이 소유한다. 사용자는 상세 결과와 검증 한계를 확인한 뒤 이 3번 결과의 기록과 커밋을 요청했다.

## 06 — 앱 준비와 인증·로컬 접근·화면 정책

- [AppInitialization](../../../../../apps/client/src/application/AppInitialization.tsx)과 [Root](../../../../../apps/client/app/_layout.tsx)는 DB 준비·복원·화면 이동·인증 후 작업 연결을 소유한다.
- [Auth Store](../../../../../apps/client/src/shared/store/auth.ts)는 현재 계정·인증 상태와 계정 검사·세션 저장·적용을 소유한다. Local 계정 selector와 필수 계정 검사, Remote 인증 조건도 이 파일에서 읽는다. [token-storage](../../../../../apps/client/src/shared/services/auth/token-storage.ts)는 기기 기록 형식·SecureStore I/O를 맡는다.
- [auth-interceptor](../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts)는 요청 세션 확인·공유 갱신·인증 거부를 Store와 연결한다. [auth-transport](../../../../../apps/client/src/shared/services/auth/auth-transport.ts)의 갱신 요청은 보호된 apiClient에 재진입하지 않는다.
- [session-lifecycle](../../../../../apps/client/src/shared/services/auth/session-lifecycle.ts)은 로그인·로그아웃·계정 삭제가 겹치지 않도록 전체 순서와 sync·cleanup·로컬 저장의 종료를 조율한다. [login-service](../../../../../apps/client/src/shared/services/auth/login-service.ts)·[logout-service](../../../../../apps/client/src/shared/services/auth/logout-service.ts)는 각 사용자 작업 절차를 보인다.
- [local-access](../../../../../apps/client/src/shared/services/auth/local-access.ts)는 여행 소유권·활성 조건 SQL, [local-account](../../../../../apps/client/src/shared/services/auth/local-account.ts)는 DB·큐 소유자 사실, [DB](../../../../../apps/client/src/shared/db/index.ts)는 transaction 직렬화·접수 차단·원자적 초기화를 소유한다.
- [Sync engine](../../../../../apps/client/src/shared/services/sync/engine.ts)·[queue](../../../../../apps/client/src/shared/services/sync/queue.ts)·[cleanup](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts)은 중단 결과 전달, 실패 작업의 FIFO 재시도, 큐가 참조하는 원본 보존을 연결한다.
- [Policy](../../../../../apps/client/src/shared/policy/useAppPolicy.ts)는 CRUD별 허용과 이유를 선택한다. [일정 화면](../../../../../apps/client/src/screens/ScheduleScreen.tsx)·[경비 화면](../../../../../apps/client/src/screens/ExpensesScreen.tsx)·[경비 상세](../../../../../apps/client/src/screens/ExpenseDetailScreen.tsx)는 제한 때 캐시 내용을 가리고, [LoginScreen](../../../../../apps/client/src/screens/LoginScreen.tsx)은 실패 복원과 명시적 기기 데이터 정리 행동을 제공한다.

검증은 [세션 동시성](../../../../../apps/client/tests/shared/services/auth/session-concurrency.test.ts), [SQLite 보존](../../../../../apps/client/tests/shared/services/auth/local-preservation.test.ts), [인증 중단 결과](../../../../../apps/client/tests/shared/services/sync/auth-result.test.ts), [화면 read 제한](../../../../../apps/client/tests/screens/auth-policy.test.tsx), [정리 확인](../../../../../apps/client/tests/screens/login-recovery.test.tsx), [오프라인 수정값 보존](../../../../../apps/client/tests/features/edit/offline-values.test.tsx)에서 실제 연결을 읽는다.

라우팅·DB·인증·동기화·화면 정책은 `f0f680e` → `9936662` → `62ce226` → `100e71a` → `be2f5b9`로 나눠 저장했다. 현재 검사·미확인과 다음 행동은 [state](../current/state/index.md), 커밋별 동작 경계와 분리 검증은 [마무리 기록](../records/2026-09-22-02-five-stage-commits-and-verification.md), 선택과 재현 과정은 [재점검·구현 기록](../records/2026-09-21-04-auth-responsibilities-and-regression-fixes.md)에서 읽는다. 남은 제품 책임은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)과 [14](../current/memory/tickets/14-local-mutation-router-transaction.md)·[15](../current/memory/tickets/15-sync-result-retry-pull-types.md)·[16](../current/memory/tickets/16-unsynced-data-cleanup.md)에서 이어간다.


온라인 복구 2-A의 산출물은 [일정 화면의 Policy·Query 조합](../../../../../apps/client/src/screens/ScheduleScreen.tsx), [조회 안내](../../../../../apps/client/src/screens/ScheduleQueryFeedback.tsx), [화면 연결 검사](../../../../../apps/client/tests/screens/schedule-recovery.test.tsx)에서 읽는다. 기존 구현·단순화 후보의 비교는 [앞선 논의](../records/2026-09-29-01-schedule-recovery-responsibilities-discussion.md), 캐시 표시와 Query·sync 책임을 선택한 이유는 [복구 결정](../records/2026-09-29-02-schedule-recovery-query-sync-decision.md), 현재 단계·검증 범위와 다음 행동은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)과 [state](../current/state/index.md)가 소유한다.

2-A의 변경 후 갱신 검사는 [sync와 Query 연결](../../../../../apps/client/tests/shared/services/sync/query-refresh.test.ts), [활성 전환 뒤 일정 갱신](../../../../../apps/client/tests/entities/trip/activation-query-refresh.test.ts)에 있다. 구현 선택과 검증의 범위는 [실행 기록](../records/2026-09-29-03-schedule-query-recovery-implementation.md)에서 읽는다.

일정 화면의 중간 상태 표현을 걷어낸 이유와 표시·실제 조회 조건의 구분은 [아키텍처 검토·개선 기록](../records/2026-09-29-04-schedule-policy-query-composition.md)에서 읽는다.

2-A 후속 산출물은 [수정 폼의 조회 수명](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx), [변경 후 공통 Query 갱신](../../../../../apps/client/src/shared/lib/query-refresh.ts)에 있다. 실제 폼 연결 검사는 위 화면 연결 검사에 포함되며 선택 이유와 검사 경계는 [후속 개선 기록](../records/2026-09-29-05-schedule-form-query-lifecycle.md)에서 읽는다.

2-B의 산출물은 [경비 목록](../../../../../apps/client/src/screens/ExpensesScreen.tsx), [경비 상세](../../../../../apps/client/src/screens/ExpenseDetailScreen.tsx), [경비 수정 폼](../../../../../apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx), [화면 복구 검사](../../../../../apps/client/tests/screens/expense-recovery.test.tsx)에서 읽는다. 갱신 출처 전환 검사는 위 [활성 전환 검사](../../../../../apps/client/tests/entities/trip/activation-query-refresh.test.ts), push 중첩은 [sync 검사](../../../../../apps/client/tests/shared/services/sync/query-refresh.test.ts)에 포함된다. 선택 이유·검사 경계는 [2-B 기록](../records/2026-09-29-06-expense-query-recovery.md)이 맡는다.

`b4db89d`에 저장된 일정·경비 조회 조합은 [일정 feature](../../../../../apps/client/src/features/schedule/read-schedules/index.ts), [경비 feature](../../../../../apps/client/src/features/expense/read-expenses/index.ts), [공통 접근·실행 조합](../../../../../apps/client/src/shared/services/policy-query/index.ts)에서 읽는다. 공통 반환·실행 계약은 [검사](../../../../../apps/client/tests/shared/services/policy-query/read-query.test.tsx), 명명·FSD 판단과 기존 helper 제거는 [배치·교체 기록](../records/2026-09-29-09-policy-query-ownership-and-migration.md)에 있다. 앞선 한 곳 비교는 [시험 기록](../records/2026-09-29-08-schedule-read-query-actions-trial.md)에 보존한다.

### 일정 생성과 Places 경계

[생성 Screen](../../../../../apps/client/src/screens/CreateScheduleScreen.tsx)은 작성 단계와 수명을, [초안 훅](../../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts)은 입력·채택 장소·검증을, [생성 검색 조합](../../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleSearch.ts)은 후보의 표시·선택을, [제출 훅](../../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)은 생성 요청과 기존 후속 처리를 연결한다. [목록 추가 행동](../../../../../apps/client/src/features/schedule/schedule-list-view/ScheduleListView.tsx)은 진입 정책 확인·이동을 맡는다.

[공통 Places 서비스](../../../../../apps/client/src/shared/services/places/index.ts)와 [상세 응답 schema](../../../../../packages/schema/src/responses/places.ts)는 검색 결과의 보장을, [수정 호환 adapter](../../../../../apps/client/src/features/schedule/update-schedule/place-search-compatibility.ts)는 기존 상세 실패의 차이를 소유한다. [생성 흐름 검사](../../../../../apps/client/tests/screens/create-schedule-flow.test.tsx), [Places API 검사](../../../../../apps/client/tests/shared/services/places/api.test.ts), [수정 소비 검사](../../../../../apps/client/tests/screens/update-place-search.test.tsx)에서 동작 근거를 찾는다.

현재 범위와 남은 확인은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)과 [state](../current/state/index.md), 문제 배경·리뷰·구조 선택·검증·커밋 결정은 [후속 기록](../records/2026-10-02-01-schedule-create-boundaries-and-verification.md)이 소유한다. 이전 미커밋 상태의 판단은 [앞선 기록](../records/2026-10-01-01-schedule-create-provisional-review.md)에 보존한다.

## 17 — Trip·Expense 직렬화 선행 조각 (당시 16)

- [Trip serializer](../../../../../apps/server/src/serializers/trip.ts): Trip DB row의 다섯 시간 값을 API ISO datetime 또는 null로 변환한다.
- [Expense serializer](../../../../../apps/server/src/serializers/expense.ts): Expense DB row의 날짜·receipt boolean·세 시간 값을 API entity 표현으로 변환한다.
- [Trip route](../../../../../apps/server/src/routes/trips.ts), [Expense route](../../../../../apps/server/src/routes/expenses.ts), [Sync route](../../../../../apps/server/src/routes/sync.ts): Trip 다섯 곳과 Expense 여섯 곳에서 같은 entity serializer를 사용한다.
- [Trip route 계약 검사](../../../../../apps/server/tests/routes/trips.response-contract.test.ts), [Expense route 계약 검사](../../../../../apps/server/tests/routes/expenses.response-contract.test.ts), [Sync 계약 검사](../../../../../apps/server/tests/routes/sync.response-contract.test.ts): 공통화 전후 CRUD·sync 응답의 기존 표현을 비교한다.
- [Trip serializer 단위 검사](../../../../../apps/server/tests/serializers/trip.test.ts), [Expense serializer 단위 검사](../../../../../apps/server/tests/serializers/expense.test.ts): 각 변환과 null·false 경계를 직접 검사한다.

이 결과는 사용자가 Ticket 05의 3번보다 먼저 실행하도록 선택한 [17번 Ticket(당시 16번)](../current/memory/tickets/17-server-data-route-boundaries.md)의 좁은 조각이며 `fd1db26`으로 저장됐다. response schema 중복, request·update 계약, 오류와 ownership은 이 조각에서 완료하지 않았다. 최종 server test 8개 파일의 25개 test, build와 정적 형식 검사의 상세·한계는 [실행 기록](../records/2026-09-14-02-trip-expense-serialization.md)이 소유한다. 번호 재배치는 새 제품 산출물이 아니다.

## Ticket 06 후속: 경비 초안·일정 연결과 날짜/시각 계약

- [경비 일정 선택](../../../../../apps/client/src/features/expense/expense-form/ExpenseScheduleField.tsx), [저장 안내](../../../../../apps/client/src/features/expense/expense-form/ExpenseSubmitActions.tsx), [오류 해석](../../../../../apps/client/src/features/expense/expense-form/submit-error.ts): 생성·수정이 공유하는 영역별 책임. `a8e60a7`.
- [공유 날짜/시각 기준](../../../../project/common/date-and-time.md), [시점 schema](../../../../../packages/schema/src/primitives/datetime.ts), [날짜 helper](../../../../../apps/client/src/shared/lib/datetime.ts): `4646752`·`d823b41`의 실제 계약과 호환 범위.
- [경비 생성 검증](../../../../../apps/client/tests/screens/create-expense-flow.test.tsx), [수정 검증](../../../../../apps/client/tests/features/edit/offline-values.test.tsx), [Local·입수 계약 검증](../../../../../apps/client/tests/entities/temporal-local-contracts.test.ts): 초안·연결·저장과 시간 경계의 회귀 근거.
- [세션 결정·검증·보류 기록](../records/2026-10-02-03-expense-time-decisions-and-verification.md): 선행 일정 작업과의 연결, 자동 검사·실앱·서버 DB 관찰의 차이, 삭제 실패·상세 재시도 보류와 남은 Ticket 범위.

이 산출물은 06 전체 완료나 후속 08·10·11·14·15·17의 모든 책임 완료를 뜻하지 않는다.
