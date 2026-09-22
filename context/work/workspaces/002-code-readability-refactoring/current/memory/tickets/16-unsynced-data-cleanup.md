# 16 — 미전송 데이터 보존과 파괴적 정리

## 맡은 결과와 범위

여행 비활성화, 지연 cleanup, logout과 계정 삭제가 “서버에 아직 반영되지 않은 작업”을 같은 의미로 판별하고, force 없는 경로에서 그 데이터를 삭제하지 않게 한다. 즉시·지연 cleanup의 공통 local 정리 책임은 한 곳에서 수정할 수 있게 하되 서버 실패 이후 순서, force 여부와 부분 실패 차이는 숨기지 않는다.

범위는 sync queue의 여행별 조회, cleanup job, `useDeactivateTrip`, logout service와 관련 local cleanup·test다. queue 상태와 실행 결과는 [15번](15-sync-result-retry-pull-types.md), local write 원자성은 [14번](14-local-mutation-router-transaction.md)이 선행한다.

## 실행 맥락과 접근

구현 전 여행별 조회는 `PENDING`만 보므로 `IN_PROGRESS`와 `FAILED` 작업을 미전송 데이터에서 제외했다. 이 결과를 사용하는 비활성화·cleanup은 전송 실패가 남아도 정리 가능하다고 판단할 수 있고, 실제 정리를 건너뛴 경우에도 processed count가 증가할 수 있다. 즉시 정리와 지연 정리는 같은 DB 변경을 서로 다른 위치에 구현한다. logout의 경고 의미도 failed queue를 충분히 반영하지 않는다.

미전송 조회와 부분 UPDATE의 여행 귀속은 [003-10](../../../../003-bug-investigation-and-fixes/current/memory/tickets/10-local-write-queue-safety.md), 재활성화 뒤 과거 cleanup 예약의 적용은 [003-04](../../../../003-bug-investigation-and-fixes/current/memory/tickets/04-activation-data-lifecycle.md), 계정 전환·종료와 늦은 응답 격리는 [06번](06-app-startup-lifecycle.md)의 현재 구현·보완을 재사용하고 [003-02](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md)는 기존 근거로 연결한다. FAILED-only logout의 정리 호출과 재활성화된 일정의 삭제도 003에 분리 재현 근거가 있다. 실제 사용자 경고·processed count·부분 실패의 끝단 검증은 남아 있다.

이 Ticket은 확인된 미전송 predicate와 실제 정리 결과를 즉시·지연 cleanup·logout consumer가 같은 의미로 사용하도록 책임을 정리한다. [06번](06-app-startup-lifecycle.md)은 세션 시작·종료 조율과 계정 경계를 맡고, 미전송 판정과 정리 허용 기준은 이 Ticket의 공통 결과를 사용한다. 14·15 또는 003의 직접 관련 보존 결함이 미해결이면 독립적인 특성화·공통 책임 정리는 가능해도 안전한 cleanup 결과를 완료로 닫지 않는다.

## 완료 조건과 확인 방법

- `PENDING`, `IN_PROGRESS`, `FAILED`, 혼합 상태와 legacy/malformed payload에서 여행별 미전송 여부가 한 predicate로 일관된다.
- force 없는 비활성화·cleanup·logout/account deletion 경로는 미전송 row를 soft/hard delete하지 않으며 force 경로의 의미는 호출부에서 명시된다.
- 실제 정리를 수행한 경우만 processed로 집계하고 map cleanup 등 부분 실패의 결과가 caller에게 설명 가능한 형태로 전달된다.
- 즉시·지연 cleanup은 같은 local operation을 사용하고, 서버 실패 뒤 계속/중단과 인증 제거·cache clear 순서의 차이는 보존한다.
- SQLite integration과 service test, 관련 정적 검사를 실행하고 실제 계정/서버 호출 미확인을 구별한다.

## 현재 상태와 실제 결과

명시적 logout과 account deletion은 PENDING·IN_PROGRESS·FAILED를 미동기화 수량과 보류 조건에 포함한다. FAILED-only logout이 서버 요청·DB reset으로 진행하지 않는 service 회귀 검사를 통과했다. 같은 계정 재로그인은 데이터를 정리하지 않는다.

앞선 소스 검토의 두 위험은 실제 SQLite에서 재현하고 수정했다. 오래된 삭제 row도 sync_queue가 참조하면 vacuum에서 보존한다. 큐 상태와 무관하게 일정·경비 원본을 보호하며, 큐 제거 뒤에는 기존 기간 기준으로 삭제한다. 따라서 vacuum이 미전송 원본을 지워 같은 계정의 소유권 확인을 unresolved로 바꾸던 경로를 막는다.

로그아웃의 최초 확인 뒤 Local 변경이 성공하고 그대로 삭제되던 문제는 06의 전체 세션 변경 절차에서 해결했다. sync·cleanup 종료 후 새 transaction을 막고 접수된 저장을 기다린 뒤 미전송 여부를 확인한다. 보류·실패 뒤에는 저장 차단을 해제한다. DB·큐 삭제 및 스키마 재생성을 함께 롤백하는 보장은 14가 소유한다.

여행별 미전송 조회와 deactivation·cleanup은 아직 PENDING 중심이다. IN_PROGRESS·FAILED·legacy/malformed payload를 하나의 공통 predicate로 연결하고, 실제 정리한 경우만 processed로 집계하며, 즉시·지연 cleanup의 local operation을 합치는 일은 남는다. 이번 결과는 계정 종료·vacuum의 직접 재현 범위이며 Ticket 전체 데이터 보존 완료나 사용자 수락은 아니다.
