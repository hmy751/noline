# 관점 6 — 변경 이유와 영향 범위를 찾기 쉬운가

범위 128파일(생산 75, 검사·설정 51, 인접 UI 2)의 현재 본문을 전부 읽었다. diff 일부나 대표 파일로 대체하지 않았다. 함수·타입·콜백·공유 그룹·호출자·검사 기대의 연결을 확인했고, 파일별 실제 확인 단위·판단·읽기 범위·판본 SHA256은 `coverage-6.json`에 남겼다. 미확인 파일은 없다. 제품·검사·정본·Git은 수정하지 않았고 검사 실행·설치·앱/DB 실행도 하지 않았다. 따라서 이 보고는 동작 검증 완료나 제품 결함 판정이 아니다.

독립적으로 실제 코드와 review brief, review.md, 각 app/package guide, Personal의 공통 개발/코드표현/공통경계/계약·수명 기준, Project 데이터 수명·API 기준, Ticket 007-09·007-07·003-12와 지정된 세 기록을 대조했다. 다른 관점의 보고서와 Main의 채택 판단은 읽지 않았다. 이전 기록의 해석·완료를 이번 적합성의 근거로 삼지 않았다.

## 채택할 실익이 분명한 후보

### R6-01 — 같은 일정 표시행 타입을 파일 안에서 한 번만 정의한다

- 위치: `apps/client/src/screens/ScheduleScreen.tsx:28`, `:56`, `:104`.
- 관찰: `ScheduleByDate.schedules`의 원소, `selectedSchedule`의 state, `handleScheduleMenuPress`의 입력이 같은 13필드 구조를 각각 수기로 선언한다. 목록 → 메뉴 → 수정창이 같은 표시행을 전달하는 하나의 내부 계약인데, 필드의 선택성·좌표·화면 전용 값을 바꾸려면 세 구조가 의도적으로 다른지 독자가 다시 비교해야 한다. 실제로 같은 구조이므로 겉모양만 비슷한 독립 타입이 아니다.
- 대안: 현재 파일에 `type ScheduleListItem = { ... }` 한 개를 두고 세 위치가 이를 사용한다. 또는 기존 구조를 유지하고 `type ScheduleListItem = ScheduleByDate['schedules'][number]`를 두어 state/handler만 재사용한다. 전자는 표시행이 더 직접적이고 후자는 이동량이 작다. domain `Schedule` 전체를 화면 타입으로 대체하거나 새 공용 파일을 만들 필요는 없다.
- 보존: `scheduledAt` 원본과 `time` 표시값을 구별하고 `address/latitude/longitude`의 현재 optional·null 허용을 그대로 둔다. `expense/expenseCount`를 이번에 지우지 않는다. state 수명·정책·메뉴/수정창 mapping·함수 순서는 바꾸지 않는다.
- 이득/비용: 한 필드 계약의 수정 지점이 하나가 된다. 파일 내부 이름 하나의 탐색 비용만 생기고 새 인자·런타임 분기·계층은 없다. 낮은 비용의 제품 코드 정리로 추천한다.
- 적용·확인 범위: 이 파일 한 곳. 기존 schedule-recovery, read-query-consumers, auth-policy의 의미와 타입 검사를 이용하면 된다. 이 제안 자체를 위한 새 테스트는 불필요하다.

### R6-02 — 남아 있는 세 SQLite 검사 adapter를 이미 존재하는 helper로 모은다

