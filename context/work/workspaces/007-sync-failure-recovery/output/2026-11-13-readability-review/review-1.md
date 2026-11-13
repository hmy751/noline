# 관점 1: 시각적 처리 구간 전수 검토

## 결론과 확인 범위

128/128파일, 현재 본문 24,287행을 실제로 읽었다. 생산75·검사/설정51·인접공유UI2 모두 포함한다. diff만 읽거나 대표 파일을 고른 검토가 아니다. 코드·테스트·문서·Git은 수정하지 않았고 테스트·앱·DB·네트워크 실행도 하지 않았다. 발견은 일곱 묶음이며 모두 같은 동작에서 가능한 표현 개선이다. 새로운 정책이나 기능 변경은 제안하지 않는다.

각 파일의 실제 주요 함수/판단·full 읽기·최종 유지/후보와 finding ID는 `coverage-1.json`에 있다. 초기 읽기 메모의 ‘후보’라는 말은 검토 중 관찰이며 최종 상태는 status/finding_ids/final_decision이다. 이하 위치는 frozen manifest와 같은 현재판의 1-based 행이다. ‘빈 줄 후보’ 표의 숫자는 해당 문장 **앞**에 구간 경계를 만들 위치다. 숫자열은 생략한 대표 예시가 아니라 이 관점에서 채택할 실익이 있다고 판단한 전체 위치다. 파일에 후보가 없으면 유지 판단을 남겼다.

문서 근거는 development/references/review.md, client/server/schema/ui 가이드, Personal development·code-expression 본문, Project data-lifecycle, Work007 Ticket09·07와 Work003 Ticket12 및 지정된 실행 합의·판단 정정 기록의 관련 절이다. 과거의 완료 판단과 새 코드를 정답으로 취급하지 않았다. 추가 범위 읽기는 실제 기계적 규약 확인을 위한 `.prettierrc.js`와 네 app/package ESLint 설정뿐이다. Project formatter의 printWidth는 120이다. Airbnb preset 신규 도입이나 저장소 전체 formatter 적용은 제안하지 않는다.

## V1 — 블록을 생략한 조건·반복 본문을 일관되게 감싼다

중요도: 작음. 수정할 때 본문의 실제 범위를 한눈에 확인하는 부담과, 같은 파일에서 guard만 다른 형태로 읽는 부담을 줄인다. 특히 `trip-lifecycle.test.ts`의 여러줄 insert를 가진 if/else와 recovery setup의 여러줄 cache 조작은 들여쓰기만으로 범위를 구별하고 있다. Personal의 중괄호 계약도 guard를 포함한다.

대안은 아래 모든 46개 본문에 `{}`를 붙이는 것이다. 조건, else 귀속, await, return/throw, 평가 횟수는 그대로 둔다. if를 합치거나 switch/새 helper로 바꾸지 않는다. 이 변경은 약 90줄의 세로 길이를 늘리는 대신 분기 범위를 고정하며 추가 탐색·인자·타입 비용은 없다. 같은 fixture table의 여러 if도 서로 배타적이라는 이유로 합치지 않는다.

| 파일 | 조건/반복 시작 행 |
| --- | --- |
| `apps/client/src/entities/trip/lib/trip-local.ts` | 131, 132, 136, 166, 167, 199, 229 |
| `apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts` | 24 |
| `apps/client/src/screens/ExpensesScreen.tsx` | 55 |
| `apps/client/src/screens/ScheduleScreen.tsx` | 85 |
| `apps/client/src/shared/services/offline-prep/router.ts` | 52, 57 |
| `apps/client/tests/entities/temporal-local-contracts.test.ts` | 496, 506, 507, 508, 509, 510, 511, 512, 513, 528, 537, 538, 539, 540, 554 |
| `apps/client/tests/entities/trip/trip-lifecycle.test.ts` | 262 |
| `apps/client/tests/features/edit/offline-values.test.tsx` | 224, 269, 272, 505 |
| `apps/client/tests/screens/auth-policy.test.tsx` | 233, 337 |
| `apps/client/tests/screens/expense-recovery.test.tsx` | 128 |
| `apps/client/tests/screens/read-query-consumers.test.tsx` | 506 |
| `apps/client/tests/screens/schedule-recovery.test.tsx` | 234, 299 |
| `apps/client/tests/shared/services/directions/route-cache.test.ts` | 257 |
| `apps/client/tests/shared/services/sync/query-refresh.test.ts` | 117 |
| `apps/server/src/routes/trips.ts` | 206, 207, 208, 209, 210 |

