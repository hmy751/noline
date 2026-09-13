# 05 — 서버 Schedule 응답과 접근 경계

## 맡은 결과와 범위

이 Ticket은 서버 Schedule 경계에서 함께 확인된 세 결과를 맡는다. 서버 DB row의 `scheduledAt`, `createdAt`, `updatedAt`, `deletedAt`을 API entity의 ISO 문자열로 바꾸는 책임을 일곱 소비 지점에서 하나의 명확한 기준으로 만들고, 각 endpoint가 이미 선언된 `@repo/schema` response 계약을 실제로 적용하게 하며, Schedule을 만들거나 읽는 경로의 사용자 소유권과 soft-delete 조건을 endpoint 의미에 맞게 보장한다. [Spec 품질·완료 판단](../spec/04-quality-and-completion.md)에 따라 실제 응답과 접근 조건을 변경 전후로 입증하면서 수정·이해 부담을 줄여야 한다.

사용자는 논의한 항목 중 날짜 직렬화, response schema 적용, 소유권·soft-delete를 모두 이 Ticket에서 처리하고 서버 테스트 기반부터 만들기로 선택했다. 서버 전체의 오류 envelope·middleware·로그 책임을 통일하는 작업은 client 계약까지 함께 판단해야 하므로 이번 Ticket에서 제외한다. 세 결과를 한 범용 helper에 합친다는 뜻은 아니다. 날짜 변환, schema 판정, query·부모 접근 조건은 서로 다른 책임으로 유지하고 각 호출부 또는 가장 작은 Owner에 배치한다.

## 실행 맥락과 접근

사용자는 개별 Ticket보다 관련 Project Context의 책임과 계약을 먼저 확인하라고 정정했다. Main은 [이 Work가 선택한 Project context](../project-context.md), 관련 API·시간·TypeScript·오류 처리 설명, server/schema guide와 실제 코드를 대조했다고 보고했다. 상세 관찰과 증명 한계는 [추가 조사](../additional-research.md)에 있다.

Project 기준에서 Schedule은 sync 대상 Data Entity이고, `@repo/schema`가 전송 shape의 원천이며 API 시간은 timezone을 포함한 ISO 8601 문자열이어야 한다. PostgreSQL/Drizzle row의 날짜는 서버 런타임에서 `Date`이므로 응답 경계에서 문자열 직렬화가 필요하다. 다만 Project Context는 Schedule serializer·mapper의 canonical 위치나 server entity 공통 직렬화 계층을 정의하지 않는다. 새 공통 모듈은 기존 표준을 적용하는 단순 정리가 아니라 책임 단위를 추가하는 설계 선택이다.

Main이 확인해 보고한 동일 네 필드 변환의 소비 지점은 총 일곱 곳이다.

- `apps/server/src/routes/schedules.ts`: 생성·목록·단건·수정 네 곳
- `apps/server/src/routes/trips.ts`: 여행 아래 일정 목록, activation 두 곳
- `apps/server/src/routes/sync.ts`: pull 한 곳

날짜 직렬화 의미는 같지만 각 endpoint의 entity/envelope 검증, 오류 변환, 조회·소유권 조건은 다르다. 일부 네 곳만 helper로 교체하면 공통 helper와 인라인 변환이 함께 남아 사용 기준을 새로 추측하게 만들 수 있다. 따라서 날짜 변환은 일곱 소비 지점을 함께 다루되, 이를 이유로 모든 endpoint의 검증·조회·오류 흐름을 한 함수로 합치지 않는다.

소유권·soft-delete는 같은 SQL 조각을 모든 곳에 붙이는 공통화가 아니다. 일반 조회와 activation은 삭제된 row를 노출하지 않아야 하지만 sync pull은 삭제 전파를 위해 soft-deleted row를 포함할 수 있다. Schedule 생성은 요청한 부모 Trip이 인증 사용자 소유이며 삭제되지 않았는지 확인해야 하고, 중첩 일정 조회와 activation의 child query는 부모 접근 확인만으로 끝내지 않고 Schedule row의 사용자 경계도 보장해야 한다. 실제 PostgreSQL query 의미는 mock 검사만으로 확정하지 않는다.

## 완료 조건과 확인 방법

제품 구현 전에 현재 응답과 접근 차이를 route 특성화 검사로 고정한다. 공통 모듈의 정확한 위치와 API는 테스트가 보여 주는 소비 관계를 보고 정하되 다음 결과는 완료 조건에 포함한다.