- 위치: `apps/client/tests/entities/temporal-local-contracts.test.ts:60`(adapter `:93`), `apps/client/tests/entities/trip/trip-lifecycle.test.ts:28`(adapter `:57`), `apps/client/tests/shared/db/transaction-serialization.test.ts:10`(adapter `:35`). 기존 원천은 범위 밖의 `apps/client/tests/helpers/sqlite.ts:30`이다.
- 관찰: 세 파일이 `TestDatabase`, `TestStatement`, `mockReadRows`, `expo-sqlite`의 `openDatabaseSync/prepareSync/executeForRawResultSync/executeSync`를 거의 동일하게 복제한다. 이 코드는 각 테스트의 여행·시각·트랜잭션 요구가 아니라 Node SQLite 결과를 Expo/Drizzle의 동기 배열 형식에 맞추는 하나의 기반 책임이다. 이미 auth/local-access, orphaned-queue, route-cache, reconciliation, response-freshness, save-submission 등은 기존 helper를 소비한다. Node의 `setReturnArrays` 유무나 결과 표현이 바뀌면 같은 수정을 여러 곳에서 해야 한다.
- 대안: 세 파일의 `jest.mock('expo-sqlite', ...)`에서 각 상대 경로의 `createExpoSQLiteDatabase()`를 `jest.requireActual`로 호출한다. 해당 interface·mockReadRows·adapter 본문만 삭제한다. 새 helper·옵션·전역 setup은 만들지 않는다.
- 보존: 각 mock factory의 최초 호출마다 별도 `:memory:` DB를 만들고, DB 초기화/리셋 수명은 그대로 둔다. `getAllSync`의 named rows, Drizzle raw result의 배열 순서, `getFirstSync`의 null, DML `changes/lastInsertRowId`를 유지한다. 이 세 adapter에는 FK ON 확장이 없으므로 route-cache의 `PRAGMA foreign_keys = ON`을 기본값으로 올리면 안 된다. SecureStore/ID/query mock과 fixture·실패주입은 각 파일에 남긴다.
- 비용 대조: helper는 optional `setReturnArrays` 뒤 반환값이 이미 배열인지도 검사한다. 현재 복제는 해당 메서드가 있으면 배열임을 단언한다. 새 기능이 아니라 같은 native 대역 책임의 더 넓은 호환 표현이지만, 세 suite의 실제 SQL/rollback 결과가 동일한지 확인해야 한다. 단순 줄 수 감소만으로 동등하다고 선언하지 않는다.
- 이득/비용: adapter 변경 이유와 파급을 한 기존 모듈로 모은다. 테스트당 한 번의 기존 helper 탐색 외 새 추상화 비용이 없다. 이 범위의 테스트 기반 정리로 추천한다.
- 적용·확인 범위: 위 세 파일과 기존 helper의 계약 대조. 이번에는 helper 변경이나 범위 밖 `auth/local-preservation.test.ts`까지 자동 확대할 필요가 없다. 후자에도 같은 복제가 검색되지만 별도 작업 범위다. 이 의견은 그 파일 전체를 검토했다는 주장이 아니다.

## 더 작은 후보 — 비용에 따라 선택

### R6-03 — 이미 공유하는 서버 응답 fixture와 같은 복제를 연결한다

- 위치: `apps/server/tests/routes/schedules.response-contract.test.ts:19`(상수·trip/expense/schedule rows), `apps/server/tests/routes/replay.idempotency.test.ts:25`(scheduleRow/serializedSchedule). 기존 원천은 `apps/server/tests/fixtures/data-rows.ts`.
- 관찰: Expense·Trip 응답 검사와 replay의 Expense는 이미 data-rows를 사용한다. Schedule 응답 검사만 같은 ID·생성/수정시각·Expense row·직렬화 기대값을 다시 선언하고, Schedule row·직렬화는 replay와 복제한다. Date 저장값 → ISO/date-only/boolean 기대값이라는 같은 검사 기반 계약이 분산되어 있다.
- 대안: 기존 data-rows의 ID/시간/Expense fixture를 Schedule 응답 검사에서도 사용한다. 필요하면 같은 파일에 `SCHEDULED_AT`, `scheduleRow`, `serializedSchedule`만 추가해 두 테스트가 사용한다. case의 `setSelectResults` 순서와 실패 입력은 그대로 둔다. 새 fixture factory나 범용 builder는 필요 없다.
- 보존·주의: Schedule 응답 검사의 Trip fixture는 `timeZone: null`이고 기존 공유 tripRow는 `Asia/Seoul`이다. 단순 import로 바꾸면 기대 조건이 달라진다. `{ ...sharedTripRow, timeZone: null }`로 로컬 차이를 명시하거나 이 fixture만 유지한다. fieldEdits 부재·nullable deletedAt·Date 객체 및 HTTP 직렬화 기대는 그대로 둔다. 기대값을 실제 serializer 호출로 만들어 독립 검사를 없애면 안 된다.
- 이득/비용: 세 응답 fixture에 대한 변경 이유와 실제 지원 표현을 기존 위치에서 찾을 수 있다. 대신 fixture 파일로 한 번 이동해야 하고 공용 export 두세 개가 늘어난다. adapter보다 우선순위가 낮지만 기존 fixture 체계와 일치하는 정리다. 대상 2파일+기존 fixture이며 route 계약 suite로 보존을 확인한다.

