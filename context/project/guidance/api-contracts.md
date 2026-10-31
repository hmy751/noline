# API 계약과 변경 가이드

Client API·repository·query hook, server route, 공유 schema·serializer·user scope를 바꿀 때 읽는다. **전송 검증·인증·소유권·저장소 선택을 각각의 경계에서 확인하고, 한 경로의 보장을 모든 API에 확대하지 않는다.** 현재 계약은 이 본문을, 오류 응답·사용자 표시를 바꾸면 [오류 처리](error-handling.md)를 함께 읽는다. 책임 분리와 인증 전송 선택의 이유는 [형성 자료](_background/api-contracts/README.md)에 있다.

## API를 바꾸면 전송·접근·직렬화의 책임을 각각 확인한다

`@repo/schema`의 Zod schema가 client와 server 사이의 request·response shape를 소유한다. Form 전용 상태나 DB row type은 별도 표현을 가질 수 있지만 전송 경계에서 공유 계약으로 수렴한다.

일반적인 데이터 흐름은 다음 책임을 구별한다.

1. Client API 함수는 생성·수정 전송 전에 request schema를 적용하고 HTTP 결과를 response schema로 검증한 뒤 호출자의 계약에 맞게 반환한다. Expense·Schedule 목록은 data를, Trip 목록은 검증된 envelope 전체를 반환하므로 반환 모양까지 일괄 통일됐다고 가정하지 않는다.
2. Server route는 인증된 사용자와 request schema를 확인하고, 소유 범위 안에서 DB를 읽거나 쓴다.
3. Serializer는 DB row를 API entity 표현으로 바꾼다. HTTP status, envelope, Zod 판정, query나 오류 응답까지 맡지 않는다.
4. Route는 serialized entity로 response envelope를 조립한 뒤 가장 바깥 response schema를 적용한다. 바깥 schema가 내부 entity를 포함하면 같은 entity를 중간에서 다시 검사할 이유가 있는지 확인한다.

Response schema를 선언하거나 client에서만 parse하는 것으로 server가 실제 계약을 적용했다고 보지 않는다. Server가 검증하지 않으면 잘못 조립한 성공 응답을 보낼 수 있고, client가 검증하지 않으면 activation처럼 여러 entity를 받는 경계에서 잘못된 표현이 local 저장으로 이어질 수 있다.

## Schedule을 바꿀 때 일곱 응답 경로와 조회 목적을 함께 대조한다

[Schedule entity](../../../packages/schema/src/entities/schedule.ts)는 `scheduledAt`, `createdAt`, `updatedAt`, nullable `deletedAt`을 offset-aware ISO datetime string으로 요구한다. PostgreSQL row의 `Date`를 이 표현으로 바꾸는 책임은 [serializeSchedule](../../../apps/server/src/serializers/schedule.ts)에 있다.

Schedule은 생성·전체 목록·단건·수정·Trip 하위 목록·Trip activation·sync pull의 일곱 server 응답 경로에서 같은 serializer를 사용한다. 각 endpoint는 자기 response envelope를 조립해 `scheduleResponse`, `scheduleListResponse`, `deleteScheduleResponse`, `activateTripResponse` 또는 sync response schema 중 실제 계약을 적용한다. Schedule 시간 계약은 [날짜와 시각](../common/date-and-time.md)이 소유한다.

같은 query 조건을 모든 endpoint에 복사하지 않는다. 현재 의미는 다음과 같다.

- 일반 목록·단건·수정·삭제와 Trip 하위 목록·activation은 인증 사용자 소유의 삭제되지 않은 데이터를 다룬다.
- Schedule 생성은 부모 Trip이 인증 사용자 소유이고 삭제되지 않았는지 먼저 확인한다. `userId`는 client 입력을 신뢰하지 않고 인증 사용자에서 정한다.
- Trip 하위 목록과 activation은 부모 접근뿐 아니라 자식 Schedule·Expense에도 user scope와 일반 조회의 non-deleted 조건을 적용한다.
- Schedule 수정·삭제는 선행 조회 뒤 ID만으로 변경하지 않고 실제 mutation 조건에 `id + userId + deletedAt IS NULL`을 적용한다.
- Sync pull은 삭제 사실을 다른 기기에 전파해야 하므로 user scope와 갱신 시각은 적용하되 soft-deleted row를 포함할 수 있다. 일반 조회 필터를 그대로 재사용하지 않는다.

부모 Trip이 없거나 다른 사용자 소유이거나 삭제된 경우를 같은 404로 처리하는 현재 경계는 자원의 존재 여부를 추가로 노출하지 않는다. 이 접근 계약은 실제 PostgreSQL query와 route 응답 모두에서 확인해야 한다.

## Expense·Trip과 Local 입수의 실제 적용 범위를 구별한다

