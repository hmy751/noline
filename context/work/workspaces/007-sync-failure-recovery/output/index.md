# 산출물과 읽을 이유

| 산출물 | 상태 | 언제 읽는가 |
| --- | --- | --- |
| [schedules.ts](../../../../../apps/server/src/routes/schedules.ts), [expenses.ts](../../../../../apps/server/src/routes/expenses.ts)의 생성 route | 작업 트리, 미커밋. Ticket 01의 생성 재전송 부분 | Ticket 01을 이어 가거나 재전송 응답의 현재 구현을 확인할 때 |
| [route 단위 테스트](../../../../../apps/server/tests/routes/create.idempotency.test.ts), [PostgreSQL 통합 테스트](../../../../../apps/server/tests/integration/create.idempotency.test.ts), [테스트 DB 대역](../../../../../apps/server/tests/support/test-app.ts) | 작업 트리, 미커밋 | Ticket 01의 확인 근거를 다시 실행할 때 |

나머지 산출물은 아직 없다. 삭제 재전송, 앱 큐 변경, Project 문서 갱신이 이에 해당한다. 산출물이 생기면 이 표에 canonical 경로를 연결하며 복제하지 않는다.

이 표에 있다는 사실은 검증 통과나 사용자 수락을 뜻하지 않는다. 진행은 [state](../current/state/index.md)를 따른다.
