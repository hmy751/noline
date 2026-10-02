# 날짜와 시각의 데이터 의미

저장·전송 필드가 한 시점을 나타내는지 달력 날짜만 나타내는지 판단할 때 읽는다. 이 본문은 이 주제의 현재 Project 기준을 소유한다. 기존 [Time context](../../../.claude/context/time.md)는 구현 helper와 이전 경로를 연결하는 호환 진입점으로 남는다.

## 필드의 의미를 먼저 구별한다

한 시점을 나타내는 값은 timezone을 포함한 ISO 8601 datetime으로 저장하고 전송한다. Schedule의 `scheduledAt`, entity의 `createdAt`·`updatedAt`·`deletedAt`, 동기화 기준 시각이 여기에 해당한다. 화면 표시를 위해 만든 locale 문자열을 저장하거나 전송하지 않는다.

Expense `date`는 경비가 속하는 달력 날짜이며 `YYYY-MM-DD`로 입력·전송·표시한다. 일정의 `scheduledAt`과 독립적이며 기기 시간대가 바뀌어도 날짜를 이동시키지 않는다. 생성·수정 시각과 구분하며, 결제일·사용일 중 무엇을 의미하는지는 이 저장 계약으로 새로 정하지 않는다. 기존 datetime 호환과 서버의 물리 저장 표현은 아래 기준을 따른다.

## Schedule 응답의 시간 계약

PostgreSQL Schedule row는 `Date` 값을 사용하고 API Schedule entity는 timezone offset이 있는 문자열을 요구한다. [Schedule serializer](../../../apps/server/src/serializers/schedule.ts)가 `scheduledAt`, `createdAt`, `updatedAt`, nullable `deletedAt`을 ISO 문자열로 바꾼다. 생성·전체 목록·단건·수정·Trip 하위 목록·Trip activation·sync pull의 일곱 응답 경로가 같은 serializer를 사용한다.

이 공통성은 시간 변환 책임에만 적용한다. 각 endpoint의 envelope schema, 조회·소유권·soft-delete와 오류 처리는 route가 맡는다. 자세한 변경 기준은 [API 계약과 변경 가이드](../guidance/api-contracts.md)에 있다.

## Expense 날짜 규칙과 적용 경계

날짜 규칙은 [공유 schema](../../../packages/schema/src/entities/expense.ts)의 `expenseDate`와 [공유 입력 schema](../../../packages/schema/src/requests/expense.ts)의 `expenseDateInput`이 소유한다. `expenseDate`는 실제 달력에 존재하는 `YYYY-MM-DD`를 검사한다. `expenseDateInput`은 여기에 기존 offset 포함 datetime을 호환 입력으로 허용하고, 기존 서버 serializer와 같은 UTC 날짜로 정리한다. 예를 들어 `2026-10-02T01:00:00+09:00`는 `2026-10-01`이다. 시간대 없는 datetime과 잘못된 날짜는 거부한다. date-only는 그대로 통과하므로 반복 적용해도 값이 바뀌지 않는다.

