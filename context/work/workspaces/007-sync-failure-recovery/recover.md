# 007 — 동기화 실패가 큐를 영구히 막지 않게 하기 재개

다음 작업은 [Ticket 06](current/memory/tickets/06-stalled-sync-visibility.md)이다. 출시 앱의 동기화가 계속 실패할 때 개발자가 어떤 기록으로 그 사실을 확인할지 정한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

원본 없는 요청의 격리와 여행 비활성화·기기 DB 초기화의 보존 범위를 확인할 때는 완료된 [Ticket 08](current/memory/tickets/08-orphaned-queue-task-blocks-login.md)에서 해당 대목을 읽는다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node node_modules/vitest/vitest.mjs run --root apps/server tests/routes/replay.idempotency.test.ts`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.

선택지 비교와 받아들인 비용은 [설계 판단 기록](records/2026-11-03-01-sync-failure-design-decisions.md), 사고의 관찰 근거는 [관찰 기록](records/2026-11-02-01-simulator-sync-block-observation.md), 사용자 발화 원문은 [source](source/index.md)에서 찾는다.