[Expense client API](../../../apps/client/src/entities/expense/api/expenses.ts)는 생성·수정 request를 HTTP 전에 parse하고, 목록·생성·수정·삭제 response를 반환 전에 parse한다. API 함수 자체는 네트워크 오류를 기록한 뒤 같은 오류를 다시 던지는 catch를 두지 않는다. 현재 [apiClient](../../../apps/client/src/shared/api/fetcher.ts)가 Axios 오류를 `APIError`로 변환하고 React Query hook·화면이 전달된 오류를 소비한다.

HTTP interceptor에서 변환된 APIError와 API 함수가 응답 parse 도중 던진 ZodError는 서로 다른 실패다. 재전파 catch를 제거하는 리팩터링과 오류 envelope·로그·사용자 문구 정책의 변경도 구별한다. Server의 AppError 기준과 Data route의 실제 처리 차이는 [오류 처리](error-handling.md)에서 판단한다.

[Expense route](../../../apps/server/src/routes/expenses.ts)의 생성·수정은 serializeExpense 결과를 entity로 검사한 뒤 envelope를 직접 조립하고, 삭제는 최외곽 response 검사를 하지 않는다. [Trip route](../../../apps/server/src/routes/trips.ts)의 삭제도 response 검사가 없다. 이것은 위의 최외곽 검증 기준을 완전히 적용한 상태가 아니며 client parse가 server 검증을 대신하지 않는다.

접근 경계도 같은 수준으로 구현돼 있지 않다. Expense 생성은 인증 userId를 사용하지만 입력의 부모 Trip·Schedule 소유자·삭제 여부·연결 관계를 조회해 검증하지 않는다. 수정의 scheduleId 연결도 같은 공백이 있다. Trip 수정·삭제는 선행 ownership 조회 뒤 mutation을 ID만으로 수행하고 선행 조회에 non-deleted 조건이 없다. Schedule의 부모 확인·scoped mutation을 이 경로의 현재 보장으로 확대하지 않는다. 이는 [Auth/User Scope](../../../.claude/rules/auth-user-scope.md)와 일반 조회·삭제 계약의 확인·보완 대상이며 새 허용 정책이 아니다.

생성·수정 body와 sync pull의 lastSyncedAt은 공유 schema를 검사하지만 대부분의 목록 query·path ID는 직접 사용한다. “요청을 검사한다”는 기준과 모든 입력 경계가 이미 검사된 상태는 다르다.

Expense `date`의 공유 입력 정규화·date-only 계약·기존 datetime 호환과 저장 경계는 [날짜와 시각](../common/date-and-time.md), 통화 분리·금액 정밀도는 [통화와 금액](../common/currency.md)에서 판단한다.

Expense·Schedule Local 조회와 mutation 반환도 날짜·시점 계약을 검사한다. 내부 행의 존재·소유권 확인은 반환 검사와 분리하며, mutation 결과 검사 실패는 commit 전에 행·큐를 함께 롤백한다. 세 entity Repository의 생성·수정 요청 검사는 Local/Remote 분기 전에 동일한 공유 schema를 적용한다.

Activation은 `activateTripResponse`, sync pull은 `syncPullResponseSchema`로 envelope와 세 entity를 첫 Local 쓰기 전에 검사한다. Pull checkpoint인 `serverTime`도 포함한다. Sync schema에서 DB Date 객체나 필수 Trip 날짜의 null 허용을 제거해 일반 API entity와 같은 JSON 계약을 사용한다. 검사 뒤 소유권 확인을 유지하며, 입수 검사를 pull 전체 transaction이나 DB 오류 처리의 재설계로 확대하지 않는다. 서버 pull의 `lastSyncedAt`도 query schema로 검사한 뒤 SQL 비교에 사용한다.

## Data Entity를 바꿀 때 repository와 query key 경계를 유지한다

Trip·Schedule·Expense는 `model/api/lib/repository/data/ui` 구조를 우선한다. 작은 보조 entity는 필요에 맞게 축소할 수 있지만 sync 대상 Data Entity의 repository와 query key 경계는 유지한다.

| 변경할 책임 | 시작 위치와 유지할 관계 |
| --- | --- |
| API 요청·응답 | `entities/*/api`: 일반 apiClient를 호출하고 공유 schema로 검사한다. |
| Local 저장 | `entities/*/lib`: SQLite 변경과 queue 추가를 같은 transaction에서 처리한다. [데이터 수명](data-lifecycle/INDEX.md)의 보호 조건을 따른다. |
| Local/Remote 선택 | `entities/*/repository`: Activation Router를 통해 분기한다. 화면·data hook이 직접 저장소를 고르지 않는다. |
| Query cache | `entities/*/data/keys.ts`와 조회·mutation hook: repository를 호출하고 key factory로 같은 데이터의 캐시를 식별한다. 성공 뒤 영향받는 key를 invalidate한다. |

