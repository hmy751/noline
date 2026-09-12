# 11 — Data Entity local mutation·Router·transaction 계약

## 맡은 결과와 범위

Trip·Schedule·Expense mutation에서 활성 여행의 local write와 `sync_queue` 추가가 실제 transaction 안에서 원자적으로 실행되고, 비활성 여행의 remote 경로가 숨은 local 선행 조회에 의존하지 않게 한다. 검증한 entity·수정 필드·update 결과의 존재가 타입으로 이어져 `any`와 non-null assertion 없이 Router와 datasource의 책임을 읽을 수 있게 한다.

범위는 client의 Trip/Schedule/Expense repository·data hook·local datasource, `withTransaction`, `sync_queue` 추가와 관련 integration test다. sync 실행 결과는 [12번](12-sync-result-retry-pull-types.md), 미전송 데이터 정리는 [13번](13-unsynced-data-cleanup.md)이 맡으며 두 Ticket의 안전 주장에 이 결과가 선행한다.

## 실행 맥락과 접근

기존 분리 실험에서는 `withTransaction` callback 내부 local write와 queue 추가가 전역 `db`를 사용해 rollback 원자성이 깨지는 결함이 재현됐다. 정적 코드 대조에서는 Schedule·Expense update/delete가 Router 판단 전에 local DB에서 `tripId`를 읽으므로 비활성 여행의 remote mutation이 local row에 의존할 가능성이 보이지만 실제 active/inactive 경로 재현은 아직 필요하다. local update는 결과를 non-null로 단언하고 queue update payload 일부는 `any`다.

transaction은 표현 문제가 아니라 재현된 동작 결함이다. inactive child mutation은 먼저 route fixture로 실제 결과를 확인할 후보다. Workspace Spec은 버그 수정을 자동 포함하지 않으므로 Main은 transaction 결함과 재현된 Router 결함을 별도 Work에 배치하거나, 사용자가 이 Ticket에 동작 수정 권한을 추가했음을 확인해야 한다. 해당 결과가 해결되지 않으면 타입·이름의 일부 정리는 가능해도 이 Ticket의 원자성·Router 결과를 완료로 선언할 수 없다.

## 완료 조건과 확인 방법

- queue insert 실패 시 entity write가 남지 않고 entity write 실패 시 queue item이 생기지 않는 실제 SQLite transaction 결과를 확인한다.
- active/local, inactive/remote, offline inactive 거부, entity 없음의 mutation 경로가 Activation Router 계약대로 선택된다.
- child entity의 `tripId`는 호출 경계부터 Router 판단까지 검증된 값으로 전달되고 local 조회는 local 실행에서만 필요한 책임으로 남는다.
- update 결과 부재와 허용 수정 필드가 타입·명시적 오류로 드러나며 `updated!`, queue payload와 status 조립의 무근거 `any`가 남지 않는다.
- repository routing test와 SQLite integration test, 관련 정적 검사를 실행한다. mock test만으로 rollback을 입증하지 않는다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 구현·검증은 시작하지 않았다. transaction은 재현 결함으로 미배정이며, 비활성 remote mutation은 정적 코드상 후보로 실제 재현과 조건부 책임 배치가 남아 있다. 사용자 수락은 없다.
