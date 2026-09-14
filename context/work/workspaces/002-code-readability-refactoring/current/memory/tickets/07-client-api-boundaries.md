# 07 — Trip·Schedule client API 경계

## 맡은 결과와 범위

Trip과 Schedule의 remote API 함수에서 요청 검증, HTTP 호출, 응답 검증, 반환과 오류 전달을 가까운 코드만 읽고 이해할 수 있게 한다. 같은 오류를 출력한 뒤 다시 던지는 `catch`, 경계 함수마다 반복되는 성공 로그와 구현을 되풀이하는 주석을 줄이되, 각 export의 endpoint·method·request body·schema·반환값·오류 전달은 보존하거나 확인된 서버 계약에 맞게 별도 해결한다.

제품 범위는 `apps/client/src/entities/trip/api/trips.ts`, `apps/client/src/entities/schedule/api/schedules.ts`와 이 계약을 검증할 client test다. [04번](04-expense-api.md)의 결과는 검증 방식의 선례일 뿐이며, 같은 표현을 지우는 것만으로 이번 결과를 완료하지 않는다. Schedule 서버 row의 날짜 직렬화·response schema·접근 경계는 완료된 [05번](05-schedule-response.md)의 결과를 사용하고 이 Ticket에서 다시 수정하지 않는다.

## 실행 맥락과 접근

현재 두 API 모듈의 모든 export는 `try → console.error → throw`를 반복하고 Schedule API는 성공 로그도 함께 소유한다. 먼저 실제 consumer와 shared fetcher의 오류 기록 책임을 확인한 뒤, 불필요한 우회 없이 각 함수의 계약이 직접 읽히는 형태로 정리한다.

정적 코드 대조에서 client의 Trip 수정은 `PATCH /api/trips/:id`, server route는 `PUT /api/trips/:id`를 사용한다. 실제 요청 실패는 아직 실행으로 재현하지 않았지만 가독성 변경으로 정상 계약처럼 보존할 수 없는 불일치다. [17번](17-server-data-route-boundaries.md)과 같은 route contract fixture로 연결을 확인한다. [003-03 여행 수정](../../../../003-bug-investigation-and-fixes/current/memory/tickets/03-trip-management.md)은 허용 필드 미반영을 맡지만 method 차이의 기대값·수정 담당까지 확정한 것은 아니다. Main이 이 경계의 담당과 권한을 확정하기 전에는 Trip 수정 완료를 선언할 수 없으며, 다른 export의 특성화와 독립적인 정리는 진행할 수 있다.

shared fetcher의 인증 갱신 후 응답·오류 전달은 [003-02](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md), 실제 inactive child 호출 연결은 [003-07](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)이 맡는다. API 단위 mock 결과만으로 이 소비 경로까지 완료됐다고 하지 않는다.

## 완료 조건과 확인 방법

- Trip 네 export와 Schedule 다섯 export에서 정상 응답, 요청 schema 실패, 응답 schema 실패, HTTP 실패가 호출부에 전달되는 결과를 변경 전후 비교한다.
- endpoint, method, body, parse schema, 반환 shape와 HTTP 호출 횟수를 fixture로 고정한다. Trip 수정 method는 서버와 합의된 계약이 확인된 뒤 그 기대값을 둔다.
- 오류·진단 기록의 Owner가 shared fetcher 또는 호출부 중 어디인지 드러나고, API 함수가 같은 오류를 의미 없이 중복 기록하지 않는다.
- 코드 비교에서 각 함수의 요청→HTTP→응답→반환 흐름을 직접 읽을 수 있으며 04의 형태를 기계적으로 복제해 새로운 간접 계층을 만들지 않는다.
- 관련 Jest, 변경 파일 ESLint/Prettier, client typecheck를 실행하고 기존 실패와 새 회귀를 구별한다. mock 검사를 실제 네트워크 확인으로 확대하지 않는다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 코드·제품 test는 변경하지 않았다. 실행·검증·사용자 수락은 없으며 Trip update method는 정적 불일치로 확인됐지만 실제 연결 재현과 담당 배정은 남아 있다.