`trip-lifecycle.test.ts:262`는 같은 if의 then·else **두 본문**이므로 표의 행은 하나여도 두 개다. 단문 guard를 제거하거나 조기 반환을 새로 만드는 제안이 아니다.

## V2 — Local·동기화의 검사/효과/다음 책임을 빈 줄로 구별한다

중요도: 중간(이해·수정 부담). 현재 가장 밀집한 곳은 `clearTripCopiesInTransaction`, `applyConfirmedDeletionInTransaction`, `synchronizeLegacyHolds`다. 서버 본문 해제→자식 숨김→준비 ID 갱신, 자기 기록 숨김→연결 해제→큐별 폐기, 보류 수신→변경 통지→ACK 전송이 각각 별도 판단과 효과인데 구간 끝에서 곧바로 다음 선언/검사가 붙는다. 독자가 다음 줄까지 같은 분기의 상세인지 다시 찾아야 한다.

대안은 아래 경계에 빈 줄만 둔다. 예를 들어 cleanup109의 서버 본문 해제, 110의 자식 순회,116의 준비 ID 갱신을 같은 transaction 안의 세 구간으로 읽게 한다. confirmed-deletion97/101/107도 기록 숨김·일정 연결 해제·큐 읽기의 경계를 보여 준다. legacy-holds253/264/267은 받은 보류 저장·알림·미확인 ACK 읽기를 구별한다. engine169는 거절 해결의 내부 catch가 끝난 뒤 일반 실패 분류로 돌아오는 경계다.

| 파일 | 빈 줄을 둘 문장 행 |
| --- | --- |
| `apps/client/src/shared/services/sync/cleanup-job.ts` | 30, 109, 110, 116, 131, 134, 212, 232 |
| `apps/client/src/shared/services/sync/confirmed-deletion.ts` | 71, 75, 97, 101, 107, 126, 139, 163, 179 |
| `apps/client/src/shared/services/sync/engine.ts` | 169, 192, 357, 377, 399, 421, 459, 511, 517 |
| `apps/client/src/shared/services/sync/legacy-holds.ts` | 50, 56, 59, 101, 112, 117, 206, 221, 243, 248, 253, 264, 267, 293, 296 |
| `apps/client/src/shared/services/sync/server-state.ts` | 33, 57 |
| `apps/client/src/shared/services/sync/direct-deletion.ts` | 23 |
| `apps/client/src/shared/services/sync/direct-update-failure.ts` | 47 |
| `apps/client/src/shared/services/sync/queue.ts` | 275, 280, 287 |
| `apps/client/src/entities/expense/lib/expense-local.ts` | 121, 135 |
| `apps/client/src/entities/schedule/lib/schedule-local.ts` | 97, 109 |
| `apps/client/src/shared/services/offline-prep/router.ts` | 43, 45, 52, 53, 58 |
| `apps/client/src/shared/db/index.ts` | 65 |
| `apps/client/src/shared/services/auth/logout-service.ts` | 166 |

