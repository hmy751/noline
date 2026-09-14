# Schedule 직렬화와 응답 계약 적용

날짜: 2026-09-14
Workspace: `002-code-readability-refactoring`

이 기록은 [Ticket 05](../current/memory/tickets/05-schedule-response.md)의 1번 Schedule 날짜 직렬화와 2번 response schema 적용 결과, 구현 중 확인한 activation Expense 계약 차이, 검증 범위와 다음 책임 판단을 보존한다. 서버 테스트 도구를 선택한 이유와 최초 기반은 [테스트 전략](2026-09-13-01-server-test-strategy.md)과 [테스트 기반 구축](2026-09-13-02-server-test-setup.md)이 소유한다.

## 변경 전에 고정한 응답 경계

Schedule은 생성·전체 목록·단건·수정·Trip 하위 목록·Trip activation·sync pull의 일곱 경로에서 반환된다. 한 경로의 성공만으로 공통 직렬화가 안전하다고 판단하지 않고, 제품 변경 전에 일곱 소비 경로의 status, envelope와 날짜 JSON을 route 특성화 검사로 고정했다.

이 검사는 실제 Express app을 import하되 DB와 auth module을 대체한다. 따라서 middleware·routing·직렬화·JSON response 경계는 실행하지만 실제 PostgreSQL query, JWT 검증과 배포 listener는 입증하지 않는다.

## Schedule 직렬화 책임

일곱 경로에 반복되던 `scheduledAt`, `createdAt`, `updatedAt`, `deletedAt` 변환을 `apps/server/src/serializers/schedule.ts`의 순수 `serializeSchedule`로 모았다. 이 함수는 DB Schedule row를 받아 날짜를 API ISO 문자열 또는 null로 바꾸며 HTTP status, envelope, Zod 검증과 DB 조회는 맡지 않는다.

각 route는 자기 응답 구조와 오류·조회 흐름을 유지한 채 같은 serializer를 사용한다. 변경 전후에 같은 route 검사를 실행했고, 필수 날짜와 nullable `deletedAt`은 별도 serializer 단위 검사로 확인했다. 이 단계는 `7dd2521 refactor(server): centralize schedule serialization`으로 저장됐다.

## response schema 적용과 중복 제거

세 Schedule GET 경로는 직렬화된 값을 `scheduleEntity`로 검사한 뒤 이를 포함하는 `scheduleResponse` 또는 `scheduleListResponse`에서 다시 검사하고 있었다. 바깥 response schema가 내부 entity를 이미 포함하므로 중간 검증을 제거하고 다음 순서로 통일했다.

```text
DB row → serializer → response envelope 조립 → response schema 검증 → HTTP 응답
```

Schedule 생성·수정과 sync pull은 이미 같은 바깥 경계를 사용하므로 유지했다. 선언만 있고 route에 연결되지 않았던 `deleteScheduleResponse`는 Schedule DELETE에, `activateTripResponse`는 Trip activation의 전체 Trip·Schedule·Expense envelope에 적용했다. 잘못된 내부 결과는 유효한 `200`으로 보내지 않고 기존 route catch와 `sendInternalError`를 통해 `500`으로 막는다. 범용 validation helper, 새 error envelope와 response schema 형태는 만들거나 바꾸지 않았다.

## activation Expense에서 드러난 현재 계약 차이

`activateTripResponse`가 전체 응답을 검사하게 하자 Expense DB 표현과 공유 API 계약의 차이가 드러났다. 서버 DB의 `date`는 `Date`, `hasReceipt`는 SQLite 호환 정수지만 `expenseEntity`와 client local DB 입력은 각각 `YYYY-MM-DD`와 boolean을 요구한다.

activation endpoint 안에서 `date`를 날짜 문자열로, `hasReceipt`를 boolean으로 바꾸고 생성·수정·삭제 시각을 ISO 문자열 또는 null로 변환했다. 이는 미래 확장만을 위한 정리가 아니라 현재 선언된 activation 계약과 client 입력을 맞추기 위한 수정이다.

다만 이 단계에서 전체 Expense route를 공통화하거나 `serializeExpense`를 새 책임으로 확정하지 않았다. 사용자 요청에 따라 2번 결과를 저장한 뒤, 3번 ownership·soft-delete 전에 Trip·Expense 직렬화 소비 지점과 공통 책임을 별도로 대조해 다듬는다.

## 실패 재현과 검증 결과

2번 제품 변경 전에 추가한 route 검사 세 개는 다음 결함을 재현했다.

- 잘못된 ID와 `deletedAt`을 가진 Schedule 삭제 결과가 `500` 대신 `200`으로 반환됐다.
- 정상 activation 응답에서 Expense `date`가 전체 datetime, `hasReceipt`가 정수로 반환됐다.
- 잘못된 Schedule을 포함한 activation 결과가 `500` 대신 `200`으로 반환됐다.

수정 후 Node 20.18.1에서 server test 3개 파일의 13개 test와 server `tsup` build, `git diff --check`가 통과했다. server 전체 `tsc --noEmit`에는 기존 `src/routes/places.ts:138`의 Google Maps `Language` 타입 오류 하나가 남았다. 이 오류는 이번 변경으로 만들거나 고치지 않았다.

현재 mock 검사는 response boundary와 변환 결과를 입증하지만 실제 PostgreSQL의 user scope와 soft-delete query 의미를 입증하지 않는다. Ticket 05의 3번은 다른 사용자와 삭제 데이터 차단 사례를 먼저 확정하고 격리된 PostgreSQL 통합 검사와 route 검사의 역할을 구별해 진행한다.
