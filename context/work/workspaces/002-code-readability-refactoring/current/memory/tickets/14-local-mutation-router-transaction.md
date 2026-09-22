# 14 — Data Entity local mutation·Router·transaction 계약

## 맡은 결과와 범위

Trip·Schedule·Expense mutation에서 활성 여행의 local write와 `sync_queue` 추가가 실제 transaction 안에서 원자적으로 실행되고, 비활성 여행의 remote 경로가 숨은 local 선행 조회에 의존하지 않게 한다. 검증한 entity·수정 필드·update 결과의 존재가 타입으로 이어져 `any`와 non-null assertion 없이 Router와 datasource의 책임을 읽을 수 있게 한다.

범위는 client의 Trip/Schedule/Expense repository·data hook·local datasource, `withTransaction`, `sync_queue` 추가와 관련 integration test다. data hook의 entity별 cache invalidation 차이도 보존 계약으로 확인하며 저장 뒤 화면·callback 연결은 [13번](13-schedule-route-preparation.md)이 소비한다. sync 실행 결과는 [15번](15-sync-result-retry-pull-types.md), 미전송 데이터 정리는 [16번](16-unsynced-data-cleanup.md)이 맡으며 두 Ticket의 안전 주장에 이 결과가 선행한다.

## 실행 맥락과 접근

기존 분리 실험에서는 전역 `db`를 사용하는 write뿐 아니라 설치 Drizzle의 async callback 완료 전 commit도 확인했다. tx 인자를 전달하는 것만으로 원자성이 성립한다고 가정하지 않는다. [003-10](../../../../003-bug-investigation-and-fixes/current/memory/tickets/10-local-write-queue-safety.md)이 실제 드라이버·호출부와 부분 UPDATE·FAILED·IN_PROGRESS의 여행 귀속을 함께 맡는다. local update의 non-null 단언과 queue payload의 `any`도 이 검증된 계약을 타입으로 이어야 하는 구조 후보다.

비활성 child의 local row 부재로 remote 호출 전에 실패하는 조건은 [003-07](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)에 분리 재현 근거가 있다. 이후 2026-09-15~16 사용자 선택으로 [06번](06-app-startup-lifecycle.md)이 네트워크 정책 연결에 필요한 대상 여행별 분기와 inactive child의 Local 선조회 정상화를 함께 수행한다. 이 Ticket은 그 결과를 재사용하며 같은 수정을 003-07에서 다시 기다리거나 중복 수행하지 않는다. 나머지 repository·hook·datasource의 타입·cache 계약과 Local 원자성은 계속 이 Ticket의 결과다.

06의 Router 연결은 Local mutation·queue 원자성을 입증하지 않는다. 003-10의 실제 드라이버·부분 UPDATE 귀속 근거와 필요한 결과를 대조하고, 실제 SQLite 검증 전에는 원자성을 완료로 선언하지 않는다. 이 조정으로 sync·cleanup의 별도 결함까지 자동 흡수하지 않는다.

## 완료 조건과 확인 방법

- queue insert 실패 시 entity write가 남지 않고 entity write 실패 시 queue item이 생기지 않는 실제 SQLite transaction 결과를 확인한다.
- active/local, inactive/remote, offline·unknown inactive 거부, entity 없음의 mutation 경로가 Activation Router 계약대로 선택된다. 06의 debug 쓰기 차단을 포함한 기존 결과를 재사용하고 정상 활성 여행의 Local 쓰기와 구별한다.
- child entity의 `tripId`는 호출 경계부터 Router 판단까지 검증된 값으로 전달되고 local 조회는 local 실행에서만 필요한 책임으로 남는다.
- update 결과 부재와 허용 수정 필드가 타입·명시적 오류로 드러나며 `updated!`, queue payload와 status 조립의 무근거 `any`가 남지 않는다.
- 일정 삭제가 경비 cache도 무효화하는 등 entity별 갱신 대상·호출 횟수를 비교하고, 공통 mutation 형태로 맞추면서 필요한 차이를 지우지 않는다.
- repository routing test와 SQLite integration test, 관련 정적 검사를 실행한다. mock test만으로 rollback을 입증하지 않는다.

## 현재 상태와 실제 결과

06의 대상 여행별 Router 연결은 `f0f680e`로 커밋됐다. child repository가 호출부의 tripId를 받아 inactive Remote 전에 Local row를 요구하던 문제를 제거하고 Trip 단건도 대상 여행 기준으로 분기한다. local datasource는 활성·소유 조건을 계속 검사한다. Repository 직접 회귀 5개를 추가했으며 당시 Repository·Router 45개 test 통과를 Main이 보고했다.

DB 공통 경계는 `9936662`로 커밋됐다. async callback을 기다린 뒤 COMMIT/ROLLBACK하며, `serializeDatabaseOperation`과 `pendingDatabaseOperation`으로 transaction·독립 DB 작업을 직렬화한다. pull upsert, transaction 밖 queue 상태 변경·조회, sync metadata와 reset에 연결했다. transaction 내부 addToSyncQueue는 직접 실행해 재진입 대기로 인한 교착을 피한다. FAILED 재시도는 이 커밋에 넣지 않았다.

Node 메모리 SQLite에서 queue INSERT 실패 시 entity rollback과 실패 transaction 뒤 독립 upsert 보존을 검사하고 DB 전용 test로 분리했다. 이 커밋 시점의 전체 client 검사는 27개 suite·254개 test 통과였다. 이후 인증 소비 구조 시도를 되돌린 현재 작업 트리에서는 Main이 28개 suite·266개 test 통과를 다시 확인했다. 분할 검토의 선택 이유·Promise 동작·검증 경계는 [기록](../../../records/2026-09-21-01-auth-policy-split-review-and-commits.md)에서 읽는다.

실제 기기 SQLite, 모든 독립 DB write의 포괄 여부, update 결과·queue payload 타입과 entity별 cache invalidation은 남는다. 이 결과는 직접 재현한 원자성·rollback 간섭을 해결한 범위이며 Ticket 전체 구현·검증·수락은 아니다. 06의 세션 종료 연결에서 withDatabaseTransactionsPaused로 새 transaction을 거절하고 이미 접수한 저장을 기다린 뒤 미전송 여부를 확인한다. resetDatabase는 테이블·큐 삭제와 재생성을 하나의 SQLite transaction으로 묶어 재생성 실패도 롤백한다. Node SQLite 검사로 종료 직전 저장의 보존·신규 저장 거절·재생성 실패 후 원본과 큐 복구를 확인했다. 여행별 cleanup의 나머지 predicate는 16에 남는다.
