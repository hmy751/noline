# 17 — Schedule을 제외한 server Data Entity route 경계

## 맡은 결과와 범위

server의 Trip·Expense·Sync Data Entity route에서 request parse, 인증·user ownership, 허용 update field, DB 변환, response schema와 오류 전달 책임을 endpoint 가까이에서 읽을 수 있게 한다. 같은 row·response·오류 변환을 반복 수정하는 위치를 줄이되 endpoint별 조회 조건과 envelope 차이는 숨기지 않는다.

범위는 `apps/server/src/routes/trips.ts`, `expenses.ts`, `sync.ts`, 직접 사용하는 schema·HTTP error helper와 기존 server 검증 기반이다. Schedule의 직렬화·response schema·접근 경계와 activation 자식 user scope는 완료된 [05번](05-schedule-response.md)의 결과이며 이 Ticket에서 다시 구현하지 않는다. Auth/OAuth와 Places route 전반의 구조 개선은 서로 다른 외부 계약이므로 이번 구현 범위에서 제외하고 [18번](18-spec-coverage-closure.md)의 미배정 후보로 분류한다. 서버 전체 오류 처리 재설계도 포함하지 않는다.

## 실행 맥락과 접근

Trip route에는 client와 다른 update method, schema가 허용해도 route가 반영하지 않는 필드, schema와 맞지 않는 null 분기, ownership 확인 뒤 ID만으로 수행하는 update/delete가 남아 있다. Sync route의 request schema 사용과 response 타입도 검토 대상이다. 현재는 Vitest·Supertest route test와 일회성 PostgreSQL integration 기반이 있으며, Trip·Expense·Sync의 정상 응답 특성화는 직렬화 조각에서 수행했다. 다만 해당 endpoint 전부의 접근·요청·오류 계약을 이미 검증한 것은 아니다.

허용 Trip 필드는 [003-03](../../../../003-bug-investigation-and-fixes/current/memory/tickets/03-trip-management.md), ownership·응답 계약의 결함은 [003-13](../../../../003-bug-investigation-and-fixes/current/memory/tickets/13-server-scope-and-contracts.md)이 맡는다. sync cursor·충돌은 [003-12](../../../../003-bug-investigation-and-fixes/current/memory/tickets/12-pull-consistency.md)에 남긴다. [07번](07-client-api-boundaries.md)과 공유하는 Trip update method는 실제 재현·기대 method·수정 담당의 조율이 별도로 필요하다. 선언 계약과 실제 route가 어긋난 채로 server 경계 완료를 주장하지 않으며, 같은 route의 동작 수정을 003과 중복 수행하지 않는다.

## 완료 조건과 확인 방법

- Trip·Expense·Sync의 관련 endpoint에서 request parse, auth/user filter, accepted field, DB write, response parse/envelope와 오류 status를 변경 전후 비교한다.
- Trip update method와 허용 field, ownership filter가 확정된 공개 계약과 일치하고 client 07과 같은 기대를 사용한다.
- 공통 변환을 둔다면 실제로 동일한 entity 책임만 모으며 endpoint별 인증·조회·오류 조건은 호출부에서 읽힌다.
- Schedule 직렬화·접근 경계는 05의 완료 근거를 사용하고 이번 신규 결과로 중복 집계하지 않는다. Auth/Places route 전반의 구조 개선은 현재 미배정 범위로 남긴다.
- Node 20의 기존 Vitest·Supertest와 PostgreSQL integration 기반을 활용해 정상·schema 실패·미인증·타 사용자·not found·DB 실패를 확인한다. auth mock과 실제 JWT 검증, DB mock과 실제 query 검증을 구별하고 typecheck만으로 HTTP 계약을 입증하지 않는다.

## 현재 상태와 실제 결과

사용자는 Ticket 05의 3번 ownership·soft-delete 전에 이 Ticket의 DB row → API entity 직렬화 조각을 먼저 다듬기로 했다. Main은 Trip 변환 다섯 소비 지점과 Expense 변환 여섯 소비 지점을 확인하고, 각각 `serializeTrip`, `serializeExpense`로 수렴시켰다. Schedule은 기존 `serializeSchedule`을 유지하고 activation과 sync가 세 entity serializer를 조합한다.

공통화 전 Trip·Expense CRUD와 sync pull의 route 특성화 검사 8개가 통과했다. serializer 단위 검사는 구현 전 module 부재로 실패한 뒤 구현 후 통과했으며, 최종 server test 8개 파일의 25개 test, server build, 변경 파일 Prettier와 `git diff --check`가 통과했다. server 전체 typecheck에는 기존 `places.ts:138` 오류가 남았다. 상세 범위와 한계는 [실행 기록](../../../records/2026-09-14-02-trip-expense-serialization.md)에 있다.

이 선행 조각은 `fd1db26 refactor(server): centralize trip and expense serialization`으로 저장됐으며, 당시 Ticket 16을 현재 17로 옮겨 같은 결과를 유지한다. Trip·Expense의 중복 entity/response parse, 누락된 response schema, request·update 계약, 오류 전달, 남은 ownership·soft-delete와 sync schema는 이 조각에서 변경하지 않았다. 후속 05의 activation 접근 결과는 별도 근거로 사용한다. 따라서 직렬화 결과만으로 Ticket 17 전체나 모든 공개 계약·접근 경계를 완료했다고 판단하지 않는다.