보존 조건: 같은 transaction/실행 큐 안에 남겨야 하며 행+queue 원자성, 서버확인본/표시 분리, 완료ID만 ACK, 정상 keep-local, 예외 rollback, 삭제 귀속·손상 원문 보호, 세션 재검사, 알림 시점과 best-effort 효과 순서는 바꾸지 않는다. 큐 추가와 행 쓰기가 하나의 확정이라는 사실은 유지된다. 함수를 쪼개지 않아 새 인자·타입·파일 이동은 없고 빈 줄 수만 늘어난다. 모든 await/return 앞에 무조건 빈 줄을 넣는 규칙으로 확대하지 않는다.

## V3 — 서버의 저장 검사·재전송 조회·자식 후처리와 세 pull 조회를 나눈다

중요도: 작음~중간. `entity-mutations.ts`의 텍스트 검사→날짜 검사→DB 숫자 cast는 실패 의미가 다르다. 생성 insert 직후 `let row`부터 재전송 조회가 시작되고, 삭제 row 결과를 받은 뒤 자식 연결/자식 삭제로 이어지지만 현재는 바로 붙어 있다. `sync.ts`는 길이가 큰 세 조회가 연속 선언으로 붙어 여행 메타데이터와 선택 자식의 적용 범위를 다시 따라가야 한다.

아래에 빈 줄을 둔다. entity-mutations339/435는 patch 준비 후 SQL 쓰기,402는 relation 오류 검사가 끝난 뒤 실제 patch 변경,490/541은 확정한 삭제 시각을 바탕으로 하는 자식 후처리다. sync70/83은 다음 table 조회의 시작,96은 수신 snapshot 결과 조립이다. 단순 helper 분리보다 원래 transaction의 순서가 잘 보이며 새 탐색·인자 비용이 없다.

| 파일 | 빈 줄을 둘 문장 행 |
| --- | --- |
| `apps/server/src/services/entity-mutations.ts` | 60, 63, 72, 75, 126, 207, 254, 339, 396, 402, 435, 490, 541 |
| `apps/server/src/routes/sync.ts` | 70, 83, 96 |
| `apps/server/src/services/legacy-update-holds.ts` | 19, 170 |
| `apps/server/src/routes/schedules.ts` | 43 |

보존 조건: 저장 가능성 검사를 삭제·병합 판정 전에 실행하는 순서, 부모→자식 잠금, 생성 충돌의 같은ID·같은소유자·같은여행 확인, replay200/새생성201, 새 표식 보존, 한 요청 단위 구버전 충돌 보류, repeatable-read snapshot/XID 안전 경계와 세 조회의 실행 순서는 그대로 둔다. 여기서 Promise.all이나 SQL 합치기를 제안하지 않는다.

## V4 — 복합 조건의 내부 묶음과 선택 우선순위를 여러 줄로 드러낸다

중요도: 작음. 아래는 길이 제한 위반을 수집한 목록이 아니다. `local`이 존재하는 전제와 소유자/여행 모순, UPDATE라는 전제와 JSON/객체/쓰기항목 없음의 세 사유, 서로 다른 source의 부모 ID 우선순위처럼 중첩된 의미를 한 줄에서 다시 파싱해야 하는 위치다.

| 파일 | 위치 | 구체 대안 |
| --- | --- | --- |
| `apps/client/src/shared/services/sync/confirmed-deletion.ts` | 66 | `local && (...)`의 안쪽에서 user 모순과 `(비여행 && tripId 존재 && 여행 모순)`을 각각 줄로 둔다. |
| `apps/client/src/shared/services/sync/direct-update-failure.ts` | 36 | `!hold || (...)` 내부의 table/record/trip/user 네 비교를 한 줄씩 정렬한다. hold 없음 허용을 유지한다. |
| `apps/client/src/shared/services/sync/reconcile.ts` | 297–300 | UPDATE 조건과 `!patch / 객체 아님 / immutable 외 항목 없음`의 OR 묶음을 안쪽 여러 줄로 나눈다. |
| `apps/client/src/shared/services/sync/engine.ts` | 388–389 | `trips ? task.recordId : string originalTripId ? originalTripId : savedTripId`를 여러줄 삼항으로 들여써 원본 우선→삭제 payload fallback을 보인다. |
| `apps/client/src/entities/trip/lib/trip-local.ts` | 158 | 서버 목록 부재·보호대상 아님·아직 숨기지 않음·요청 이후 변경 없음의 네 AND를 각각 줄로 나눈다. |
| `apps/client/src/shared/services/directions/route-plan.ts` | 34 | 누락 latitude/longitude와 범위 초과의 네 OR를 각각 줄로 두어 좌표 유효성 항목을 바로 찾게 한다. |

