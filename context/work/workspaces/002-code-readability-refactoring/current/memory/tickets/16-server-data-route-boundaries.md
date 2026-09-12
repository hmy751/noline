# 16 — Schedule을 제외한 server Data Entity route 경계

## 맡은 결과와 범위

server의 Trip·Expense·Sync Data Entity route에서 request parse, 인증·user ownership, 허용 update field, DB 변환, response schema와 오류 전달 책임을 endpoint 가까이에서 읽을 수 있게 한다. 같은 row·response·오류 변환을 반복 수정하는 위치를 줄이되 endpoint별 조회 조건과 envelope 차이는 숨기지 않는다.

범위는 `apps/server/src/routes/trips.ts`, `expenses.ts`, `sync.ts`, 직접 사용하는 schema·HTTP error helper와 server 검증 기반이다. Schedule CRUD와 nested list·activation·sync pull의 Schedule 날짜 직렬화는 [05번](05-schedule-response.md)의 별도 판단이므로 이 Ticket에서 변경하지 않는다. Auth/OAuth와 Places route 전반은 서로 다른 외부 계약이므로 이번 구현 범위에서 제외하고 [17번](17-spec-coverage-closure.md)의 미배정 후보로 분류한다.

## 실행 맥락과 접근

정적 코드 대조에서 Trip route에는 client와 다른 update method, schema가 허용해도 route가 반영하지 않는 필드, schema와 맞지 않는 null 분기, ownership 확인 뒤 ID만으로 수행하는 update/delete가 함께 보인다. Sync route도 import한 request schema와 실제 parse 사용이 어긋나는 부분이 있다. 실제 HTTP 결과와 타 사용자 접근은 아직 실행으로 확인하지 않았고, server package에는 현재 route contract를 실행할 test runner가 없어 typecheck만으로 HTTP 보존을 입증할 수 없다.

method·허용 필드·ownership은 공개 동작과 보안에 영향을 줄 수 있는 정적 불일치다. route fixture로 실제 결과를 확인하고 차이가 재현되면 Main이 별도 결함 Work를 배치하거나 이 Ticket의 동작 수정 권한을 확인한다. [06번](06-client-api-boundaries.md)의 Trip update 계약은 같은 판단에 의존한다. 동작 확인 전에도 독립적인 내부 변환을 조사할 수 있지만, 선언 계약과 실제 route가 어긋난 채로 server 경계 완료를 주장하지 않는다.

## 완료 조건과 확인 방법

- Trip·Expense·Sync의 관련 endpoint에서 request parse, auth/user filter, accepted field, DB write, response parse/envelope와 오류 status를 변경 전후 비교한다.
- Trip update method와 허용 field, ownership filter가 확정된 공개 계약과 일치하고 client 06과 같은 기대를 사용한다.
- 공통 변환을 둔다면 실제로 동일한 entity 책임만 모으며 endpoint별 인증·조회·오류 조건은 호출부에서 읽힌다.
- Schedule 직렬화나 Schedule route의 소유권 문제를 수정·완료했다고 주장하지 않는다. Auth/Places는 현재 미배정 범위로 남긴다.
- Node 20과 현재 server package에서 실제 실행 가능한 route 검증 기반을 먼저 정하고 정상·schema 실패·미인증·타 사용자·not found·DB 실패를 확인한다. typecheck만으로 HTTP 계약을 입증하지 않는다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 server 제품 코드·test·설정은 변경하지 않았다. 공개 계약·ownership은 정적 코드상 동작 확인 후보로 미배정이며, 실행 가능한 server 검증 방식과 재현된 차이의 조건부 책임 배치가 선행한다. 05의 문서·구현·상태는 그대로다.
