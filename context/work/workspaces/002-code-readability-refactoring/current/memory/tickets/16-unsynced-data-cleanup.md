# 16 — 미전송 데이터 보존과 파괴적 정리

## 맡은 결과와 범위

여행 비활성화, 지연 cleanup, logout과 계정 삭제가 “서버에 아직 반영되지 않은 작업”을 같은 의미로 판별하고, force 없는 경로에서 그 데이터를 삭제하지 않게 한다. 즉시·지연 cleanup의 공통 local 정리 책임은 한 곳에서 수정할 수 있게 하되 서버 실패 이후 순서, force 여부와 부분 실패 차이는 숨기지 않는다.

범위는 sync queue의 여행별 조회, cleanup job, `useDeactivateTrip`, logout service와 관련 local cleanup·test다. queue 상태와 실행 결과는 [15번](15-sync-result-retry-pull-types.md), local write 원자성은 [14번](14-local-mutation-router-transaction.md)이 선행한다.

## 실행 맥락과 접근

현재 여행별 조회는 `PENDING`만 보므로 `IN_PROGRESS`와 `FAILED` 작업을 미전송 데이터에서 제외한다. 이 결과를 사용하는 비활성화·cleanup은 전송 실패가 남아도 정리 가능하다고 판단할 수 있고, 실제 정리를 건너뛴 경우에도 processed count가 증가할 수 있다. 즉시 정리와 지연 정리는 같은 DB 변경을 서로 다른 위치에 구현한다. logout의 경고 의미도 failed queue를 충분히 반영하지 않는다.

미전송 조회와 부분 UPDATE의 여행 귀속은 [003-10](../../../../003-bug-investigation-and-fixes/current/memory/tickets/10-local-write-queue-safety.md), 재활성화 뒤 과거 cleanup 예약의 적용은 [003-04](../../../../003-bug-investigation-and-fixes/current/memory/tickets/04-activation-data-lifecycle.md), 계정 정리와 늦은 응답 격리는 [003-02](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md)가 맡는다. FAILED-only logout의 정리 호출과 재활성화된 일정의 삭제도 003에 분리 재현 근거가 있다. 실제 사용자 경고·processed count·부분 실패의 끝단 검증은 남아 있다.

이 Ticket은 확인된 미전송 predicate와 실제 정리 결과를 즉시·지연 cleanup·logout consumer가 같은 의미로 사용하도록 책임을 정리한다. [06번](06-app-startup-lifecycle.md)은 시작 접점만 맡으며 정리 허용 판단을 소유하지 않는다. 14·15 또는 003의 직접 관련 보존 결함이 미해결이면 독립적인 특성화·공통 책임 정리는 가능해도 안전한 cleanup 결과를 완료로 닫지 않는다.

## 완료 조건과 확인 방법

- `PENDING`, `IN_PROGRESS`, `FAILED`, 혼합 상태와 legacy/malformed payload에서 여행별 미전송 여부가 한 predicate로 일관된다.
- force 없는 비활성화·cleanup·logout/account deletion 경로는 미전송 row를 soft/hard delete하지 않으며 force 경로의 의미는 호출부에서 명시된다.
- 실제 정리를 수행한 경우만 processed로 집계하고 map cleanup 등 부분 실패의 결과가 caller에게 설명 가능한 형태로 전달된다.
- 즉시·지연 cleanup은 같은 local operation을 사용하고, 서버 실패 뒤 계속/중단과 인증 제거·cache clear 순서의 차이는 보존한다.
- SQLite integration과 service test, 관련 정적 검사를 실행하고 실제 계정/서버 호출 미확인을 구별한다.

## 현재 상태와 실제 결과

기존 13을 16으로 옮기고 003-02·04·10과 연결했다. 제품 구현·검증·수락은 없고, 14·15의 미전송·결과 계약과 관련 결함 수정이 안전한 정리 완료에 필요하다. processed count·native 자원·실제 계정 호출은 후속 검증 범위다.
