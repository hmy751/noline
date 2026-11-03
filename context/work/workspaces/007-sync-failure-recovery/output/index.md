# 산출물과 읽을 이유

| 산출물 | 상태 | 언제 읽는가 |
| --- | --- | --- |
| [schedules.ts](../../../../../apps/server/src/routes/schedules.ts), [expenses.ts](../../../../../apps/server/src/routes/expenses.ts)의 생성·삭제 route | 커밋 `ba91d1a3`. Ticket 01 | 재전송 응답의 현재 구현을 확인할 때 |
| [route 단위 테스트](../../../../../apps/server/tests/routes/replay.idempotency.test.ts), [PostgreSQL 통합 테스트](../../../../../apps/server/tests/integration/replay.idempotency.test.ts), [테스트 DB 대역](../../../../../apps/server/tests/support/test-app.ts) | 커밋 `ba91d1a3`. 생성·삭제·여행 삭제 재전송 | Ticket 01의 확인 근거를 다시 실행할 때 |
| [queue.ts](../../../../../apps/client/src/shared/services/sync/queue.ts), [engine.ts](../../../../../apps/client/src/shared/services/sync/engine.ts) | 커밋 `437cc5c7`. Ticket 02 | 큐 되돌림·재시도 선택의 현재 구현을 확인할 때 |
| [local-access.test.ts](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts), [retry.test.ts](../../../../../apps/client/tests/shared/services/sync/retry.test.ts) 외 sync 테스트 2개 | 커밋 `437cc5c7` | Ticket 02의 확인 근거를 다시 실행할 때 |
| [API 계약의 큐 작업 재전송 절](../../../../project/guidance/api-contracts.md#큐-작업-재전송에는-이미-반영된-결과로-응답한다), [데이터 수명의 push 절](../../../../project/guidance/data-lifecycle/INDEX.md#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다) | 커밋 `7f8cb819`. Ticket 01·02의 Project 반영. 간격 재시도 보류 문장은 `c8ab78b2` | 1단계 뒤의 지속 계약을 확인할 때 |
| [데이터 수명의 형성 자료](../../../../project/guidance/data-lifecycle/_background/README.md), [API 계약의 형성 자료](../../../../project/guidance/_background/api-contracts/README.md) | 재시도 한도 제거·IN_PROGRESS 되돌림·간격 재시도 보류와 재전송 응답의 선택 이유·근거. 2026-11-03 뒤늦게 보완, 커밋 `74a402a4` | 위 계약을 바꾸거나 선택을 다시 판단할 때 |
| [verify.json](../verify.json)과 [Verify receipt](../records/receipts/verify/) | Ticket 03. 서버 재전송 route 단위 테스트의 claim, 2026-11-03 `verification_passed` | 서버 재전송 경로가 Verify 뒤에 바뀌었는지 Recover로 확인하거나 다시 실행할 때 |

배포 산출물(Ticket 05)은 아직 없다. 산출물이 생기면 이 표에 canonical 경로를 연결하며 복제하지 않는다.

이 표에 있다는 사실은 검증 통과나 사용자 수락을 뜻하지 않는다. 진행은 [state](../current/state/index.md)를 따른다.