조건의 논리식·괄호 결합·short circuit·속성 접근 순서는 바꾸지 않는다. 새 predicate helper/boolean alias/인자/타입은 필요 없다. 이미 한 줄씩 나뉜 engine의 hasOwnedDelete, schema cityId 검증, legacy-holds의 소유 모순 묶음은 유지한다. 긴 regex·메시지 문자열·Tailwind class 문자열은 여러줄 조건처럼 다루지 않는다.

## V5 — 저장 schema와 검증 단계의 형식을 해당 의미 단위에 맞춘다

중요도: 작음. SQLite migration은 한 줄에 필드 3~4개가 있어 실제 schema.ts의 한 필드 한 줄 표현과 대조할 때 필드 위치를 다시 찾는다. `field-edits.ts`의 값+그 타입, 다음 값+그 타입, 두 domain의 편집 그룹도 빈 줄 없이 연속되어 선언의 묶음을 다시 판단해야 한다.

| 파일 | 위치 | 구체 대안 |
| --- | --- | --- |
| `apps/client/src/shared/db/migrations/field-edits.ts` | 15–19, 26–28 | 두 CREATE TABLE의 컬럼을 하나씩 개행한다. 특히171자 legacy_hold_acks 한 줄을 테이블 본문으로 편다. |
| `apps/client/src/shared/db/migrations/server-records.ts` | 7–11 | server_records 컬럼을 하나씩 개행한다. |
| `apps/server/sql/20261110-field-edits.sql` | 6,17,19 | 두 ALTER/CREATE TABLE/CREATE INDEX/COMMIT를 DDL 목적 단위로 띄운다. |
| `packages/schema/src/sync/field-edits.ts` | 14,16,21 | editStamp+EditStamp, fieldEdits+FieldEdits, 일정/경비 그룹 선언 사이를 띄운다. 값과 그 추론 타입은 붙여 둔다. |
| 같은 파일 | 70,73 | 시간/순번/동률 ID 검사의 독립 guard 경계를 띄운다. |
| `packages/schema/src/sync/storage-input.ts` | 30,67,104,120,123,126 | 문자열/객체 검사, null/type 검사, retained digits 상·하한, 텍스트날짜/금액/좌표/cityId의 독립 검사를 띄운다. |
| `packages/schema/src/responses/mutation-conflict.ts` | 55 | 일정과 경비의 공개 conflict schema 사이를 띄운다. |

컬럼명·순서·기본값·DDL 순서·migration의 기존 행/큐 보존·validator 조건·오류/허용 결과·wire export/type 계약은 그대로다. 빈 줄과 SQL 공백만 바뀐다. 새 type/helper/공통 formatter 도입은 없으며 SQL 템플릿의 바뀐 공백은 기존 실제 SQLite migration 검사로 확인 가능하다. schema export 사이의 한 줄은 실익이 작아 강제 정리 대상으로 올리지 않았다.

## V6 — 한 테스트 안에서 다음 사건을 시작할 때 기대값 묶음과 분리한다

중요도: 중간(검사 의도 이해 부담). 화면 전환·첫/다음 응답·실패 후 재시도·오프라인/온라인 변화가 한 테스트에서 여러 번 일어난다. 현재 일부는 앞 사건의 기대값 다음 줄에 다음 사건의 조작이 붙는다. 특히 offline-values의 과거폼/다음폼 저장, auth-policy의 9초→10초→늦은 관측, response-freshness의 두 ACK, reconciliation의 보류 ACK 실패/재시도는 사건 순서를 머리로 재구성하게 한다.