- 생성·수정 폼은 날짜 선택값을 그대로 보관한다. 새 경비의 기본 날짜는 기기의 오늘이다. 생성 navigation의 기존 datetime 입력은 폼 진입에서 호환 처리하고, 잘못된 값이면 날짜를 다시 선택하게 한다. 수정 폼은 앱 데이터의 date-only를 받고, 처음 연 값과 최종 날짜가 다를 때만 요청에 날짜를 포함한다. 날짜를 바꿨다가 되돌리거나 제목만 바꾸면 기존 저장값을 재작성하지 않는다.
- [Expense Repository](../../../apps/client/src/entities/expense/repository/expense-repository.ts)는 create/update 요청을 공유 스키마로 검사한 뒤 Activation Router에 전달한다. 따라서 Local/Remote가 같은 날짜 값을 받는다. 날짜가 없는 부분 수정에는 날짜를 추가하지 않는다.
- Local datasource는 전달받은 날짜를 DB text와 sync_queue에 같은 transaction으로 저장한다. 세 목록·단건 조회와 생성·수정 반환은 같은 Local row 변환으로 기존 datetime을 date-only로 읽는다. 기존 DB 행이나 큐를 일괄 수정하지는 않는다. 수정·삭제의 존재·접근 확인은 날짜 해석과 분리해 잘못된 날짜 행도 교정·삭제할 수 있다. 생성·수정 결과의 날짜 검사는 commit 전에 수행하며, 실패하면 행 변경과 큐 기록을 함께 롤백한다.
- [서버 요청 경계](../../../apps/server/src/routes/expenses.ts)도 같은 create/update 스키마를 적용한다. 동기화 engine이 entity HTTP adapter를 거치지 않고 REST endpoint로 보내는 기존 datetime 큐도 여기서 수용한다. HTTP adapter에 별도 날짜 변환은 두지 않는다.
- [server DB](../../../apps/server/src/db/schema.ts)의 timestamp 저장은 유지한다. 새로 전달된 date-only는 UTC 자정으로 저장하고, [기존 serializer](../../../apps/server/src/serializers/expense.ts)가 UTC 날짜를 응답한다. serializer는 요청 검사·입력 변환을 맡지 않는다.
- 경비 목록의 날짜 묶기·상세·수정 폼·연결 일정의 초기 탐색은 데이터 경계에서 정리된 날짜를 그대로 사용한다. 조회 변환 실패는 Query 오류로 전달하고 화면 렌더에서 호환 검사를 반복하지 않는다. 경비 날짜에 `formatISOToLocalDate`를 적용하지 않는다. 연결 후보인 Schedule의 날짜·시간은 실제 시각이므로 기존 현지 시간 표시를 유지한다.
- Trip activation과 sync pull은 경비 배열을 공유 `expenseEntity`로 검사한 뒤 Local 저장을 시작한다. 서버 입수 값은 date-only를 요구하며, legacy datetime 허용은 기존 Local 행·요청 입력·큐의 호환에 한정한다. 이 경비 검사를 activation/pull의 전체 응답 검증 완료로 확대하지 않는다. Trip·Schedule·envelope·serverTime의 기존 검사 차이는 별도로 남아 있다.

경비 화면의 여행 날짜 범위는 기존 Trip timestamp의 UTC 날짜 기준을 유지하면서 UTC 일자로 순회해 DST의 중복·누락을 피한다. 이는 Trip 전체의 현지 날짜 표시·편집·주요 여행 선택 의미나 Schedule 화면의 범위 순회까지 통일한 변경은 아니다.

2026-09-14의 서버 직렬화 작업은 DB row → 응답 표현을 통일했다. 당시 폼의 datetime과 수정 요청의 date-only 불일치는 그대로 남아 있었다. 이후 직접 수정 API에만 둔 보정도 Local 동기화에는 적용되지 않았다. 사용자가 공유 규칙과 저장 전 경계의 일관성을 요청해 위 책임 배치를 채택했다. [선택과 호환 범위](../../../.claude/decisions/2026-10-02-expense-date-boundaries.md)에 근거를 남긴다.

기존 datetime을 원래 사용자가 어느 현지 날짜로 의도했는지 역추정하지 않는다. 호환은 기존 서버 응답의 UTC 날짜를 보존하며, 이전에 잘못 저장된 날짜의 복원이나 DB column migration은 별도 작업이다.

Trip의 `startDate`·`endDate`는 현재 공유 schema와 저장 경계에서 ISO datetime으로 다루지만 UI에서는 여행의 시작일·종료일로 사용한다. 이 편입은 Ticket 01~05에 필요한 경계만 대조했으므로, Trip 날짜가 장기적으로 달력 날짜인지 한 시점인지까지 새로 결정하지 않는다. 해당 의미를 바꾸는 작업에서는 Trip form·주요 여행 선택 계산·두 DB와 API를 별도로 대조한다.

## 적용과 재확인

새 필드나 변환을 만들 때에는 이름에 `date`가 있다는 이유로 표현을 고르지 말고, 그 값이 한 시점인지 달력 날짜인지 먼저 정한다. datetime은 shared helper와 offset-aware schema를 사용하고, date-only는 timezone 변환으로 날짜가 이동하지 않는지 request·DB·response를 함께 확인한다.

Schedule의 일곱 소비 경로, Expense form·request·entity·두 DB와 serializer 중 하나가 바뀌면 이 본문의 사실 범위를 다시 대조한다. 관련 근거는 Workspace 002의 [Ticket 05](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/05-schedule-response.md)와 [Schedule 실행 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-01-schedule-serialization-and-response-contract.md)에 있다. Mock route 검사는 실제 PostgreSQL·JWT·배포를 입증하지 않는다.
