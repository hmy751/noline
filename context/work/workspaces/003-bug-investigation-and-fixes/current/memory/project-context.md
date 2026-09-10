# 이 Work가 선택한 Project context

[Project README](../../../../../project/README.md)는 물리 layer와 authority를 찾는 진입점이다. 실제 판단 내용은 [제품 의미와 공통 기준](../../../../../project/common/product.md)과 [현재 구현·검증 지도](../../../../../project/current/architecture.md)를 함께 읽는다. Recover는 이 세 문서를 선택한다.

활성 여행의 SQLite 기준, 비활성 여행의 Server API 기준, Data Entity와 지도·검색·경로 Service의 분리, 미전송 사용자 입력의 보존이 이번 코드 작업의 제약이다. Project의 원자성 설명은 지켜야 할 기준이며 현재 helper가 실제로 보장한다는 검증 결과가 아니다. 현재 코드의 결함과 증명 상한은 이 Work의 Spec·후보가 별도로 소유한다.

실제 변경 대상을 고를 때 [client guide](../../../../../../apps/client/CLAUDE.md), [server guide](../../../../../../apps/server/CLAUDE.md), [schema guide](../../../../../../packages/schema/CLAUDE.md), [UI guide](../../../../../../packages/ui/CLAUDE.md) 중 해당 경로를 읽는다. 데이터·동기화 변경 전에는 [Activation Router](../../../../../../.claude/rules/activation-router.md), [Transaction + Sync Queue](../../../../../../.claude/rules/transaction-sync-queue.md), [Schema First](../../../../../../.claude/rules/schema-first.md), [Auth/User Scope](../../../../../../.claude/rules/auth-user-scope.md)와 [Guard Map](../../../../../../.claude/guards/README.md)을 직접 대조한다. 폼·날짜·통화·UI의 세부 기준은 [Runbooks](../../../../../../.claude/runbooks/README.md)에서 해당 항목으로 들어간다.

설명 방식 guidance는 제품 작업의 기본 입력으로 선택하지 않았다. 과거 Context Harness 이식 Work의 완료 상태·receipt·진행 이력은 이번 제품 작업의 증거로 이어받지 않는다. `noline-work`는 deprecated이며 호출하지 않는다.