아래는 읽고 선별한 전체 사건 경계다. 각 행 앞에 빈 줄을 두면 된다. 실제 userEvent/act/mock 설정·Promise 해제/await 순서와 기대값은 바꾸지 않는다. 사례 이름을 붙인 작은 주석은 같은 테스트에서 사건이 많아 이름이 도움될 때만 고려하며 모든 단계에 AAA 주석을 추가할 필요는 없다.

| 파일 | 다음 사건을 시작할 행 |
| --- | --- |
| `apps/client/tests/application/trip-list-refresh.test.tsx` | 95, 109 |
| `apps/client/tests/entities/temporal-local-contracts.test.ts` | 241, 478 |
| `apps/client/tests/entities/trip/trip-lifecycle.test.ts` | 142, 157, 159, 185, 216 |
| `apps/client/tests/entities/update-query-refresh.test.ts` | 62, 73, 76, 188 |
| `apps/client/tests/features/edit/legacy-recovery.test.tsx` | 87, 98 |
| `apps/client/tests/features/edit/offline-values.test.tsx` | 177, 200, 229, 231, 283, 342, 378, 381, 464, 466, 535, 537, 588, 591, 623, 639, 642, 647, 659, 662, 732, 775, 780, 785, 800, 802, 860, 862, 899, 907, 911 |
| `apps/client/tests/features/edit/update-save-lifetime.test.tsx` | 175, 177, 224, 226, 228, 271, 307, 328, 330 |
| `apps/client/tests/screens/auth-policy.test.tsx` | 143, 162, 241, 246, 249, 267, 285, 303, 307, 309, 311, 360, 377 |
| `apps/client/tests/screens/expense-recovery.test.tsx` | 168, 197, 200, 211, 225, 233, 249 |
| `apps/client/tests/screens/read-query-consumers.test.tsx` | 269, 287, 305, 342, 355, 372, 400, 427, 438, 451 |
| `apps/client/tests/screens/schedule-recovery.test.tsx` | 307, 316, 363, 392, 397, 418, 420, 445, 447, 486, 517, 519, 569, 572, 586, 588, 593, 610, 662 |
| `apps/client/tests/screens/update-place-search.test.tsx` | 154, 173, 194 |
| `apps/client/tests/shared/components/map-route-freshness.test.tsx` | 71, 110 |
| `apps/client/tests/shared/db/transaction-serialization.test.ts` | 116 |
| `apps/client/tests/shared/diagnostics/sentry.test.ts` | 20, 36, 47, 55, 67, 89 |
| `apps/client/tests/shared/services/auth/orphaned-queue.test.ts` | 173, 179, 187 |
| `apps/client/tests/shared/services/directions/route-cache.test.ts` | 114, 117, 159, 174, 385 |
| `apps/client/tests/shared/services/edit-stamp.test.ts` | 39, 64 |
| `apps/client/tests/shared/services/offline-prep/trip-operation.test.ts` | 32 |
| `apps/client/tests/shared/services/sync/cleanup-lifecycle.test.ts` | 170, 181 |
| `apps/client/tests/shared/services/sync/deletion-storage-validation.test.ts` | 209 |
| `apps/client/tests/shared/services/sync/logout-sync.test.tsx` | 94, 294, 314 |
| `apps/client/tests/shared/services/sync/query-refresh.test.ts` | 126, 171, 189 |
| `apps/client/tests/shared/services/sync/reconciliation.test.ts` | 302, 377, 627, 631, 871, 894, 925 |
| `apps/client/tests/shared/services/sync/response-freshness.test.ts` | 178, 188, 194, 262, 265, 275, 291, 315, 357, 388, 393, 493, 585 |
| `apps/server/tests/integration/deletion-storage-validation.test.ts` | 152, 154, 157, 159, 169, 171 |
| `apps/server/tests/integration/field-edits-and-deletion.test.ts` | 152, 155, 178, 231, 263, 298, 349, 361, 363, 372, 376, 394, 403, 406, 436, 451, 453 |
| `apps/server/tests/integration/pull-cursor.test.ts` | 70 |