### R6-04 — reconciliation 검사를 같은 파일 안에서 책임별로 가까이 둔다

- 위치: `apps/client/tests/shared/services/sync/reconciliation.test.ts:144` 이후 전체, 특히 보류 fixture `:596`과 직접 보류 수신·ACK 사례 사이의 삭제 응답 분류 사례 `:673` 부근.
- 관찰: pending 표시/완료 ACK, 삭제 증거에 따른 관련 요청 종결, `synchronizeLegacyHolds/clearLegacyHold`의 보류 수명이 한 전역 it 나열에 섞여 있다. 예를 들어 보류 목록·중복 정리 이후 삭제 응답의 실패 단계 사례가 끼고 다시 보류 재수신·ACK가 이어진다. 보류 수신 방식 하나를 바꿀 때 같은 계약의 검사를 한 구획에서 찾기 어렵다.
- 대안: 새 파일·fixture 공유 없이 같은 파일의 `describe('서버 수신과 남은 FIFO 표시')`, `describe('확정 삭제와 요청 종결')`, `describe('구버전 보류 수신과 명시적 확인')` 정도로 관련 사례를 인접시킨다. 이름은 예시이며 규격이 아니다. 통합 시나리오는 그 시나리오의 인과를 그대로 유지한다.
- 보존: 공통 beforeEach의 mock reset/DB 초기화 순서를 건드리지 않고, describe 전용 hook을 새로 만들지 않는다. 서버원본·Local·ACK 원자성, raw404/확인410, completedTaskId/confirmedTaskId, 모든 raw payload·손상·격리 입력, 진단단계 기대값을 유지한다.
- 이득/비용: 영향받은 계약 검사를 찾는 시간이 줄지만 테스트 이동량이 커 diff 소음이 생긴다. filename 분리보다 연결 비용이 작다. 지금 작은 제품 정리가 우선이라면 보류할 수 있는 선택 후보다. 현행이 기능적으로 잘못됐다는 주장은 아니다.

### R6-05 — 사용하지 않는 활성화 반환 shape를 검사 helper에서 약속하지 않는다

- 위치: `apps/client/tests/shared/services/sync/save-submission.test.ts:123`.
- 관찰: `activateTripForTest`의 mock options 단언은 `Promise<{ schedules: unknown[]; expenses: unknown[] }>`를 쓰지만 실제 useActivateTrip의 mutationFn은 `{tripId, alreadyActivated}`를 반환한다. 두 호출부는 활성화의 완료만 기다리며 배열을 읽지 않는다. 소비자가 없는 옛 반환 계약이 검사 helper에 남아 현재 변경 범위를 오해하게 한다.
- 대안: 이 helper의 반환 단언을 `Promise<unknown>` 또는 현재 `{tripId: string; alreadyActivated: boolean}`로 바꾼다. 수신 목록을 돌려받게 제품을 다시 바꾸지 않는다. 이 helper에서 실제 사용하는 완료 범위만 남기는 `unknown`이 가장 작다.
- 보존·비용: 반환값을 사용하지 않는 두 호출과 실제 DB/queue 기대는 동일하다. 새 런타임·함수·공유 타입 없이 단언 한 곳만 바뀐다. 독립적인 작은 정정으로 채택 가능하며 기존 save-submission 검사로 충분하다.

## 유지가 더 적절한 주요 선택

### K6-01 — 직접 수정 실패와 sync 거절을 하나의 handler로 합치지 않는다

`direct-update-failure.ts`와 `engine.ts:resolveRejectedMutation`은 409/410을 읽는 모습이 비슷하지만 맡긴 완료가 다르다. 직접 수정은 화면에 오류를 전달하면서 이전 입력을 보관하거나 검증·기기 반영된 삭제를 `ConfirmedDeletionError`로 전달한다. engine은 해당 task를 FIFO에서 종결/보존하고 다음 작업 진행·FAILED·진단단계를 책임진다. engine의 `confirmedTaskId`는 해당 입력의 서버 저장검사 증거이고 성공 2xx의 `completedTaskId`는 호출자가 ACK할 요청이다. 둘을 공통 callback/옵션으로 묶으면 이 차이를 더 많은 인자·transaction 조율로 전달해야 한다. 공통 효과인 삭제 반영과 보류 저장은 이미 각 service에 모여 있다. 소유권/여행/세션 검사·Date guard의 실패분류를 짧게 만들기 위해 삭제하지 않는다.

