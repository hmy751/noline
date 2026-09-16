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

기존 11을 14로 옮긴 결과를 유지하며, 2026-09-16에는 06과 겹치는 Router·inactive child 정상화의 담당 관계를 갱신했다. 제품 구현·검증·사용자 수락은 아직 없다. 06의 실제 inactive API 결과와 이 Ticket의 실제 드라이버·SQLite 원자성 완료 근거가 각각 필요하다.
