# 성공 요청 ACK와 확정 삭제 정리의 중복 제거

[선언적 수신 흐름](2026-11-13-01-declarative-reconcile-flow.md)을 설명한 뒤 사용자는 reconcile의 큐 정리가 기존 sync 처리와 겹치는지 물었다. Main은 일반 CREATE/UPDATE 성공과 pull도 reconcile을 사용하며, 성공 요청 ACK는 기존 책임을 수신 트랜잭션 안으로 옮긴 것이라고 설명했다. 직접 점검에서는 production에서 쓰지 않는 `deleteTask`와, DELETE 2xx·tombstone UPDATE의 같은 트랜잭션 내 재삭제 잔재를 구별했다. 별도 검토자 `review_sync_queue_ownership`도 같은 범위를 확인했다고 Main이 전달했다.

사용자는 다음과 같이 좁은 정리를 승인했다.

> 아 이해했어 아예 옮긴거구나 그래 이해됐고 겹치는 부분만 정리하자 간단히

이번 목표는 ACK 정책을 새로 설계하거나 3단계에 착수하는 일이 아니다. 성공 응답의 해당 요청을 한 번만 제거하고, 서버 삭제 증거에 따라 다른 미완료 입력을 정리하는 기존 조건은 유지한다.

## 실제 변경과 보존 경계

- [queue.ts](../../../../../apps/client/src/shared/services/sync/queue.ts)의 미사용 `deleteTask`를 제거했다. 이를 사용하던 테스트 import·mock·assertion은 실제 수신 진입을 기준으로 정리했다.
- [confirmed-deletion.ts](../../../../../apps/client/src/shared/services/sync/confirmed-deletion.ts)의 마지막 인자를 `{ completedTaskId?, confirmedTaskId? }`로 구별했다. `completedTaskId`는 2xx 요청의 최종 ACK를 호출자가 맡으므로 관련 요청 정리에서 제외한다는 뜻이다. `confirmedTaskId`는 해당 요청이 받은 410을 입력의 서버 검사 증거로 사용하는 기존 의미다.
- [reconcile.ts](../../../../../apps/client/src/shared/services/sync/reconcile.ts)는 tombstone 응답에서 완료 요청 ID를 전달하고 기존 마지막 ACK를 유지한다. [engine.ts](../../../../../apps/client/src/shared/services/sync/engine.ts)의 DELETE 2xx도 같은 방식을 쓰며, 410은 `confirmedTaskId`로 전달한다.

CREATE tombstone은 기존부터 일반 관련 입력 정리에서 남기는 경우가 있으므로 최종 ACK를 없애면 안 된다. 이번에는 완료된 CREATE/UPDATE/DELETE 요청을 삭제 정리에서 제외하고 호출자가 한 번 ACK하도록 맞췄다. 다른 미완료 입력의 보존·삭제 조건, 원시 payload·소유권·삭제 증거 및 같은 트랜잭션의 rollback 경계는 유지한다.

수정 범위는 소스 4개·검사 7개다. 정확한 목록과 전후 차이는 `/tmp/noline-ack-cleanup-files.txt`, `/tmp/noline-ack-cleanup.patch`에 있다. [reconciliation 검사](../../../../../apps/client/tests/shared/services/sync/reconciliation.test.ts)에 CREATE/UPDATE/DELETE 삭제 확인 성공 응답별로 큐 삭제 호출이 한 번이고 완료 요청이 사라지는 세 사례를 추가했다.

## 확인과 남은 범위

Main의 최종 자기검사는 관련 9묶음 **145/145 통과**다(`/tmp/noline-ack-cleanup-tests-final.log`). 변경 11파일 lint는 **오류 0·경고 0**이며(`/tmp/noline-ack-cleanup-lint-final.log`), 타입 로그(`/tmp/noline-ack-cleanup-types.log`)는 앞선 기준선과 동일하고 기존 오류 7개가 남는다. 앞선 선언적 구성의 158개·독립 9개와 이번 검사 수치를 합산하지 않는다.

독립 검증자 `verify_ack_cleanup`는 추가 probe **3/3 통과**를 확인했고 발견한 문제는 없다고 반환했다. `/tmp/noline-independent-ack-probe.log`와 `/tmp/noline-independent-ack-probe.test.ts`에 근거를 남겼으며 해당 실행의 기존 45개 skipped를 통과 수에 포함하지 않는다.

- 일정 tombstone의 최종 ACK 실패 시 서버 확인본·Local 일정·경비 연결·큐가 함께 rollback됐다.
- 여행 tombstone의 최종 ACK 실패 시 자식 cascade를 포함한 변경 전체가 rollback됐다.
- 여행 2xx는 정리 가능한 관련 요청만 제거하고 손상 payload·QUARANTINED 입력은 보존했다.

CREATE/UPDATE/DELETE의 단일 제거와 410의 서버 검사 증거에 따른 종결은 기존 suite 본문을 대조해 근거를 재사용했다. 모든 호출부의 새 options와 `deleteTask` 참조 0, 타입 기준선 동일함도 확인했다. 이번 좁은 정리의 구현·자기 확인·독립 검증을 마쳤고 결과 설명으로 이어간다. native·실제 HTTP·UI 렌더링·앱 중단 복구는 이번 확인 범위가 아니며, 3단계·스킬·Personal·다른 Workspace·커밋·배포도 이번 작업으로 진행하지 않는다.

## 입력 범위

이번 후속의 사용자 원문과 앞선 큐 책임 점검·검토 결과는 Main이 기록 담당에게 전달했다. 기록 담당은 전달된 원문, 실제 diff·파일 목록·최종 145개·독립 3개 로그와 기존 01번 기록·Ticket·current를 대조했다. 타입 로그가 이전 기준선과 같은 것도 직접 확인했다. 해당 후속 대화 전체를 별도 rollout에서 복원하거나 제품 검사를 직접 실행한 것으로 기록하지 않는다.
