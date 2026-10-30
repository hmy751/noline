# 현재 산출물

현재 실행 기준은 [Project Context 보완 Spec](../current/memory/index.md)과 [세 Ticket](../current/memory/tickets/index.md)이다. [실제 작업·Context 대응](../records/2026-10-30-08-context-coverage-reassessment.md)은 보완 대상과 이미 반영된 의미를 비교한 근거다. 아래에서 실제 반영한 Project 본문을 찾는다.

[앱 실행·세션·데이터 보존 본문](../../../../project/current/app-runtime/INDEX.md)은 앱 준비·재인증·로그인·종료의 현재 관계와 실패 시 보존 범위를 설명한다. [형성 맥락](../../../../project/current/app-runtime/_background/context.md)은 선택 이유와 대체 관계를 보존하고, [현재 구조](../../../../project/current/architecture.md)와 Project·client 진입이 본문을 연결한다. 04의 대조·확인 범위는 [실행 기록](../records/2026-10-30-11-app-runtime-context.md)에 있다.

기존 결과로 저장 용량 Hook의 책임 분리 유지와 읽기 순서·검사 보완을 보존한다. 코드·테스트 보완 커밋은 `15ce9b4`다. [Hook](../../../../../apps/client/src/features/profile/hooks/useStorageStats.ts)과 [테스트](../../../../../apps/client/tests/features/profile/hooks/useStorageStats.test.ts)가 실제 산출물이며, [검토](../records/2026-10-30-04-storage-stats-review.md)와 [구현·검증](../records/2026-10-30-05-storage-stats-improvement.md)에 근거가 있다. 기존 책임 분리 전체는 002의 결과다.
