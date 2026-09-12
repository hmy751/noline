# 13 — 미전송 데이터 보존과 파괴적 정리

## 맡은 결과와 범위

여행 비활성화, 지연 cleanup, logout과 계정 삭제가 “서버에 아직 반영되지 않은 작업”을 같은 의미로 판별하고, force 없는 경로에서 그 데이터를 삭제하지 않게 한다. 즉시·지연 cleanup의 공통 local 정리 책임은 한 곳에서 수정할 수 있게 하되 서버 실패 이후 순서, force 여부와 부분 실패 차이는 숨기지 않는다.

범위는 sync queue의 여행별 조회, cleanup job, `useDeactivateTrip`, logout service와 관련 local cleanup·test다. queue 상태와 실행 결과는 [12번](12-sync-result-retry-pull-types.md), local write 원자성은 [11번](11-local-mutation-router-transaction.md)이 선행한다.

## 실행 맥락과 접근

현재 여행별 조회는 `PENDING`만 보므로 `IN_PROGRESS`와 `FAILED` 작업을 미전송 데이터에서 제외한다. 이 결과를 사용하는 비활성화·cleanup은 전송 실패가 남아도 정리 가능하다고 판단할 수 있고, 실제 정리를 건너뛴 경우에도 processed count가 증가할 수 있다. 즉시 정리와 지연 정리는 같은 DB 변경을 서로 다른 위치에 구현한다. logout의 경고 의미도 failed queue를 충분히 반영하지 않는다.

여행별 미전송 조회가 `PENDING`만 보는 문제는 기존 분리 실험에서 재현된 데이터 보존 결함이다. processed count와 logout 경고의 실제 사용자 결과는 정적 코드 관찰 뒤 실행 확인이 더 필요하다. Main은 재현 결함을 별도 Work에서 해결하거나 이 Ticket에 동작 수정 권한을 추가받아야 하며, 추가 후보도 재현되면 같은 방식으로 담당을 정한다. 11·12 또는 데이터 보존 결함이 미해결이면 안전한 cleanup 결과를 완료로 닫지 않는다.

## 완료 조건과 확인 방법

- `PENDING`, `IN_PROGRESS`, `FAILED`, 혼합 상태와 legacy/malformed payload에서 여행별 미전송 여부가 한 predicate로 일관된다.
- force 없는 비활성화·cleanup·logout/account deletion 경로는 미전송 row를 soft/hard delete하지 않으며 force 경로의 의미는 호출부에서 명시된다.
- 실제 정리를 수행한 경우만 processed로 집계하고 map cleanup 등 부분 실패의 결과가 caller에게 설명 가능한 형태로 전달된다.
- 즉시·지연 cleanup은 같은 local operation을 사용하고, 서버 실패 뒤 계속/중단과 인증 제거·cache clear 순서의 차이는 보존한다.
- SQLite integration과 service test, 관련 정적 검사를 실행하고 실제 계정/서버 호출 미확인을 구별한다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 구현·검증은 시작하지 않았다. 여행별 미전송 조회는 재현 결함으로 미배정이며, processed count와 logout 경고는 동작 확인 후 조건부 배치가 필요하다. 11·12가 선행하고 사용자 수락은 없다.
