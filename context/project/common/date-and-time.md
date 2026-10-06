# 날짜와 시각의 데이터 의미

저장·전송 필드가 한 시점을 나타내는지 달력 날짜만 나타내는지 판단할 때 읽는다. 이 본문은 이 주제의 현재 Project 기준을 소유한다. 기존 [Time context](../../../.claude/context/time.md)는 구현 helper와 이전 경로를 연결하는 호환 진입점으로 남는다.

## 필드의 의미를 먼저 구별한다

한 시점을 나타내는 값은 timezone을 포함한 ISO 8601 datetime으로 저장하고 전송한다. Schedule의 `scheduledAt`, entity의 `createdAt`·`updatedAt`·`deletedAt`, 동기화 기준 시각이 여기에 해당한다. 화면 표시를 위해 만든 locale 문자열을 저장하거나 전송하지 않는다.

Expense `date`는 경비가 속하는 달력 날짜이며 `YYYY-MM-DD`로 입력·전송·표시한다. 일정의 `scheduledAt`과 독립적이며 기기 시간대가 바뀌어도 날짜를 이동시키지 않는다. 생성·수정 시각과 구분하며, 결제일·사용일 중 무엇을 의미하는지는 이 저장 계약으로 새로 정하지 않는다. 기존 datetime 호환과 서버의 물리 저장 표현은 아래 기준을 따른다.

## 여행 도시의 시간대를 기준으로 입력하고 표시한다

여행의 시간 기준은 기기 위치가 아니라 Trip의 `timeZone`이다. `Europe/Paris` 같은 IANA 식별자를 저장하며, 고정된 `+02:00` offset으로 대체하지 않는다. 같은 도시라도 날짜에 따라 DST offset이 달라질 수 있기 때문이다. 한 도시를 대표하는 현재 Trip에서는 일정마다 시간대를 복제하지 않는다. 여러 도시나 항공편의 출발·도착 시간을 독립적으로 지원할 때 이 소유 경계를 다시 판단한다.

Trip `startDate`·`endDate`는 ISO datetime 저장·전송 계약을 유지한다. 새 여행과 사용자가 변경한 기간은 도시의 시작일·종료일 자정을 UTC로 변환한다. 종료일은 여행에 포함되는 마지막 달력 날짜이며 그날 시작 시점에 여행이 끝났다는 뜻이 아니다. 일정·경비 목록은 두 시점을 도시 날짜로 읽고 양 끝을 포함해 달력 일자로 나열한다. 날짜를 24시간씩 더해 만들지 않는다. 기간 순서 검사는 변경값과 기존값을 합친 뒤 같은 도시의 달력 날짜로 비교한다. 과거에 자정 이외의 시각으로 저장된 시작일과 새 종료일이 같은 도시 날짜이면 하루 여행으로 허용하며, Server와 Local이 같은 검사를 적용한다.

예를 들어 파리의 2026-09-30~10-02 여행은 `2026-09-29T22:00:00Z`~`2026-10-01T22:00:00Z`로 저장한다. 10월 2일 오전 9시 일정은 `2026-10-02T07:00:00Z`, 같은 날 경비는 `2026-10-02`다. 서울·파리·미국 기기에서 이 여행을 열어도 여행 날짜와 일정 시각은 파리 기준으로 같다.

도시 선택 시 좌표로 시간대를 확인하고 Trip에 저장한다. 입력 실패는 재시도할 수 있게 드러내며 기기 시간대로 대신 저장하지 않는다. 활성 여행은 저장된 시간대를 사용하므로 이후 오프라인 조회·편집마다 외부 조회가 필요하지 않다. 폼과 화면은 Trip의 시간대를 shared datetime helper에 전달하고, Repository·Activation Router·동기화는 검증된 값을 기존 경로로 보존한다. 날짜 변경 때문에 별도 Local/Remote 분기를 만들지 않는다.

시간대 도입 전 Trip의 누락·null은 미확정 상태로 구별한다. 읽기용 UTC 호환 표시는 시간대 확인이 필요하다는 안내와 함께 사용한다. 도시 좌표로 시간대를 확인한 후 기존 여행 수정 경로로 저장하며, 이때 기존 기간·일정 timestamp를 일괄 이동시키지 않는다. 기존 입력의 원래 현지 날짜는 timestamp만으로 복원할 수 없으므로 기간을 바꾸려면 사용자의 명시적인 날짜 편집을 받는다. 시간대가 없는 여행에서 새 일정 시각이나 여행 기간을 기기 기준으로 저장하지 않는다.

기존 SQLite에는 nullable 시간대 column을 추가하고 기존 행·전송 대기 큐를 보존한다. 새 client의 생성 요청은 시간대가 필수다. 서버는 과거 client의 미전송 Trip CREATE에 한해 시간대 없는 입력을 호환 수용한다. 시간대가 있는 값은 일반 응답·활성화·동기화·로컬 upsert를 거쳐 보존한다.

## 시점 검증과 일정 입력의 책임

공유 [시점 schema](../../../packages/schema/src/primitives/datetime.ts)는 timezone이 있는 ISO 형식뿐 아니라 실제로 해석 가능한 시점인지 검사한다. `+99:99`처럼 형식 검사를 통과해도 유효한 시각이 아닌 값은 거절한다. Trip·Schedule·Expense·User의 시점 필드, 삭제 응답과 동기화 기준 시각은 같은 검사를 사용한다. 유효한 offset을 `Z`로 강제 재작성하지는 않는다.