`temporal-local-contracts:241`은 삽입 경로로 전환, `trip-lifecycle:142/157/159`는 서버 목록 수신/수정 목록 수신/삭제로 전환, `update-query-refresh:73/76`은 옛 GET/새 GET 해제, `offline-values:775/780/785`는 B 폼 전환/B 제출/A 완료, `reconciliation:627/631`은 ACK 실패 주입/성공 재시도, `response-freshness:188/194`는 서로 다른 완료ID의 ACK, `pull-cursor:70`은 다음 cursor 요청 시작이다.

assert를 위한 `const saved`/`const segment` 같은 결과 해석, 같은 기대값을 반복하는 for, 조건별 기대값 분기, 순수 waitFor 확인은 현행처럼 같은 검사 묶음으로 유지했다. 214개 기계적 인접 전환을 그대로 채택하지 않았고 이 중 의미가 바뀌는 전환만 위 표에 남겼다. 테스트 길이나 이름을 줄이기 위해 공통 helper/fixture factory/parameter table을 새로 만들지는 않는다. 단문 await expect 두세 줄의 단일사건은 자동으로 빈 줄을 늘리지 않는다.

보존 조건: 동작 요구에서 나온 기대값, 실제 사용자 순차 입력과 강제 prop/응답 경계 주입의 차이, 두 동시 호출이 같은 act 안에 있는 검사, 오류 Promise 사전 관찰, finally 정리, SQLite/PG 실패 주입 시점은 그대로다. 비용은 테스트의 세로 길이이며 호출부·fixture·타입 탐색은 늘지 않는다.

## V7 — 나머지 화면/선언의 작은 구간 구분

중요도: 작음. 아래는 앞의 원자성·삭제 판단만큼 크지는 않지만 짧은 수정으로 다른 역할의 문장을 분리할 수 있는 위치다. 각 위치는 전체 본문을 읽고 현재 목적을 확인한 결과이며 전면 formatter의 산출물이 아니다.

| 파일 | 경계 행 |
| --- | --- |
| `apps/client/src/entities/expense/api/expenses.ts` | 20 |
| `apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts` | 25, 27, 54 |
| `apps/client/src/features/expense/update-expense/UpdateExpenseDrawer.tsx` | 86, 93 |
| `apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx` | 94 |
| `apps/client/src/features/sync-recovery/LegacyUpdateRecovery.tsx` | 81, 144, 162, 210 |
| `apps/client/src/screens/ExpensesScreen.tsx` | 56, 57, 123, 130 |
| `apps/client/src/screens/ScheduleScreen.tsx` | 86, 87, 134, 141 |
| `apps/client/src/entities/trip/lib/trip-local.ts` | 31, 66, 119, 200, 230, 296 |
| `apps/client/src/shared/services/directions/route-downloader.ts` | 69, 130, 173 |
| `apps/client/src/shared/diagnostics/sentry.ts` | 146, 154 |
| `apps/client/src/shared/db/utils.ts` | 17, 20 |
| `apps/client/tests/entities/repository/target-trip-routing.test.ts` | 151, 176, 192 |
| `apps/client/tests/entities/trip/trip-lifecycle.test.ts` | 325, 330 |
| `apps/client/tests/screens/read-query-consumers.test.tsx` | 274, 282, 290, 298, 310, 317, 348, 380, 391, 405, 413, 419, 433, 443 |
| `apps/client/tests/shared/services/sync/response-freshness.test.ts` | 226, 398, 423, 452, 609 |
| `apps/server/tests/integration/deletion-storage-validation.test.ts` | 144 |

