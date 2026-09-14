# 13. 서버 소유권과 응답 계약

## 맡은 결과와 범위

여행·일정·경비의 조회/생성/수정/삭제·활성화·sync가 인증된 사용자의 허용된 데이터만 다루고, 같은 entity를 동일한 schema 의미로 전달하게 한다.

중첩 일정 조회의 userId/deletedAt, 생성 부모 소유권·관계, 삭제 데이터 노출, 활성화 경비 날짜/hasReceipt 정규화·실제 응답 검증, 소비자가 필요한 오류 종류의 보존을 맡는다. 허용된 여행 수정 필드 미반영은 03, 갱신 직후 이중 응답 추출은 02, 좌표 0의 기능 경계는 09이 구현 owner다.

## 실행 맥락과 접근

[기존 서버 후보](../analysis-items.md)와 [카테고리 조사](../../../records/2026-09-13-02-major-feature-category-investigation.md)는 소스 불일치를 확인했지만 실제 두 계정·PostgreSQL·client parser 왕복은 실행하지 않았다. 일반 일정 목록과 중첩 endpoint는 다른 경로이므로 영향 범위를 구별한다.

[trips](../../../../../../../apps/server/src/routes/trips.ts), [schedules](../../../../../../../apps/server/src/routes/schedules.ts), [expenses](../../../../../../../apps/server/src/routes/expenses.ts), [sync](../../../../../../../apps/server/src/routes/sync.ts), [오류 middleware](../../../../../../../apps/server/src/middleware/errorHandler.ts), [공유 schema](../../../../../../../packages/schema/CLAUDE.md)에서 시작한다. 독립 착수 가능하다. 002에서 변경 중인 서버 테스트/응답 정리는 현재 내용을 대조해 활용하고 되돌리거나 같은 수정 책임을 중복 수행하지 않는다.

공통 기준은 [기대 동작](../spec/02-behavior-and-cases.md)과 [품질·완료 판단](../spec/04-quality-and-completion.md)을 따른다.

## 완료 조건과 확인 방법

- 격리 사용자 A/B와 삭제된 부모·자식 fixture로 각 endpoint의 미인증·다른 소유자·잘못된 부모 관계·정상 접근을 시험한다. 허용되지 않은 읽기/쓰기는 데이터 변경 없이 거절된다.
- 동일 경비의 CRUD·활성화·pull 응답을 실제 client Zod parser에 통과시켜 날짜·boolean·nullable 값이 같은 의미임을 확인한다. 변수명만으로 검증됐다고 판단하지 않는다.
- 소유권/삭제 필터 수정 뒤 정상 본인 데이터 조회와 soft delete·sync 삭제 전달은 유지된다.
- auth·route helper·middleware에서 나온 대표 오류를 client 소비자까지 추적해 재시도 가능 여부·사용자 안내에 필요한 종류가 보존되는지 검증한다. 모양이 다르다는 이유만으로 전면 통일하지 않는다.
- 02·03·09이 맡은 입력/응답 변경과 겹치는 경계는 공동 회귀 근거로 연결하고, 이번 서버 계약 결과만으로 전체 client 사용 성공을 선언하지 않는다.

## 현재 상태와 실제 결과

003에서의 추가 실행은 아직 없다. 다만 이후 [002-05](../../../../002-code-readability-refactoring/current/memory/tickets/05-schedule-response.md)에서 Schedule 직렬화·response schema와 부모 Trip/자식 user scope·soft-delete·scoped UPDATE를 완료했다. activation Expense 날짜·boolean과 전체 response 검증, activation의 Schedule·Expense user filter도 포함한다. server unit·route 29개와 PostgreSQL 14 integration 4개 test의 결과는 [접근 경계 기록](../../../../002-code-readability-refactoring/records/2026-09-14-03-schedule-access-boundary.md)을 사용하며 이번 문서 갱신에서 재실행하지 않았다.

[002-17(당시 16)](../../../../002-code-readability-refactoring/current/memory/tickets/17-server-data-route-boundaries.md)의 Trip·Expense serializer도 이미 반영됐다. 이 완료 범위는 재구현하지 않고 회귀 대조군으로 사용한다. Trip·Expense·Sync의 남은 접근·요청·응답 경계, 실제 JWT, 전체 client parser 왕복과 오류 종류 소비 검증은 남아 있다. 따라서 외부 Work의 선행 결과만으로 이 Ticket 전체나 003 전체를 완료로 표시하지 않는다.
