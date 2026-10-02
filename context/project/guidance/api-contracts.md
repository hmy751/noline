# API 계약과 변경 가이드

Client API 함수, server route, 공유 request·response schema, DB row 직렬화와 user scope를 추가·수정·리팩터링할 때 읽는다. 이 본문은 편입한 API 주제의 현재 Project 기준을 소유한다. 기존 [API/Data context](../../../.claude/context/api-data.md)는 repository·React Query 구현 경로와 호환 진입을 맡는다.

## 경계마다 맡은 책임을 구별한다

`@repo/schema`의 Zod schema가 client와 server 사이의 request·response shape를 소유한다. Form 전용 상태나 DB row type은 별도 표현을 가질 수 있지만 전송 경계에서 공유 계약으로 수렴한다.

일반적인 데이터 흐름은 다음 책임을 구별한다.

1. Client API 함수는 전송 전에 request schema를 적용하고 HTTP 결과를 response schema로 검증한 뒤 data를 반환한다.
2. Server route는 인증된 사용자와 request schema를 확인하고, 소유 범위 안에서 DB를 읽거나 쓴다.
3. Serializer는 DB row를 API entity 표현으로 바꾼다. HTTP status, envelope, Zod 판정, query나 오류 응답까지 맡지 않는다.
4. Route는 serialized entity로 response envelope를 조립한 뒤 가장 바깥 response schema를 적용한다. 바깥 schema가 내부 entity를 포함하면 같은 entity를 중간에서 다시 검사할 이유가 있는지 확인한다.

Response schema를 선언하거나 client에서만 parse하는 것으로 server가 실제 계약을 적용했다고 보지 않는다. Server가 검증하지 않으면 잘못 조립한 성공 응답을 보낼 수 있고, client가 검증하지 않으면 activation처럼 여러 entity를 받는 경계에서 잘못된 표현이 local 저장으로 이어질 수 있다.

## Schedule에 적용되는 구체적인 계약

[Schedule entity](../../../packages/schema/src/entities/schedule.ts)는 `scheduledAt`, `createdAt`, `updatedAt`, nullable `deletedAt`을 offset-aware ISO datetime string으로 요구한다. PostgreSQL row의 `Date`를 이 표현으로 바꾸는 책임은 [serializeSchedule](../../../apps/server/src/serializers/schedule.ts)에 있다.

Schedule은 생성·전체 목록·단건·수정·Trip 하위 목록·Trip activation·sync pull의 일곱 server 응답 경로에서 같은 serializer를 사용한다. 각 endpoint는 자기 response envelope를 조립해 `scheduleResponse`, `scheduleListResponse`, `deleteScheduleResponse`, `activateTripResponse` 또는 sync response schema 중 실제 계약을 적용한다. Schedule 시간 계약은 [날짜와 시각](../common/date-and-time.md)이 소유한다.

같은 query 조건을 모든 endpoint에 복사하지 않는다. 현재 의미는 다음과 같다.

- 일반 목록·단건·수정·삭제와 Trip 하위 목록·activation은 인증 사용자 소유의 삭제되지 않은 데이터를 다룬다.
- Schedule 생성은 부모 Trip이 인증 사용자 소유이고 삭제되지 않았는지 먼저 확인한다. `userId`는 client 입력을 신뢰하지 않고 인증 사용자에서 정한다.
- Trip 하위 목록과 activation은 부모 접근뿐 아니라 자식 Schedule·Expense에도 user scope와 일반 조회의 non-deleted 조건을 적용한다.
- Schedule 수정·삭제는 선행 조회 뒤 ID만으로 변경하지 않고 실제 mutation 조건에 `id + userId + deletedAt IS NULL`을 적용한다.
- Sync pull은 삭제 사실을 다른 기기에 전파해야 하므로 user scope와 갱신 시각은 적용하되 soft-deleted row를 포함할 수 있다. 일반 조회 필터를 그대로 재사용하지 않는다.

부모 Trip이 없거나 다른 사용자 소유이거나 삭제된 경우를 같은 404로 처리하는 현재 경계는 자원의 존재 여부를 추가로 노출하지 않는다. 이 접근 계약은 실제 PostgreSQL query와 route 응답 모두에서 확인해야 한다.

## Expense client API와 오류 전달

