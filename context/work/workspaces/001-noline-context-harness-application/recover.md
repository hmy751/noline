# Noline Context Harness application Workspace 재개

기록·재개 이식 결과를 확인할 때에는 적용 기록에서 실제 확인과 남은 실사용 관찰을 구별한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

기존 장치와의 공존 범위와 확인 결과는 [적용 기록](records/2026-11-07-work-record-and-resume.md)에서 확인한다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node scripts/check-harness.mjs --no-git-diff`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.
