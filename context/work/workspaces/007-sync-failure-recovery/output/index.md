# 산출물과 읽을 이유

| 산출물 | 상태 | 언제 읽는가 |
| --- | --- | --- |
| [schedules.ts](../../../../../apps/server/src/routes/schedules.ts), [expenses.ts](../../../../../apps/server/src/routes/expenses.ts)의 생성·삭제 route | 커밋 `ba91d1a3`. Ticket 01 | 재전송 응답의 현재 구현을 확인할 때 |
| [route 단위 테스트](../../../../../apps/server/tests/routes/replay.idempotency.test.ts), [PostgreSQL 통합 테스트](../../../../../apps/server/tests/integration/replay.idempotency.test.ts), [테스트 DB 대역](../../../../../apps/server/tests/support/test-app.ts) | 커밋 `ba91d1a3`. 생성·삭제·여행 삭제 재전송 | Ticket 01의 확인 근거를 다시 실행할 때 |
| [queue.ts](../../../../../apps/client/src/shared/services/sync/queue.ts), [engine.ts](../../../../../apps/client/src/shared/services/sync/engine.ts) | 커밋 `437cc5c7`. Ticket 02 | 큐 되돌림·재시도 선택의 현재 구현을 확인할 때 |
| [local-access.test.ts](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts), [retry.test.ts](../../../../../apps/client/tests/shared/services/sync/retry.test.ts) 외 sync 테스트 2개 | 커밋 `437cc5c7` | Ticket 02의 확인 근거를 다시 실행할 때 |
| [API 계약의 큐 작업 재전송 절](../../../../project/guidance/api-contracts.md#큐-작업-재전송에는-이미-반영된-결과로-응답한다), [데이터 수명의 push 절](../../../../project/guidance/data-lifecycle/INDEX.md#push를-바꾸면-전송-상태와-두-종류의-재시도를-구별한다) | 커밋 `7f8cb819`. Ticket 01·02의 Project 반영. 간격 재시도 보류 문장은 `c8ab78b2` | 1단계 뒤의 지속 계약을 확인할 때 |
| [데이터 수명의 형성 자료](../../../../project/guidance/data-lifecycle/_background/README.md), [API 계약의 형성 자료](../../../../project/guidance/_background/api-contracts/README.md) | 재시도 한도 제거·IN_PROGRESS 되돌림·간격 재시도 보류와 재전송 응답의 선택 이유·근거. 2026-11-03 보완, 커밋 `74a402a4` | 위 계약을 바꾸거나 선택을 다시 판단할 때 |
| [Ticket 08 계정 검사](../../../../../apps/client/src/shared/services/auth/local-account.ts), [queue 처리](../../../../../apps/client/src/shared/services/sync/queue.ts), [client DB schema](../../../../../apps/client/src/shared/db/schema.ts), [공유 queue 상태 정의](../../../../../packages/schema/src/sync/sync-queue.ts), [로그아웃 검사](../../../../../apps/client/src/shared/services/auth/logout-service.ts), [vacuum](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts) | 3종 QUARANTINED 구현은 로컬 커밋 `06cebd6f`·미배포. 2026-11-07 새 여행·일정·경비 DELETE에 검증된 `userId`를 원자적으로 저장하고 계정 검사에 사용하는 후속 구현과 회귀 검사를 로컬 커밋 `30783ccb`에 저장. 구버전 DELETE의 보존·폐기 규칙은 열려 있음 | 원본 없는 큐 작업의 보존·전송 제외·계정 보호와 새 DELETE 소유권 근거를 확인할 때 |
| [Ticket 08 회귀 검사](../../../../../apps/client/tests/shared/services/auth/orphaned-queue.test.ts), [기존 계정 회귀 검사](../../../../../apps/client/tests/shared/services/auth/local-access.test.ts), [sync 회귀 검사](../../../../../apps/client/tests/shared/services/sync/retry.test.ts)와 관련 sync 테스트 | 격리 보완 뒤 client 677개가 통과했다. 소유자 저장 구현 뒤에는 실제 SQLite에서 소유자 기록·다른 계정 차단·저장 실패 rollback을 확인하고 client 691개와 iOS 개발 번들이 통과했다고 Main이 보고. 이어 iPhone 15 Pro 시뮬레이터에서 일정의 기기 원본만 제거한 뒤 저장된 `userId`로 로컬 개발 서버 PostgreSQL에 삭제를 반영하고 큐가 0건이 되는 경로를 확인했으며 691개 테스트도 다시 통과. 전체 typecheck에는 기존 오류 8개가 남고, 실제 1.0.1 업데이트·물리 기기 UI·다른 계정 실제 로그인 전환은 미확인 | Ticket 08의 공유 schema 일치, 격리·소유권 근거 동작과 확인 한계를 다시 판단할 때 |
| [verify.json](../verify.json)과 [Verify receipt](../records/receipts/verify/) | Ticket 03. 서버 재전송 route 단위 테스트의 claim, 2026-11-03 `verification_passed` | 서버 재전송 경로가 Verify 뒤에 바뀌었는지 Recover로 확인하거나 다시 실행할 때 |

배포 경과와 결과는 [배포 기록](../records/2026-11-03-08-release-deploy-and-build-13.md)에 있다. 새 산출물이 생기면 이 표에 canonical 경로를 연결하며 복제하지 않는다.

이 표에 있다는 사실은 검증 통과나 사용자 수락을 뜻하지 않는다. 진행은 [state](../current/state/index.md)를 따른다.
