# 02. 앱 큐가 끊긴 작업과 반복 실패에서 회복하기

## 맡은 결과와 범위

동기화 중 앱이 종료되거나 일시 오류가 여러 번 쌓여도 작업이 영구히 막히지 않는다. 다음 동기화가 그 작업부터 다시 보낸다. 이전 앱에서 이미 막힌 작업(FAILED·retryCount 3)도 새 앱에서 다시 보내진다.

바꾸는 것:
- 동기화를 시작할 때 남아 있는 IN_PROGRESS를 PENDING으로 되돌린다.
- 실패 횟수로 작업을 막지 않는다. retryCount는 계속 센다.

그대로 두는 것:
- FIFO와 첫 실패에서 멈추기 (`engine.ts`의 `break`)
- 인증 오류의 PENDING 복귀
- HTTP client의 5xx 재시도

[데이터 수명](../../../../../../project/guidance/data-lifecycle/INDEX.md)의 push 상태표(48–55행)를 새 동작으로 고친다. "FAILED, retryCount < 3"과 "재시도 한도에 도달한 FAILED", "중단된 IN_PROGRESS 자동 회수는 구현돼 있지 않다" 칸이 대상이다. 같은 문서 129행의 확인 목록("한도에 도달한 FAILED")도 새 동작에 맞춘다. FIFO 비용 문장(57행)은 유지한다. 상태표는 Ticket 01도 고치므로 현재판에 이어 반영한다.

새 상태값, 새 DB 열, 새 화면, 새 전송 계기는 만들지 않는다. 실패 분류(거절 상태)는 풀어 줄 화면이 없으면 다시 영구 정지가 되므로 Ticket 06에서 함께 판단한다.

## 실행 맥락과 접근

- [queue.ts](../../../../../../../apps/client/src/shared/services/sync/queue.ts)의 `getSyncableTasks`(61–69행)가 `retryCount < 3` 조건으로 막힌 위치를 정한다. 이 조건을 "PENDING 또는 FAILED는 전송 가능, 그 밖은 막힘"으로 바꾼다.
- [engine.ts](../../../../../../../apps/client/src/shared/services/sync/engine.ts)의 `pushChanges`(69행부터)가 작업마다 IN_PROGRESS로 바꾸고, 실패하면 FAILED·retryCount+1로 바꾼 뒤 멈춘다. 되돌림은 `getSyncableTasks` 호출 전에 둔다. 위치는 엔진의 시작이나 큐 함수 중 실행하며 정한다.
- 되돌림이 안전한 근거: [lifecycle.ts](../../../../../../../apps/client/src/shared/services/sync/lifecycle.ts)의 `executeSync`가 한 번에 하나만 실행하고, `pushChanges`는 `syncData`를 통해서만 호출된다(2026-11-03 코드 검색). 그래서 전송을 시작하는 순간의 IN_PROGRESS는 지난 실행의 흔적이다.
- 같은 요청을 다시 보내도 안전한 것은 Ticket 01 덕분이다. 운영에서는 01의 서버 배포가 build 13보다 먼저여야 한다 (Ticket 05).
- 바꿀 기존 테스트:
  - [local-access.test.ts](../../../../../../../apps/client/tests/shared/services/auth/local-access.test.ts) 195행: "FAILED 작업은 3회 미만까지만 다음 sync 대상으로 복구한다"
  - [retry.test.ts](../../../../../../../apps/client/tests/shared/services/sync/retry.test.ts): 재전송·실패 시 멈춤 흐름
- 재시도 규칙의 대안이었던 "3회 한도 + 앱 재시작 때 초기화"는 기각했다. iOS는 앱을 오래 살려 두므로 연결이 자주 바뀌는 여행 중에 3번을 채우면 앱이 종료될 때까지 막힌다. 비교는 [설계 판단 기록](../../../records/2026-11-03-01-sync-failure-design-decisions.md#주제별-선택지-비교)에 있다.

## 완료 조건과 확인 방법

Jest로 다음을 확인한다.
- 남은 IN_PROGRESS가 다음 push에서 다시 전송된다.
- retryCount 3 이상인 FAILED가 다시 전송된다.
- 그 뒤에 있는 PENDING은 앞 작업이 성공한 뒤에만 전송된다.
- 실패하면 지금처럼 그 자리에서 멈추고 `SyncIncompleteError`를 낸다.
- 인증 오류는 PENDING으로 돌아간다.

client test와 typecheck가 통과한다. 데이터 수명 문서의 상태표가 새 동작을 설명한다. 3회 한도를 고정했던 테스트는 지우지 않고 새 계약을 고정하도록 바꾼다.

## 현재 상태와 실제 결과

실행 전. 1단계 진행 승인을 기다린다.
