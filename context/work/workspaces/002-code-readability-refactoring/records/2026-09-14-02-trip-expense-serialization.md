# Trip·Expense 직렬화 책임 분리

날짜: 2026-09-14
Workspace: `002-code-readability-refactoring`

이 기록은 Schedule response 작업에서 activation의 Expense 표현을 보정한 뒤, Trip·Expense의 같은 DB row → API entity 변환 책임을 전체 소비 지점에서 대조하고 공통 serializer로 분리한 결과를 보존한다. Schedule 직렬화와 response schema 적용 결과는 앞선 [Schedule 응답 실행 기록](2026-09-14-01-schedule-serialization-and-response-contract.md)이 소유한다.

## Ticket 경계와 선행 실행 이유

Trip·Expense·Sync route의 공통 변환은 원래 [Ticket 16](../current/memory/tickets/16-server-data-route-boundaries.md)의 범위다. 사용자는 Ticket 05의 3번 ownership·soft-delete 작업 전에 Trip·Expense 직렬화 책임을 먼저 다듬기로 했다. 이에 따라 Ticket 16 전체를 시작한 것으로 넓히지 않고, request parse·response schema·오류·ownership과 독립적인 직렬화 조각만 선행했다.

실제 소비 지점을 대조한 결과 Trip 변환은 목록·생성·수정·activation·sync pull의 다섯 곳, Expense 변환은 목록·생성·단건·수정·activation·sync pull의 여섯 곳에 있었다. activation 한 곳만 함수로 바꾸면 같은 책임의 인라인 사본이 CRUD와 sync에 남으므로 각 entity의 전체 소비 지점을 함께 교체했다. DELETE는 전체 entity가 아니라 `id`와 `deletedAt`만 반환하므로 이번 entity serializer 대상이 아니다.

## 분리한 책임

`apps/server/src/serializers/trip.ts`의 `serializeTrip`은 Trip의 `startDate`, `endDate`, `createdAt`, `updatedAt`, `deletedAt`을 API ISO datetime 또는 null로 바꾼다. 목록 query가 선택하지 않는 optional `deletedAt`과 `version`은 serializer가 새로 추가하지 않아 기존 목록 shape을 보존한다.

`apps/server/src/serializers/expense.ts`의 `serializeExpense`는 Expense의 `date`를 `YYYY-MM-DD`, `hasReceipt`를 boolean, `createdAt`·`updatedAt`·`deletedAt`을 ISO datetime 또는 null로 바꾼다. Trip·Expense의 나머지 필드는 그대로 전달한다.

두 serializer는 HTTP status, response envelope, Zod 판정, 요청 변환과 DB query를 맡지 않는다. `trips.ts`, `expenses.ts`, `sync.ts`의 기존 호출부가 각 endpoint 흐름을 계속 소유하며 activation도 Schedule과 함께 세 entity serializer를 조합한다.

## 변경 전후 검사

공통화 전에 Trip 목록·생성·수정, Expense 목록·생성·단건·수정, sync pull의 Trip·Expense를 실행하는 route 특성화 검사 8개를 추가해 현재 status와 JSON 표현이 통과함을 확인했다. activation의 세 entity 응답은 기존 Schedule response 계약 검사가 계속 확인한다.

새 serializer 단위 검사 두 파일은 구현 전에 module 부재로 실패했고, 구현 뒤 Trip의 다섯 시간 값과 nullable 삭제 시각, Expense의 날짜·boolean·시간 값과 false/null 사례를 통과했다. 최종적으로 Node 20.18.1에서 server test 8개 파일의 25개 test, server `tsup` build, 변경 파일 Prettier와 `git diff --check`가 통과했다.

server 전체 `tsc --noEmit`은 기존 `src/routes/places.ts:138`의 Google Maps `Language` 타입 오류 하나로 실패했다. 이번 변경 파일에서 새 타입 오류는 보고되지 않았다. DB·auth mock 기반 route 검사는 실제 PostgreSQL query, JWT와 배포 listener를 입증하지 않는다.

## 남은 책임

Trip 목록과 Expense 목록·단건에는 중간 entity parse와 바깥 response schema parse의 중복이 남아 있고 Expense 생성·수정 및 Trip·Expense DELETE의 response schema 적용 상태도 이번에 바꾸지 않았다. request 허용 필드, update method, 오류 전달, sync schema의 `Date | string` 허용과 ownership·soft-delete 조건도 그대로다. 이 항목들은 Ticket 16의 response boundary 또는 Ticket 05의 3번 접근 경계에서 각 Owner에 따라 다룬다.

다음 제품 작업은 Ticket 05의 3번으로 돌아가 Schedule 생성·일반 조회·중첩 조회·activation·sync의 user scope와 soft-delete 의미를 사례별로 고정하는 것이다. mock route 검사와 실제 PostgreSQL 통합 검사의 증명 범위는 구별한다.