### K6-02 — 일정과 경비의 CRUD·폼·서버 mutation을 모양만으로 합치지 않는다

일정은 시각 원본·좌표 저장변환·인접 경로 준비, 경비는 달력날짜 호환·금액통화·선택 일정 연결이 바뀌는 이유다. `useUpdate*`의 실패 후 갱신과 성공 경로 갱신 조건, 화면 문구/Alert/inline error, 관계삭제의 파급도 다르다. 서버의 `create/updateSchedule/Expense`는 같은 부모 잠금 순서를 공유하되 storage cast·관계 해제·DB 표현·원문 보류가 다르다. 기존 `mergeEdit`, 그룹 정의, serializer와 `deleteEntity`가 실제 같은 책임을 이미 공유한다. 새 generic CRUD/폼/Repository 계층은 변경 이유를 모으기보다 옵션과 타입 비용을 늘린다. entity-mutations를 길이만으로 entity별 파일로 찢으면 부모 잠금·삭제/관계 규칙을 비교할 때 탐색이 늘어난다.

### K6-03 — ConfirmedDeletionError 위치의 어색함만으로 이번에 파일을 늘리지 않는다

`edit-stamp/errors.ts`의 두 클래스는 변경 이유가 완전히 같지는 않다. 다만 삭제 클래스를 `confirmed-deletion.ts`나 `direct-update-failure.ts`로 옮기면 UI가 DB/transport 구현을 import하고, 새 `sync/errors.ts` leaf로 옮기면 한 클래스 때문에 공개 파일·소비자 imports가 늘어난다. 현재 클래스 이름과 주석은 확인된 효과를 정확히 말하고 실제 생성자·UI·검사 소비자도 작다. 기능상 공통화가 필요한 곳이 없어 이번 자동 채택 후보에서 제외한다. 오류 종류가 늘어나거나 이미 별도 sync 오류 leaf가 생길 때 다시 볼 수 있다.

### K6-04 — 비슷한 직렬화·필터·검증도 근거가 다르면 구별한다

- `edit-stamp`의 clock 발급은 time/sequence를 관측하고 늘리는 책임이고 `compareEdits`의 fixed ID tie는 서버 승패 책임이다. 같은 comparator로 묶을 필요가 없다.
- 진단 producer의 Signal/SyncFailure와 전송 allowlist는 생성 가능한 값과 기기 밖으로 보낼 값을 각각 검증한다. 필터를 producer 타입만 신뢰하게 만들지 않는다.
- raw queue 투영은 유효한 request만 남기는 검증이 아니다. `reconcile.projectPendingChanges`와 서버 request/schema/storage 판정을 같은 정상화 helper로 합치면 손상·구버전 입력 보존이 무너진다.
- route downloader의 직렬화는 Directions 대기 중 일정 저장/DB를 막지 않아야 하며 `withTripOperation`의 활성화↔저장 수명과 다르다. map/profile/좌표 동일성은 이미 route-plan으로 모였다.
- active copy cleanup, 사용자 soft delete, vacuum, 계정 종료는 보존·폐기 권한이 다르다. 모든 pending predicate나 삭제 routine을 하나로 합치지 않는다.
- server SQL 저장가능 판정과 기기의 보수적 일괄 폐기 증명은 보장 범위가 다르다. numeric NaN·지수·Unicode·날짜의 shared helper/DB cast 조합을 지우지 않는다.

범위 밖 추가 원자료는 기존 SQLite helper, 서버 fixture 원천과 세 serializer만 읽었다. helper 재사용 가능성, 로컬 null timeZone 차이, 동일 물리변환 책임을 확인하기 위한 읽기이며 수정 범위 승인으로 해석하지 않았다. 인접 UI Drawer/Pressable는 다른 변경이 섞인 파일로, domain-free primitive 계약과 실제 폼 호출만 대조했으며 이번 자동 변경을 제안하지 않는다.