화면/폼은 effect의 setup→cleanup 반환, 오류 초기화→변경 계산, 시간대/진행 guard→입력 준비→mutation 호출, policy 거절→drawer 열기의 경계다. route-downloader는 session 확인→현재 세그먼트 읽기와 두 독립 null/deleted 판정의 경계다. sentry146/154는 task tag 뒤 run tag와 stage tag 뒤 반복 실패 판단이다. 테스트 행은 각 독립 it/it.each 선언 사이의 빈 줄 부재다. 함수·effect·callback·React key·RHF isSubmitting·mount guard·성공 후 닫기·다운로드 시작 순서는 그대로 둔다. 추가 helper/props/타입은 필요 없으며 import/공유UI를 광범위 재배열하지 않는다.

## 유지한 형식과 자동 채택하지 않을 것

- reconcile의 본문 준비→서버 수락/저장→Local 판단/반영→해당 완료ID ACK는 각 목적이 실제로 달라 현행 구간을 유지한다. 코드가 길다는 이유로 단계 간 빈 줄을 지우거나 새로운 파일을 만들지 않는다. V4는 내부 조건 표현 한 곳의 국소 대안이다.
- create/delete/update data hook의 옵션·Promise.all 배열, repository update의 세 인자와 async catch는 함께 읽는 단위가 명확하다. 별도 함수를 만들지 않는다. API의 짧은 HTTP→parse→반환, 단순 값 변환의 const→return도 일괄 개행하지 않는다.
- MapboxScheduleMapView의 route 계산/카메라/marker/프로필 JSX와 Update Drawer의 필드별 Controller는 기존 구간으로 찾을 수 있다. JSX 줄 길이 때문에 UI 부품을 추출하지 않는다.
- packages/ui Drawer·Pressable 2개는 전체 계약과 실제 disabled/닫기/스크롤 연결을 읽었고 현행 형식을 유지한다. 다른 작업이 섞인 인접공유UI이므로 이번 자동 수정 후보가 없다. Pressable의 cva 첫 인자 줄바꿈은 기계적 취향 차이에 가까워 보고 후보로 채택하지 않았다.
- sanitizer 정규식, schema의 enum/필드 배열, route-plan의 좌표 JSON 배열은 한 의미로 함께 읽는 것이 맞다. 긴 패턴을 분리·연결하는 새 코드나 이름을 만들지 않는다.
- sync/api.ts의 긴 5xx 조건 끝 주석, schema/index.ts sync export 중간 빈 줄, 각종 짧은 prepared/observe 반환 앞 간격, 짧은 promise 직렬화 내부의 모든 assert/await/return 분리 후보는 이득보다 세로 길이/기계적 변경 비용이 커 현행 유지다.

## 검토 한계와 후속 검증

관점1은 시각적 처리 구간을 전수 읽은 결과이며 나머지 다섯 관점의 대안을 대신하지 않는다. 새로운 제품 버그를 검증·판정하지 않았다. 128파일 중 읽지 않은 파일이나 미확인 구간은 없다. 범위 밖 호출자의 전체 구현·운영 계정·기기 UI·네트워크·실제 DB·실행 검사는 이번 범위 밖이며 수행하지 않았다.

수정자는 JSX/TS의 whitespace·괄호·중괄호만 바뀌었는지 AST/타입/lint로 확인하고, SQL 공백을 바꾸면 기존 migration 검사를 선택하면 된다. 특히 V4는 논리식을 고치지 않아야 하며 V6는 act와 await의 범위를 바꾸지 않아야 한다. 기계적 차이가 아닌 동작 변경이 섞이면 그 변경에 맞는 검증을 별도로 판단해야 한다. 이 보고서가 그 실행 검증을 대신하지 않는다.

현재 파일과 frozen manifest SHA256 대조: 128개 중 차이 0개. 차이 경로: [].
