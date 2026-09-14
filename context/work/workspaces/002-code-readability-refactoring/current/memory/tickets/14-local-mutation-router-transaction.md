# 14 — Data Entity local mutation·Router·transaction 계약

## 맡은 결과와 범위

Trip·Schedule·Expense mutation에서 활성 여행의 local write와 `sync_queue` 추가가 실제 transaction 안에서 원자적으로 실행되고, 비활성 여행의 remote 경로가 숨은 local 선행 조회에 의존하지 않게 한다. 검증한 entity·수정 필드·update 결과의 존재가 타입으로 이어져 `any`와 non-null assertion 없이 Router와 datasource의 책임을 읽을 수 있게 한다.

범위는 client의 Trip/Schedule/Expense repository·data hook·local datasource, `withTransaction`, `sync_queue` 추가와 관련 integration test다. data hook의 entity별 cache invalidation 차이도 보존 계약으로 확인하며 저장 뒤 화면·callback 연결은 [13번](13-schedule-route-preparation.md)이 소비한다. sync 실행 결과는 [15번](15-sync-result-retry-pull-types.md), 미전송 데이터 정리는 [16번](16-unsynced-data-cleanup.md)이 맡으며 두 Ticket의 안전 주장에 이 결과가 선행한다.

## 실행 맥락과 접근

기존 분리 실험에서는 전역 `db`를 사용하는 write뿐 아니라 설치 Drizzle의 async callback 완료 전 commit도 확인했다. tx 인자를 전달하는 것만으로 원자성이 성립한다고 가정하지 않는다. [003-10](../../../../003-bug-investigation-and-fixes/current/memory/tickets/10-local-write-queue-safety.md)이 실제 드라이버·호출부와 부분 UPDATE·FAILED·IN_PROGRESS의 여행 귀속을 함께 맡는다. local update의 non-null 단언과 queue payload의 `any`도 이 검증된 계약을 타입으로 이어야 하는 구조 후보다.

비활성 child의 local row 부재로 remote 호출 전에 실패하는 조건은 [003-07](../../../../003-bug-investigation-and-fixes/current/memory/tickets/07-inactive-child-operations.md)에서 분리 재현됐고 해당 Ticket이 동작 수정을 맡는다. Workspace 002는 그 결과를 repository·hook·datasource의 명시적 책임과 타입으로 연결한다. 독립적인 특성화·타입 정리는 시작할 수 있지만 003-07·10의 관련 결함이 해결되지 않으면 이 Ticket의 원자성·Router 결과를 완료로 선언할 수 없다. 이번 재배치로 별도 Work의 수정 권한을 자동 가져오지 않는다.

## 완료 조건과 확인 방법

- queue insert 실패 시 entity write가 남지 않고 entity write 실패 시 queue item이 생기지 않는 실제 SQLite transaction 결과를 확인한다.
- active/local, inactive/remote, offline inactive 거부, entity 없음의 mutation 경로가 Activation Router 계약대로 선택된다.
- child entity의 `tripId`는 호출 경계부터 Router 판단까지 검증된 값으로 전달되고 local 조회는 local 실행에서만 필요한 책임으로 남는다.
- update 결과 부재와 허용 수정 필드가 타입·명시적 오류로 드러나며 `updated!`, queue payload와 status 조립의 무근거 `any`가 남지 않는다.
- 일정 삭제가 경비 cache도 무효화하는 등 entity별 갱신 대상·호출 횟수를 비교하고, 공통 mutation 형태로 맞추면서 필요한 차이를 지우지 않는다.
- repository routing test와 SQLite integration test, 관련 정적 검사를 실행한다. mock test만으로 rollback을 입증하지 않는다.

## 현재 상태와 실제 결과

기존 11을 14로 옮기고 003-07·10의 재현·담당 관계를 반영했다. 제품 구현·검증·사용자 수락은 없으며 실제 드라이버·SQLite와 inactive API 연결의 완료 근거가 필요하다.