[Expense client API](../../../apps/client/src/entities/expense/api/expenses.ts)는 생성·수정 request를 HTTP 전에 parse하고, 목록·생성·수정·삭제 response를 반환 전에 parse한다. API 함수 자체는 네트워크 오류를 기록한 뒤 같은 오류를 다시 던지는 catch를 두지 않는다. 현재 [apiClient](../../../apps/client/src/shared/api/fetcher.ts)가 Axios 오류를 `APIError`로 변환하고 React Query hook·화면이 전달된 오류를 소비한다.

이 사실은 서버와 client 전체의 오류 정책을 새로 정한 것이 아니다. 활성 [오류 처리 context](../../../.claude/context/error-handling.md)는 server의 `AppError + errorHandler`를 기본으로 설명하지만, Schedule route를 포함한 현재 Data route 일부는 `try/catch + sendInternalError`를 사용한다. 어느 쪽을 server 전체의 목표 구조로 삼을지와 error envelope·client mapping을 함께 바꿀지는 미결정이다. API 리팩터링 안에서 한쪽을 조용히 채택하거나 catch를 일괄 제거하지 않는다.

Expense `date`의 공유 입력 정규화·date-only 계약·기존 datetime 호환과 저장 경계는 [날짜와 시각](../common/date-and-time.md), 통화 분리·금액 정밀도는 [통화와 금액](../common/currency.md)에서 판단한다.

Local 경비 조회·mutation 반환도 날짜 계약을 맞춰 화면의 호환 변환을 없앤다. 내부 행의 존재·소유권 확인은 반환용 날짜 검사와 분리하며, mutation 결과 검사 실패는 commit 전에 행·큐를 함께 롤백한다. Activation과 sync pull에서는 경비 배열을 `expenseEntity`로 검사한 뒤 저장하지만, 이는 다른 entity와 envelope의 전체 응답 검증을 대신하지 않는다.

## 변경 전후에 확인할 증거

Schema·serializer·route 중 하나를 바꾸면 선언과 실제 소비자를 함께 대조한다. Schedule 시간 변환처럼 같은 책임이 여러 응답 경로에 있으면 한 경로의 성공만으로 전체 적용을 주장하지 않는다.

- Serializer 단위 검사는 순수 DB row → entity 변환을 확인한다.
- Vitest와 Supertest를 사용한 route 계약 검사는 실제 Express middleware·router·status·JSON·schema 경계를 확인한다. DB와 auth module을 대체했다면 실제 SQL·JWT는 입증하지 않는다.
- Ownership·soft-delete query는 다른 사용자, 삭제된 부모·자식과 scoped mutation을 넣은 격리 PostgreSQL 검사로 확인한다.
- Client API mock 검사는 request의 HTTP 전 실패, response parse 실패, HTTP 횟수와 오류 전달을 확인하지만 Axios interceptor의 실제 네트워크 동작이나 React Native 화면을 입증하지 않는다.

현재 검증 진입점은 [client Expense API test](../../../apps/client/tests/entities/expense/api/expenses.test.ts), [Expense Local·입수 경계 SQLite test](../../../apps/client/tests/entities/expense/lib/expense-local.test.ts), [Schedule route 계약 test](../../../apps/server/tests/routes/schedules.response-contract.test.ts), [Schedule serializer test](../../../apps/server/tests/serializers/schedule.test.ts), [Schedule PostgreSQL integration test](../../../apps/server/tests/integration/schedules.access-boundary.test.ts)다. SQLite 검사는 실제 SQL·rollback을 실행하지만 기기 SQLite binding과 HTTP·지도 서비스는 대역을 사용한다. 정확한 dependency 버전과 과거 실행 수치는 package 설정과 Workspace 기록이 소유한다.

Ticket 05 뒤 추가된 Trip·Expense serializer도 현재 route에서 사용되지만, 그 사실을 Ticket 05의 완료나 Schedule 외 server API 전체의 response·request·ownership 계약 완료로 확대하지 않는다. API 오류 구조, 실제 JWT·배포 process, 외부 서비스와 모든 Data route의 계약은 이 편입 근거로 확인하지 않았다.

이 기준은 Workspace 002의 [Ticket 04](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/04-expense-api.md), [Ticket 05](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/05-schedule-response.md), [Schedule 응답 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-01-schedule-serialization-and-response-contract.md), [접근 경계 기록](../../work/workspaces/002-code-readability-refactoring/records/2026-09-14-03-schedule-access-boundary.md)과 현재 code·schema·test를 2026-09-14에 대조해 통합했다.