Activation/deactivation은 Trip 하나만 바뀐 작업처럼 취급하지 않고 Schedule·Expense·Route key까지 영향 관계를 확인한다. 조회 hook의 데이터 책임과 feature의 Policy 조합, 최초 실패·갱신 실패·정상 빈 결과, 취소 뒤 갱신·연결 복귀의 차이는 [여행 접근](travel-access/INDEX.md)이 소유한다. 현재 계층 예외와 제한적 조회 재사용은 [개발 기준](development-boundaries/layers.md)에서 판단한다.

## 인증 전송을 바꾸면 갱신 호출의 독립성과 세션 수명을 유지한다

[axios-instances](../../../apps/client/src/shared/api/axios-instances.ts)는 interceptor 없는 authAxios와 적용 대상 apiAxios를 만든다. 일반 [fetcher](../../../apps/client/src/shared/api/fetcher.ts)는 apiAxios에 인증 처리와 응답 unwrap·APIError 변환을 붙인다. 현재 refresh 경로는 `fetcher → auth-interceptor → auth-transport → authAxios`다. auth-api 자체는 일반 apiClient도 import하므로 옛 파일 이름만 보고 refresh의 독립성을 판단하지 않는다.

갱신 요청이 인증 interceptor가 붙은 client를 다시 호출하면 순환 의존·재귀 갱신을 만들 수 있다. [auth-transport](../../../apps/client/src/shared/services/auth/auth-transport.ts)는 authAxios로 refresh하고 공유 response를 검사한다. 일반 API와 sync는 같은 [auth-interceptor](../../../apps/client/src/shared/services/auth/auth-interceptor.ts)를 사용해 요청 시점 session을 확인하고, 첫 401 뒤 갱신·한 번 재전송한다. 재전송도 401이거나 갱신이 401/403으로 거부되거나 갱신 수단이 없으면 재인증 필요로 처리한다. 통신 실패·5xx를 인증 거부로 확정하지 않는다. session 교체 뒤 응답 적용과 Local 보존의 전체 책임은 [앱 실행·세션](../current/app-runtime/INDEX.md)을 따른다.

[Sync client](../../../apps/client/src/shared/services/sync/api.ts)는 별도 instance와 15초 timeout, 5xx 최대 3회 재시도(2·4·8초)를 유지한다. 일반 API의 10초 timeout·응답 unwrap·APIError 변환과는 다르지만, 401 갱신은 공유한다. sync가 무조건 갱신 없이 401을 반환한다는 옛 설명은 현재와 다르다. Sync는 AxiosResponse를 유지하므로 pull engine이 response.data를 검사하며, push는 개별 REST create/update/delete를 호출하고 성공 body를 일반 entity API처럼 parse하지 않는다. `/api/sync/push`는 인증 후 501을 반환하는 stub이며 endpoint 상수의 존재가 bulk push 구현을 뜻하지 않는다.

## 변경 전후에는 주장에 맞는 검사를 선택한다

Schema·serializer·route 중 하나를 바꾸면 선언과 실제 소비자를 함께 대조한다. Schedule 시간 변환처럼 같은 책임이 여러 응답 경로에 있으면 한 경로의 성공만으로 전체 적용을 주장하지 않는다.

- Serializer 단위 검사는 순수 DB row → entity 변환을 확인한다.
- Vitest와 Supertest를 사용한 route 계약 검사는 실제 Express middleware·router·status·JSON·schema 경계를 확인한다. DB와 auth module을 대체했다면 실제 SQL·JWT는 입증하지 않는다.
- Ownership·soft-delete query는 다른 사용자, 삭제된 부모·자식과 scoped mutation을 넣은 격리 PostgreSQL 검사로 확인한다.
- Client API mock 검사는 request의 HTTP 전 실패, response parse 실패, HTTP 횟수와 오류 전달을 확인하지만 Axios interceptor의 실제 네트워크 동작이나 React Native 화면을 입증하지 않는다.

현재 검증 진입점은 [client Expense API test](../../../apps/client/tests/entities/expense/api/expenses.test.ts), [날짜·시각 Local·입수 경계 SQLite test](../../../apps/client/tests/entities/temporal-local-contracts.test.ts), [Schedule route 계약 test](../../../apps/server/tests/routes/schedules.response-contract.test.ts), [Schedule serializer test](../../../apps/server/tests/serializers/schedule.test.ts), [Schedule PostgreSQL integration test](../../../apps/server/tests/integration/schedules.access-boundary.test.ts)다. SQLite 검사는 실제 SQL·rollback을 실행하지만 기기 SQLite binding과 HTTP·지도 서비스는 대역을 사용한다. 정확한 dependency 버전과 과거 실행 수치는 package 설정과 Workspace 기록이 소유한다.

Trip·Expense도 serializer를 사용하지만 위에서 밝힌 envelope·입력·접근 차이는 남아 있다. 실제 JWT·외부 인증 서비스·PostgreSQL·배포 process는 각각의 실행 근거가 필요하다. 선택 이유·과거 검증에서 이어받을 범위와 정정 근거는 [형성 자료](_background/api-contracts/README.md)에서 찾는다.