- 일곱 소비 지점이 공유하는 DB row → API Schedule entity 직렬화만 공통 책임으로 만들고 endpoint별 envelope·오류·인증·조회 조립은 호출부에 유지한다.
- Schedule을 반환하거나 삭제 결과를 반환하는 endpoint가 용도에 맞는 `scheduleResponse`, `scheduleListResponse`, `deleteScheduleResponse`, `activateTripResponse`, `syncPullResponseSchema`를 실제 response boundary에 적용한다. 범용 validation helper 도입은 필수 조건이 아니다.
- Schedule 생성은 부모 Trip의 인증 사용자 소유와 non-deleted 상태를 확인한다. 일반 목록·단건·수정·삭제·중첩 목록·activation은 각 의미에 맞는 user scope와 soft-delete 조건을 검사한다. sync pull의 삭제 전파 의미는 보존한다.
- 변경 전후 endpoint의 status·JSON·schema 결과·네 날짜 문자열을 같은 조건으로 비교하고, 접근 차단은 다른 사용자의 parent·child 및 soft-deleted row 사례로 확인한다.
- helper 단위 검사와 mock route 검사가 실제 PostgreSQL 제약·query 결과를 대신하지 않으므로 ownership·soft-delete SQL은 격리된 PostgreSQL 통합 검사로 추가 입증한다.
- 같은 변환의 수정 위치가 줄었는지와 새 간접 계층이 읽기 부담을 다른 곳으로 옮기지 않았는지를 별도로 비교한다.

검사 기반은 다음 조건을 충족해야 한다.

- server package에 Vitest 4.1.11, Node 20 호환 Vite 6.4.3, Supertest 7.2.2와 `@types/supertest` 7.2.1을 정확한 버전으로 두고 client Jest와 분리한다.
- 실제 Node 20.18.1에서 ESM DB·auth mock 후 exported app import와 Supertest 요청이 동작함을 확인한다.
- 공통 직렬화 실행 전 mock 기반 route 특성화 테스트로 관련 endpoint의 status·response envelope·네 날짜 JSON과 중요한 오류 분기를 고정하고 실행 후 같은 조건으로 비교한다.
- helper 단위 검사, mock route 계약 검사와 실제 PostgreSQL 통합 검사가 각각 무엇을 대체했고 무엇을 증명하지 않는지 결과에 남긴다.

`.nvmrc`는 Node 20.18.1을 선언하지만 `package.json`의 `engines`나 CI가 이를 강제하지 않으며, Main이 조사한 실제 shell은 Node 24.16.0이었다. Node 20.18.1의 `node:test` module mock은 기본 상태에서는 비활성화되고 `--experimental-test-module-mocks` 플래그로 활성화되지만 공식 문서상 `Early development`이며 TypeScript 실행에는 `tsx` 연결도 필요하다고 Main이 보고했다. 따라서 Node 내장 runner는 불가능해서 제외한 안이 아니라 실험 플래그와 실행 복잡성을 감수하는 대안으로 남긴다.

사용자는 대안별 tradeoff와 Vitest·Supertest의 역할 차이를 확인한 뒤 Vitest 4.1.11과 Supertest 7.2.2를 server package가 소유하는 검사 기반으로 채택했다. [결정 기록](../../../records/2026-09-13-01-server-test-strategy.md)에 선택 이유와 받아들인 비용을 남겼다. `src/app.ts`는 listen과 분리되어 Supertest에 직접 전달할 수 있으나 app import가 route를 통해 config 검사와 DB client 생성까지 불러오므로 DB·auth module mock은 app import 전에 적용한다. client의 Expo용 Jest 설정과 합치지 않는다.

Vitest만 사용하는 helper 단위 검사는 순수 날짜 변환을 확인할 수 있지만 실제 route가 helper를 호출하는지, middleware·status·response envelope·JSON이 유지되는지는 증명하지 못한다. Supertest는 export된 Express app에 실제 HTTP 형태의 요청을 전달하고 응답을 수집하며 Vitest가 이를 판정한다. ownership·soft-delete의 route 분기는 같은 Ticket에서 다루지만 실제 SQL 의미는 별도 PostgreSQL 통합 검사로 구별하고 날짜 직렬화 helper에 합치지 않는다.

## 현재 상태와 실제 결과

서버 test dependency와 script, Vitest Node 환경 설정, exported app을 사용하는 Schedule route 계약 테스트를 추가했다. 정확한 설치 버전은 Vitest 4.1.11, Vite 6.4.3, Supertest 7.2.2, `@types/supertest` 7.2.1이다. Node 20.18.1에서 health 응답과 Schedule 목록의 status·envelope·네 날짜 JSON을 검사한 2개 test가 통과했고 server build도 통과했다. 실제 구성과 결과는 [테스트 기반 실행 기록](../../../records/2026-09-13-02-server-test-setup.md)에 있다.

현재 검사는 DB와 auth module을 대체하므로 PostgreSQL query, 실제 JWT, listener·proxy·배포 process를 입증하지 않는다. 기존 server `typecheck`는 이번 변경과 무관한 `src/routes/places.ts:138`의 Google Maps `Language` 타입 오류로 실패했다. 이 오류를 Schedule 작업에 숨겨 고치거나 새 회귀로 분류하지 않는다.

다음 실행은 제품 코드를 바꾸기 전에 일곱 Schedule 소비 지점, response schema 적용 누락, ownership·soft-delete 차단 사례를 이 기반 위에 특성화하는 것이다. 그 뒤 날짜 직렬화 공통 책임, response boundary 검증, endpoint별 접근 조건을 구현하고 mock route 검사와 PostgreSQL 통합 검사의 증명 범위를 나눠 확인한다. 서버 전체 오류 처리 재설계는 이번 Ticket 밖에 남긴다.
