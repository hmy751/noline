# 서버·검사 표현 정리 구현 결과

기준은 Main의 `visual-stage/` 사본이며, 배정한 9 finding을 아래처럼 반영했다. 기능·정책·공유 wire 계약은 변경하지 않았다. 다른 담당의 파일과 기존 미커밋 변경은 되돌리지 않았다.

## 반영 결과

- F2-05: `entity-mutations.ts`에서 create/update/delete 공개 작업을 앞에, `mergeEdit`와 private helper를 뒤에 배치했다. 타입/import는 앞에 유지했다. helper는 모듈 초기화 중 호출되지 않으며 route callback·검사 실행과 mutation callback에서만 사용된다.
- M3-03: `mergeEdit`의 내부 `hasChanges`와 반환 `changed`를 `requiresWrite`로 바꾸고 두 update 소비부를 연결했다. 같은 값의 새 표식도 쓰기를 요구하는 조건과 version/updatedAt/fieldEdits 저장은 그대로다.
- M3-09: `refreshAndListLegacyUpdates`로 개명하고 실제 route import/call을 연결했다. 최신 소유 행으로 갱신하면서 확정 삭제에 속한 보류도 정리한다는 주석을 붙였다. transaction·잠금·ACK 재조회·hold 정리 본문은 그대로다.
- M3-14: 공유 Expense/Schedule 및 공개 index의 DB 1:1 표현을 공유 domain/API 표현과 서버 serializer·Local 저장조회 변환 경계로 정정했다. 주석 외 AST 차이 없음.
- R5-08: `lockOwnedTrip`은 성공 undefined/실패 MutationResult를 반환한다. 5개 호출부는 `parentError`를 검사한다. 부모 SELECT·소유권 조건·`for('update')`·404/410 proof와 호출 순서를 유지했다.
- R5-09: Trip POST의 미사용 userId와 schema 뒤 도달 불가능한 NaN 검사를 제거했다. PUT의 도달 불가능한 null/NaN 분기를 제거하고 각 날짜를 한 번만 변환한다. isoDateTime의 string datetime/유한 Date.parse 검증과 optional-only update를 직접 대조했다. 날짜 범위·시간대 조합 검증, 부분 요청과 기존 행 결합, ownership/version/serializer는 유지했다.
- R6-02: 지정 client 3 suite의 복제 SQLite interface/row adapter만 제거하고 각 `openDatabaseSync` 호출에서 기존 `createExpoSQLiteDatabase`를 사용한다. suite별 DB 초기화·reset·실패주입·mock·기대값은 유지했다. helper를 수정하거나 FK 설정을 추가하지 않았다.
- R6-03: 기존 `data-rows.ts`에 SCHEDULED_AT·scheduleRow·serializedSchedule을 추가하고 Schedule response/replay 두 검사를 연결했다. Schedule response의 tripRow는 `{ ...sharedTripRow, timeZone: null }`을 명시했다. 기대값은 직접 적은 값을 공유하며 serializer로 생성하지 않는다.

B 담당의 `hasProtectedLocalTrips` 개명과 관련해 trip-lifecycle에는 이전 이름 mock/참조가 없고 실제 refresh 호출만 존재한다. 별도 수정은 필요하지 않았으며 해당 suite 통과로 연결을 확인했다.

## 자기 확인과 검증

- server: `apps/server`에서 `node ../../node_modules/typescript/bin/tsc --noEmit` 통과. 로그 `server-tests-typecheck.log`.
- client: 지정 3 suite 합계 70개 통과. 로그 `server-tests-client.log`.
- 구조 비교: TypeScript AST로 entity-mutations의 모든 선언을 이름 단위로 대조했다. 채택한 changed/requiresWrite 및 parentError 개명을 정규화하면 lockOwnedTrip 외 선언 본문이 모두 동일하고 선언 집합도 동일하다. lockOwnedTrip은 직접 SELECT/잠금/분기와 반환 변환을 대조했다.
- schema: 3파일의 주석 제거 후 AST가 visual-stage와 동일하다.
- fixture: 별도 VM에서 옛 Schedule response fixture와 현재 공유 fixture+timeZone:null override를 JSON 값으로 대조해 동일함을 확인했다. replay의 옛 scheduleRow/serializedSchedule도 현재 공유 값과 동일하다(Date의 ISO 직렬화 포함).
- `listLegacyUpdates`, `merged.changed`, `hasChanges`의 이전 참조가 server source/tests에 남지 않음을 검색했다. legacy service/route는 이름·주석 외 diff가 없다.
- server HTTP 회귀는 로컬 포트 권한이 필요한 Main 통합 실행으로 넘긴다. 관련 범위: field-edits-and-deletion, legacy-holds, trips/schedules response-contract, replay.idempotency. 타입/전후 대조만으로 HTTP 통과를 주장하지 않는다.

## 변경 파일

- apps/server/src/services/entity-mutations.ts
- apps/server/src/services/legacy-update-holds.ts
- apps/server/src/routes/legacy-holds.ts
- apps/server/src/routes/trips.ts
- apps/server/tests/fixtures/data-rows.ts
- apps/server/tests/routes/schedules.response-contract.test.ts
- apps/server/tests/routes/replay.idempotency.test.ts
- packages/schema/src/entities/expense.ts
- packages/schema/src/entities/schedule.ts
- packages/schema/src/index.ts
- apps/client/tests/entities/temporal-local-contracts.test.ts
- apps/client/tests/entities/trip/trip-lifecycle.test.ts
- apps/client/tests/shared/db/transaction-serialization.test.ts

13파일 변경. 새 공개 타입/범용 helper/fixture factory는 추가하지 않았다. 남은 제품 변경·합의 결정은 없으며 server 통합 검사가 남았다. formatter 전체 실행·commit/stage/install/network/app 실행은 하지 않았다.
