# 날짜와 시각의 데이터 의미

저장·전송 필드가 한 시점을 나타내는지 달력 날짜만 나타내는지 판단할 때 읽는다. 이 본문은 이 주제의 현재 Project 기준을 소유한다. 기존 [Time context](../../../.claude/context/time.md)는 구현 helper와 이전 경로를 연결하는 호환 진입점으로 남는다.

## 필드의 의미를 먼저 구별한다

한 시점을 나타내는 값은 timezone을 포함한 ISO 8601 datetime으로 저장하고 전송한다. Schedule의 `scheduledAt`, entity의 `createdAt`·`updatedAt`·`deletedAt`, 동기화 기준 시각이 여기에 해당한다. 화면 표시를 위해 만든 locale 문자열을 저장하거나 전송하지 않는다.

Expense `date`는 현재 경계마다 같은 계약을 쓰지 않는다. API entity는 `YYYY-MM-DD`를 요구하지만 form·request·두 DB의 표현은 아래처럼 다르다. 따라서 기존의 “모든 날짜 필드는 datetime”과 “Expense는 모든 경계에서 date-only”라는 두 설명 중 어느 것도 현재 전체 흐름에 적용하지 않는다.

Root 불변식과 [ISO Time rule](../../../.claude/rules/iso-time.md)은 저장·전송 시간을 모두 timezone 포함 datetime으로 설명한다. 이는 현재 활성 정책이지만 아래의 Expense 구현·schema와 충돌한다. 이번 Owner 이동은 어느 한쪽을 조용히 폐기하거나 Expense 예외를 새로 승인하지 않는다. 다음 관련 변경은 datetime 정책에 구현을 맞출지, date-only domain 예외를 승인하고 기존 compact rule을 고칠지 사용자와 결정해야 한다.

## Schedule 응답의 시간 계약

PostgreSQL Schedule row는 `Date` 값을 사용하고 API Schedule entity는 timezone offset이 있는 문자열을 요구한다. [Schedule serializer](../../../apps/server/src/serializers/schedule.ts)가 `scheduledAt`, `createdAt`, `updatedAt`, nullable `deletedAt`을 ISO 문자열로 바꾼다. 생성·전체 목록·단건·수정·Trip 하위 목록·Trip activation·sync pull의 일곱 응답 경로가 같은 serializer를 사용한다.

이 공통성은 시간 변환 책임에만 적용한다. 각 endpoint의 envelope schema, 조회·소유권·soft-delete와 오류 처리는 route가 맡는다. 자세한 변경 기준은 [API 계약과 변경 가이드](../guidance/api-contracts.md)에 있다.

## Expense `date`의 확인된 현재 차이

현재 경계는 완전히 같은 물리 표현을 사용하지 않는다.

- [Expense entity schema](../../../packages/schema/src/entities/expense.ts)는 API entity의 `date`를 `YYYY-MM-DD`로 제한한다.
- [create request schema](../../../packages/schema/src/requests/expense.ts)는 `date`를 비어 있지 않은 문자열로 다시 정의하지만 update request는 entity의 date-only 검사를 유지한다.
- 현재 create form과 update picker는 날짜를 UTC 자정의 ISO datetime으로 만든다. Remote update는 client API의 update request parse에서 이 값을 거부할 수 있다.
- [client DB schema](../../../apps/client/src/shared/db/schema.ts)는 `date`를 제약 없는 text로 저장하고 local create·update는 받은 문자열을 그대로 쓴다.
- [server DB schema](../../../apps/server/src/db/schema.ts)는 `date`를 timezone-aware timestamp로 저장한다.
- [Expense serializer](../../../apps/server/src/serializers/expense.ts)는 server `Date`를 UTC ISO 문자열로 만든 뒤 날짜 부분만 반환한다.

API response가 현재 요구하는 결과와 serializer의 동작은 확인됐지만, 이 경계 차이는 하나의 일관된 제품 계약으로 채택된 상태가 아니다. Expense가 사용자의 현지 달력 날짜인지 절대 시각에서 파생한 날짜인지에 대한 장기 domain 선택도 확인되지 않았다. Date-only가 의도라면 create/update form·request를 맞추고 server 저장과 timezone 변환이 날짜를 바꾸지 않는다는 의미를 정해야 한다. Datetime으로 통일하려면 entity response·client DB·sync·표시의 영향을 함께 결정해야 한다. 현재 구현만을 근거로 어느 쪽도 새 제품 기준으로 채택하지 않는다.

Trip의 `startDate`·`endDate`는 현재 공유 schema와 저장 경계에서 ISO datetime으로 다루지만 UI에서는 여행의 시작일·종료일로 사용한다. 이 편입은 Ticket 01~05에 필요한 경계만 대조했으므로, Trip 날짜가 장기적으로 달력 날짜인지 한 시점인지까지 새로 결정하지 않는다. 해당 의미를 바꾸는 작업에서는 Trip form·주요 여행 선택 계산·두 DB와 API를 별도로 대조한다.

## 적용과 재확인

새 필드나 변환을 만들 때에는 이름에 `date`가 있다는 이유로 표현을 고르지 말고, 그 값이 한 시점인지 달력 날짜인지 먼저 정한다. datetime은 shared helper와 offset-aware schema를 사용하고, date-only는 timezone 변환으로 날짜가 이동하지 않는지 request·DB·response를 함께 확인한다.

Schedule의 일곱 소비 경로, Expense form·request·entity·두 DB와 serializer 중 하나가 바뀌면 이 본문의 사실 범위를 다시 대조한다. 관련 근거는 Workspace 002의 [Ticket 05](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/05-schedule-response.md)와 [Schedule 실행 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-01-schedule-serialization-and-response-contract.md)에 있다. Mock route 검사는 실제 PostgreSQL·JWT·배포를 입증하지 않는다.