Schedule 생성·수정 폼은 여행 도시 시간대의 `YYYY-MM-DD`와 `HH:mm`을 보관한다. 공유 폼 검사와 [datetime helper](../../../apps/client/src/shared/lib/datetime.ts)가 달력 구성요소를 현지 시각으로 해석하고, submit 때 UTC ISO 문자열을 만든다. UTC 자정에서 현지 시간을 붙이면 UTC보다 느린 시간대에서 전날로 이동하므로 그 방식은 사용하지 않는다. DST(계절에 따른 시간대 전환)로 존재하지 않는 시각은 다음 시각으로 보정하지 않고 폼 오류로 보여주며 초안은 유지한다. 반복되는 시각의 새 입력은 두 시점 중 앞선 시점을 선택한다. 별도의 중복 시각 선택 UI는 두지 않으며, 기존 일정의 시각을 편집하지 않았다면 원본 시점을 그대로 보존한다.

수정은 최종 날짜·시간이 처음 연 폼 값과 다른 경우에만 `scheduledAt`을 포함한다. 되돌린 입력이나 제목·장소만 바꾸는 수정은 원래 offset·초·밀리초와 DST 중복 시각의 원본을 보존한다. 폼을 열 때의 날짜·시간과 해석할 시간대를 함께 고정하므로 편집 중 조회 결과가 갱신돼도 초안의 해석 기준이 바뀌지 않는다. 미확정 상태에서 연 폼은 시간대 확인 후 다시 열어 날짜·시간을 편집한다. 저장 성공 후에는 비교 기준을 저장한 폼 값으로 갱신한다. 경비 생성으로 이동할 때는 오래된 navigation 시각 대신 현재 조회한 일정의 현지 날짜를 기본값으로 넘긴다.

Schedule·Trip Repository는 Expense와 같이 공유 생성·수정 요청을 검사한 뒤 Activation Router로 전달한다. Local Schedule은 시각의 표현을 유지하며 목록·단건·mutation 결과를 반환할 때 시점 계약을 검사한다. 결과 검사 실패는 commit 전에 행·큐를 함께 롤백하고, 존재·접근 확인을 시각 검사와 분리해 잘못된 기존 행도 시각 교정이나 삭제가 가능하다. 목록은 SQLite TEXT 순서 대신 실제 시점으로 정렬해 offset이 다른 값도 순서가 맞는다.

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
- 서버 입수 경비는 date-only entity를 요구한다. legacy datetime 허용은 기존 Local 행·요청 입력·큐의 호환에 한정한다. Activation·pull의 전체 입수 검사는 아래 기준을 따른다.

## 서버 데이터 입수와 여행 날짜 범위

Trip activation은 `activateTripResponse`, sync pull은 `syncPullResponseSchema`로 전체 envelope와 Trip·Schedule·Expense를 검사한 뒤 첫 Local 쓰기를 시작한다. Pull의 `serverTime`도 이 단계에 포함하므로 잘못된 시각을 기준으로 checkpoint를 전진시키지 않는다. Sync schema는 HTTP JSON 계약으로 entity의 문자열 시각을 요구하며 DB Date 객체나 필수 Trip 날짜의 null·누락을 허용하지 않는다. 서버 serializer가 DB Date를 문자열로 바꾸는 책임과 client 입수 경계의 검사를 구별한다. 소유권 검사는 유지한다. 이는 입수 검사이며 pull 전체 저장의 원자성이나 다른 동기화 실패 정책까지 새로 보장하는 변경은 아니다.

서버 sync pull은 `lastSyncedAt`을 공유 query schema로 검사한 뒤 SQL 비교 시각을 만든다. Z와 유효한 offset을 모두 수용하고, timezone이 없거나 해석 불가능한 값은 조회 전에 400 응답으로 거절한다.

날짜 구간·표시·폼·여행 선택·활성 만료는 Trip 도시 시간대 기준으로 통일하는 계약이다. 저장 위치·전송 대기 데이터 보호는 기존 의미를 유지한다.

2026-09-14의 서버 직렬화 작업은 DB row → 응답 표현을 통일했다. 당시 폼의 datetime과 수정 요청의 date-only 불일치는 그대로 남아 있었다. 이후 직접 수정 API에만 둔 보정도 Local 동기화에는 적용되지 않았다. 사용자가 공유 규칙과 저장 전 경계의 일관성을 요청해 위 책임 배치를 채택했다. [선택과 호환 범위](../../../.claude/decisions/2026-10-02-expense-date-boundaries.md)에 근거를 남긴다.

기존 datetime을 원래 사용자가 어느 현지 날짜로 의도했는지 역추정하지 않는다. 호환은 기존 서버 응답의 UTC 날짜를 보존하며, 이전에 잘못 저장된 날짜의 복원이나 DB column migration은 별도 작업이다.

도시 시간대 기준의 선택과 UTC 저장 유지 이유는 [여행 도시 시간대 결정](../../../.claude/decisions/2026-10-06-trip-city-time-zone.md)에 남긴다. 과거 UTC 날짜 구간 개선과 이번 도시 기준 통일은 서로 다른 변경이다.

## 적용과 재확인

새 필드나 변환을 만들 때에는 이름에 `date`가 있다는 이유로 표현을 고르지 말고, 그 값이 한 시점인지 달력 날짜인지 먼저 정한다. datetime은 shared helper와 offset-aware schema를 사용하고, date-only는 timezone 변환으로 날짜가 이동하지 않는지 request·DB·response를 함께 확인한다.

Schedule의 일곱 소비 경로, Expense form·request·entity·두 DB와 serializer 중 하나가 바뀌면 이 본문의 사실 범위를 다시 대조한다. 관련 근거는 Workspace 002의 [Ticket 05](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/05-schedule-response.md)와 [Schedule 실행 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-01-schedule-serialization-and-response-contract.md)에 있다. Mock route 검사는 실제 PostgreSQL·JWT·배포를 입증하지 않는다.
