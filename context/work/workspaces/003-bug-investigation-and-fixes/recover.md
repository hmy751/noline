# 발견한 버그 확인·수정 재개

버그 후보의 관찰·원인·재현 수준은 다르다. 새 제보를 받으면 state와 해당 Ticket에서 조사 범위와 다른 Workspace가 맡은 부분을 확인한다.

일반 재개는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [현재 상태와 다음 행동](current/state/index.md), [산출물 위치](output/index.md)를 읽는다. 한정 요청은 해당 자료부터 본다.

특정 실행의 합의는 [Ticket 색인](current/memory/tickets/index.md), 과거 선택·검사 근거는 [기록 색인](records/README.md)에서 해당 항목만 선택한다. 제품·개발 기준은 [이 작업의 Project 선택](current/memory/project-context.md)에서 해당 주제와 이유를 찾아 읽는다.

검증 요청은 [품질·완료 기준](current/memory/spec/04-quality-and-completion.md)에서 주장과 범위를 확인한다. 기존 직접 검사의 저장소 루트 명령은 `node node_modules/typescript/bin/tsc --noEmit --incremental false --composite false -p apps/client/tsconfig.json`다. 실행 전에 현재 도구·입력·환경을 대조하고 실제 결과만 기록한다.
