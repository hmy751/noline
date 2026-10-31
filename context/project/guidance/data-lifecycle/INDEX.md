# 저장한 변경을 전송하고 정리할 때의 기준

Trip·Schedule·Expense의 Local mutation, sync, 활성화·비활성화와 데이터 정리를 추가·수정·조사할 때 읽는다. **로컬 저장과 전송 기록은 함께 확정하고, 정리할 때는 서버에 반영하지 못한 변경과 그 원본을 보호한다.** PENDING이라는 상태명, 함수의 정상 반환, 활성화 배지만으로 전송·정리 완료를 판단하지 않는다. 아래에는 이 보존 계약과 현재 구현의 차이를 구별한다.

| 하려는 일 | 먼저 확인할 관계 |
| --- | --- |
| Entity 저장·삭제를 바꾼다 | [Local 변경과 queue의 원자성](#local-변경과-queue를-같이-확정한다), [삭제와 사본 정리의 차이](#사용자-삭제와-기기-사본-정리를-구별한다) |
| 동기화 실패·재시도·완료 표시를 바꾼다 | [push 상태와 재시도](#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다), [pull과 완료 범위](#pull과-완료-표시를-바꾸면-반영-경계를-확인한다) |
| 여행을 준비·전환·해제한다 | [활성화의 완료](#활성화할-때-데이터-입수와-지도-준비를-구별한다), [여행 정리 조건](#여행을-정리할-때-모든-미전송-상태와-현재-활성-여부를-확인한다) |
| 오래된 데이터나 계정 데이터를 비운다 | [vacuum](#오래된-행도-queue가-참조하면-보존한다), [계정 종료](#계정을-종료할-때-실행-종료와-전송-성공을-구별한다) |

## Local 변경과 queue를 같이 확정한다

활성 여행은 Local SQLite가 읽기·쓰기의 기준이고, `sync_queue`는 서버에 전달할 변경의 지속 기록이다. 연결이 끊겨도 저장을 마칠 수 있는 대신, 기기의 값과 서버가 같은 시점에 일치하지 않을 수 있다. 저장 성공은 로컬 행과 전송할 작업이 함께 남았다는 뜻이며 서버 반영 성공이 아니다.

Data Entity의 기본 책임은 `model`의 공유 schema 타입, `api`의 원격 호출, `lib`의 Local datasource, `repository`의 Activation Router 선택, `data`의 Query·mutation hook, `ui`의 Entity 표현으로 나뉜다. data hook·화면이 직접 DB/API를 선택하지 않는다. 새 여행의 생성은 서버에서 비활성 상태로 시작하며, 활성 여행의 수정과 자식 생성·변경은 Local 경로를 사용한다. 정확한 분기와 계정 전체 목록은 [여행 접근](../travel-access/INDEX.md#router와-계정-전체-여행-목록의-계약)을 따른다.

Local 쓰기를 만들면 Entity 변경과 `addToSyncQueue`를 같은 `withTransaction` 안에 둔다. ID는 `generateId()`로 생성하고 `createdAt`, `updatedAt`, `version`, `deletedAt`의 의미를 유지한다. 공유 schema가 필요한 반환 검증도 transaction 안에서 실패해야 잘못된 행과 queue가 함께 rollback된다. Schedule·Expense의 현재 생성·수정이 이 경계를 사용한다.

[DB 실행기](../../../../apps/client/src/shared/db/index.ts)는 async callback이 끝난 뒤 COMMIT하며 실패하면 ROLLBACK한다. transaction과 독립 `runDatabaseOperation`은 실행 큐를 공유해, 실패 transaction의 rollback이 동시에 접수한 sync upsert를 지우지 않게 한다. `runDatabaseOperation` 자체는 transaction이 아니다. transaction 내부 `addToSyncQueue`는 직접 insert하므로 이를 다시 같은 실행 큐에 넣어 자기 완료를 기다리게 만들지 않는다. 직접 DB 접근 전체가 이 조율에 자동 포함되는 것은 아니다.

새 queue payload는 서버 요청뿐 아니라 여행·계정 귀속을 복원할 수 있는지도 확인한다. 현재 child CREATE에는 tripId가 있고 DELETE는 `{ tripId }`를 남기지만 UPDATE는 전달받은 부분 필드만 기록하므로 tripId가 없을 수 있다. 계정 소유권 조회는 원본 행과 payload를 함께 사용하지만, 여행별 cleanup 조회는 payload만 보므로 같은 보장을 갖지 않는다. 이 차이는 [여행 정리의 현재 공백](#여행을-정리할-때-모든-미전송-상태와-현재-활성-여부를-확인한다)에서 다룬다.

Map/Search/Directions는 사용자 소유 Data Entity가 아니다. 이 서비스에 Activation Router나 `sync_queue`를 확대 적용하지 않고 [여행 접근의 서비스 정책](../travel-access/INDEX.md)을 사용한다.

## push를 바꾸면 전송 상태와 두 종류의 재시도를 구별한다

[engine](../../../../apps/client/src/shared/services/sync/engine.ts)은 queue의 변경을 각 Entity REST API에 보낸다. CREATE는 POST, UPDATE는 PUT, DELETE는 ID 경로의 DELETE다. `api.ts`에 선언된 `/api/sync/push`는 실제 전송 경로가 아니며 현재 서버 해당 route는 501을 반환한다.

| 상태·결과 | 현재 처리와 다음 판단 |
| --- | --- |
| PENDING | 아직 전송할 작업. 생성 시각 순으로 선택한다. |
| FAILED, retryCount < 3 | 다음 sync에서 다시 선택할 수 있다. |
| IN_PROGRESS 또는 재시도 한도에 도달한 FAILED | 그 작업부터 뒤를 건너뛰지 않는다. 중단된 IN_PROGRESS 자동 회수는 구현돼 있지 않다. |
| 서버 요청 성공 | 해당 queue 작업을 제거한다. 응답 전에 앱이 끊기는 경우의 중복 처리 보장은 별도 확인이 필요하다. |
| 일반 실패 | FAILED와 증가한 retryCount를 남기고 뒤 작업 전송을 중단한다. 남은 FAILED·IN_PROGRESS는 `SyncIncompleteError`로 전달한다. |
| 인증 오류 | 요청 중 인증 오류는 해당 작업을 PENDING으로 돌려 오류를 전달한다. 전송 전 계정 불일치·귀속 미확인도 요청을 막으며 queue를 폐기하지 않는다. |

FIFO 순서를 유지하는 비용은 앞의 막힌 작업이 뒤 작업도 지연한다는 점이다. 이 지연을 없애려고 뒤 작업부터 보내거나 queue를 비우면 같은 Entity의 생성·수정·삭제 순서와 미전송 보존을 깨뜨릴 수 있다. 실패 상태를 해결하는 정책 없이 ‘완료’로 바꾸지 않는다.

두 재시도는 별개다. [HTTP client](../../../../apps/client/src/shared/services/sync/api.ts)는 한 요청의 5xx를 2·4·8초 뒤 최대 세 번 재시도한다. 네트워크 오류는 이 재시도 대상이 아니다. queue의 retryCount는 그 요청이 최종 실패한 뒤 다음 sync에서 다시 전송할지를 정한다. 인증 refresh와 원래 요청 재전송은 [세션의 인증 처리](../../current/app-runtime/INDEX.md#서버의-인증-거부와-통신-실패를-구별한다)가 맡는다.

## pull과 완료 표시를 바꾸면 반영 경계를 확인한다

전체 sync는 push 다음 pull 순서다. 일반 push 실패·인증 중단은 pull까지 진행하지 않는다. 일부 push만 성공해도 성공한 서버 변경은 Query 갱신을 요청한다. 갱신 요청과 화면에 새 내용이 표시된 시점은 같지 않다.

pull은 현재 계정의 활성 여행 ID와 마지막 checkpoint를 서버에 보낸다. 서버는 사용자 소유 Trip 메타데이터와 해당 활성 여행의 Schedule·Expense 중 `updatedAt >= lastSyncedAt`인 행을 반환한다. 삭제 사실도 전달해야 하므로 sync 응답에는 soft-delete 행을 포함하며, 화면 목록의 `deletedAt IS NULL` 조건을 이 경로에 복사하지 않는다. 현재 client는 활성 여행이 없으면 pull 요청 자체를 생략한다.

응답의 envelope·모든 Entity·serverTime은 첫 Local 쓰기 전에 공유 schema로 검사하고 userId도 현재 계정과 대조한다. 이후 Trip·Schedule·Expense를 순차 upsert하고 Query 갱신 요청 뒤 서버 시각을 저장한다. 전체 schema 검증은 전체 DB 반영의 원자성을 뜻하지 않는다. 현재 upsert 전체를 한 transaction으로 묶지 않으며, 뒤 쓰기가 실패하면 앞의 반영이 남을 수 있다.

다음 차이는 아직 해결된 보장으로 읽지 않는다.

- **동시 Local 변경:** push가 고른 작업 이후 새 변경이 생길 수 있고, pull upsert는 미전송 queue·version을 비교해 충돌을 해결하지 않는다. 코드의 ‘Last-Write-Wins’ 주석만으로 합의된 충돌 정책이나 최신 값 승리를 뜻하지 않는다.
- **서버 시간 경계:** 서버는 조회 뒤 serverTime을 만든다. 조회 도중 쓰기와 다음 checkpoint 사이의 누락 방지는 실제 PostgreSQL 동시성 확인과 cursor 정책이 남아 있다.
- **완료 시각:** `executeSync`는 엔진이 정상 반환하면 `completed`와 메모리 성공 시각을 기록한다. 활성 여행이 없어 pull을 생략해도 push가 정상 종료하면 이에 해당한다. DB의 pull checkpoint는 실제 pull 반영 뒤에만 바뀐다. ‘인증 오류가 난 push를 완료로 표시하지 않는다’는 검사와 ‘pull 생략을 항상 skipped로 반환한다’는 주장은 다르다.
- **정리 결과:** push 뒤 pending cleanup의 오류는 로그로 남기고 무시할 수 있으며, 일부 cleanup·지도 정리 실패까지 sync 실패로 전달하는 구조는 아니다. completed를 모든 정리·화면 갱신·뒤에 추가된 변경의 완료로 표시하지 않는다.

자동·수동 실행의 조건과 중복 실행 방지는 `executeSync`가 공유한다. DB 준비·signed-in·실제 online·debug override 해제·일시 중단 여부를 실행 순간 확인한다. Provider의 주기 sync는 기본 활성화가 아니므로 queue 추가만으로 즉시 서버 전송이 보장된다고 설명하지 않는다. 세션 변경 중 잠금·대기는 [앱 실행](../../current/app-runtime/INDEX.md#실행-종료를-기다렸다는-것과-동기화-성공은-다르다)을 따른다.

## 활성화할 때 데이터 입수와 지도 준비를 구별한다

한 사용자에게 동시에 하나의 여행을 활성화하는 모델이며 기준은 `tripActivations`다. 현재 boolean 라우팅은 현재 계정의 `isActivated`를 확인한다. `offline-prep`는 코드 경로에 남은 이름이고 현재 라우터 이름은 Activation Router다.

[활성화 hook](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)은 서버 activate 응답을 검증하고, [날짜 계약](../../common/date-and-time.md)에 따라 마지막 여행일과 그 뒤 도시 달력 7일 전체가 끝난 다음 도시 날짜의 첫 유효 시점(보통 자정)을 만료 시각으로 계산한다. 이 유예 기간과 삭제 행의 vacuum 7일은 다른 기준이다. 같은 transaction에서 계정·세션을 다시 확인하고 Trip 메타데이터, 기존 활성 상태 해제, 대상 활성 metadata와 Schedule·Expense를 반영한다. 이후 지도·경로 다운로드를 백그라운드로 시작하고 관련 Query를 갱신한다. 이미 활성 여행이면 데이터 재입수 대신 Local 일정으로 경로 다운로드를 다시 요청한다.

`dataDownloaded=true`·`syncStatus='COMPLETED'`는 이 데이터 입수 상태다. 지도 다운로드 성공을 기다려 활성화하는 구조가 아니다. [metadata의 상세 배지](../../../../apps/client/src/shared/services/offline-prep/metadata.ts)에서 `ready`는 현재 mapDownloaded를 보며 모든 경로 준비의 증거가 아니다. 실제 지도 pack·경로 준비와 만료 정리는 [지도·경로 기준](../offline-maps-and-routes/INDEX.md)에서 native 자원·metadata·저장 경로의 차이를 별도로 확인한다. 만료 값이 존재한다는 사실만으로 Router가 시각마다 차단한다고 판단하지 않는다.

새 여행으로 전환하며 이전 isActivated를 내리는 작업은 이전 여행의 비활성화 hook·정리 전체를 호출하는 것과 다르다. 활성화의 upsert도 미전송 변경과 서버 값의 충돌을 해결하지 않는다. 재입수·전환을 바꾸면 기존 queue, 이전 cleanup 예약, 원본 행과 지도 작업의 관계를 함께 확인한다.

## 사용자 삭제와 기기 사본 정리를 구별한다

사용자의 Entity 삭제는 Local 행의 deletedAt과 DELETE queue를 함께 기록해 서버에도 삭제를 전달한다. 일반 조회에서는 숨기되 서버와 맞출 원본·전송 기록은 남긴다.

비활성화 뒤의 cleanup은 기기에 준비한 Schedule·Expense 사본을 정리하는 일이다. 현재 cleanup도 deletedAt·version을 바꾸지만 서버에 DELETE를 enqueue하지 않는다. 기기 저장 공간을 비우려다 서버 여행 기록까지 삭제하는 것으로 구현하지 않는다. Trip 기본 정보는 이 child cleanup 대상과 구별한다.

비활성화와 실제 삭제를 나눈 이유는 오프라인에서 전송 완료를 기다리게 하지 않으면서 미전송 변경을 보존하기 위해서다. soft delete 뒤 일정 기간 기다리는 비용은 저장 공간과 정리 상태 관리가 늘어난다는 것이다. 이 비용을 받아들여도 soft delete만으로 전송 안전이 자동 보장되지는 않는다. [형성 맥락](_background/context.md)은 즉시 hard delete·무기한 보존·동기화 대기와 비교한 이유를 보존한다.

## 여행을 정리할 때 모든 미전송 상태와 현재 활성 여부를 확인한다

보존 계약은 PENDING뿐 아니라 전송 중 IN_PROGRESS, 실패한 FAILED도 미전송 변경으로 보는 것이다. 귀속을 확인하지 못한 작업을 ‘이 여행에는 작업이 없음’으로 단정하거나, 다시 활성화한 여행에 과거 정리 예약을 그대로 적용하면 안 된다. **현재 여행별 구현은 이 계약을 모두 충족하지 못한다.**

[비활성화 hook](../../../../apps/client/src/entities/trip/data/useDeactivateTrip.ts)은 현재 Local 여행·활성 상태와 여행별 pending을 읽고, transaction에서 isActivated=false와 deactivatedAt을 기록한다. 기본값인 `cleanupData=false`면 child 사본을 남긴다. true이면 pending이 있다고 판정할 때 cleanupPending을 남기고, 없다고 판정하면 일정·경비를 soft delete한다. 즉시 정리 때만 지도도 정리한다. 서버 비활성화 알림은 best-effort로 실패해도 Local 상태를 되돌리지 않는다.

현재의 공백은 호출 경로별로 다음과 같다.

| 경계 | 현재 동작과 부족한 보호 |
| --- | --- |
| 여행별 queue 조회 | `getPendingTasksForTrip`은 PENDING만 조회한다. Trip은 recordId, child는 payload.tripId로 귀속을 찾으며 FAILED·IN_PROGRESS·부분 UPDATE·손상/legacy payload는 보호에서 빠질 수 있다. |
| 검사와 쓰기 | pending 검사가 정리 transaction보다 앞에 있다. transaction 자체의 원자성을 동시 Local 쓰기까지 포괄하는 정리 허용 검사로 확대할 수 없다. |
| 재활성화 | 신규 활성 레코드는 cleanupPending=false지만 기존 레코드의 재활성화 update에는 그 해제가 없다. pending cleanup도 isActivated를 다시 검사하지 않아 재활성 데이터에 옛 예약을 적용할 수 있다. |
| 처리 수·부분 실패 | pending 때문에 건너뛴 여행도 processedCount에 포함될 수 있다. 지도 실패·vacuum 실패는 무시될 수 있어 반환 수를 실제 삭제·전체 정리 성공 수로 쓰지 않는다. |

pending cleanup은 앱 준비 후 hook과 push 뒤 경로에서 요청하며 하나의 진행 중 실행을 공유한다. 그러나 이 공유는 여행별 보존 판정을 보완하지 않는다. `forceCleanupTrip`은 queue 확인을 건너뛰는 별도 위험 경로이며 일반 cleanup의 안전한 대체재가 아니다. 함수 존재를 사용자의 폐기 승인이나 계정 종료의 force와 같은 절차로 보지 않는다.

## 오래된 행도 queue가 참조하면 보존한다

[vacuum](../../../../apps/client/src/shared/services/sync/cleanup-job.ts)은 삭제된 지 `SOFT_DELETE_VACUUM_DAYS`(현재 7일)가 지난 일정·경비를 물리적으로 제거한다. 단, 같은 tableName·recordId를 참조하는 queue가 하나라도 있으면 상태와 관계없이 보존한다. 원본은 재전송뿐 아니라 계정 귀속 확인에도 필요하기 때문이다. 단순히 ‘7일 지났으면 삭제’하는 과거 예제를 사용하지 않는다.

이 보호는 앞 단계의 잘못된 soft delete나 재활성화 cleanup을 막는 것은 아니다. 현재 자동 경로도 pending cleanup 후보가 없으면 vacuum 전에 반환하므로 매 앱 시작이나 정확히 7일째에 공간이 회수된다고 보장할 수 없다. 기간 정책과 실행 계기를 바꾸면 queue 참조 보호·실제 삭제 시점·지도 파일 정리를 각각 확인한다.

## 계정을 종료할 때 실행 종료와 전송 성공을 구별한다

로그아웃·탈퇴는 sync → pending cleanup → 접수된 DB 작업 순으로 종료를 기다리고 새 작업을 잠시 막은 뒤 미전송 여부를 검사한다. 종료 대기는 전송 성공까지 강제하거나 새 sync를 실행하는 동작이 아니다. 일반 종료는 PENDING·IN_PROGRESS·FAILED 중 하나라도 있으면 서버 종료·DB 삭제 전에 보류하고 세션과 데이터를 유지한다.

명시적 폐기 확인의 force는 미전송 보류만 건너뛰며 실행 대기를 유지한다. 같은 계정의 재로그인은 DB와 queue를 보존한다. 다른 계정은 명시적 로그아웃을 거쳐야 하며 귀속 불명 데이터는 자동 폐기하지 않는다.

서버 로그아웃 실패는 Local 종료를 계속하지만 탈퇴 요청 실패는 Local 데이터를 유지한다. DB reset 실패는 인증 삭제 전 멈추고, reset 성공 뒤 인증 저장소 삭제가 실패하면 이미 비워진 DB와 남은 인증 처리가 다른 상태로 남을 수 있다. 서버·SQLite·SecureStore를 묶는 하나의 transaction이나 앱 강제 종료 후 재개 보장은 없다. 상세 실패 결과와 조율 범위는 [앱 실행의 계정 종료](../../current/app-runtime/INDEX.md#로그아웃탈퇴-남는-데이터와-후속-상태)를 따른다.

## 변경한 경계에 맞춰 확인한다

Local 쓰기는 실제 SQLite에서 queue insert 실패·반환 검증 실패의 rollback과 독립 upsert 간섭을 확인한다. push는 일반 실패·인증 오류·한도에 도달한 FAILED·남은 IN_PROGRESS·뒤 작업의 순서를 확인하며 HTTP 재시도와 queue 재시도를 나눈다. pull은 schema 실패 전 쓰기 없음, 중간 반영 실패, 동시 Local 변경과 서버 cursor를 구분해 확인한다.

정리 경로를 바꾸면 세 미전송 상태, tripId가 없는 부분 UPDATE·손상 payload, 재활성화, 검사 직후 새 저장, 지도 실패를 포함한다. 일반 종료·명시적 폐기·vacuum은 같은 predicate를 쓸 것이라고 가정하지 말고 실제 소비자를 각각 대조한다. Node 메모리 SQLite와 mock HTTP 검사는 Expo 기기 저장소·실제 서버 동시성·앱 중단 복구를 대신하지 않는다.

현재 사실은 2026-10-31의 [Local datasource](../../../../apps/client/src/entities/), [DB](../../../../apps/client/src/shared/db/), [queue](../../../../apps/client/src/shared/services/sync/queue.ts), [sync lifecycle](../../../../apps/client/src/shared/services/sync/lifecycle.ts), [서버 sync](../../../../apps/server/src/routes/sync.ts)를 대조했다. 관련 회귀 근거는 [DB transaction 검사](../../../../apps/client/tests/shared/db/transaction-serialization.test.ts), [sync 검사](../../../../apps/client/tests/shared/services/sync/), [Local 보존 검사](../../../../apps/client/tests/shared/services/auth/local-preservation.test.ts)에 있다. 제품 결함이 문서 반영만으로 해결된 것은 아니다.
