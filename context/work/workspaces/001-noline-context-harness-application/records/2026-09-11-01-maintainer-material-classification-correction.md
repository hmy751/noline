# Maintainer 자료 구분 보완 적용

2026-09-11, Reference에서 실제 `002-code-readability-refactoring` 사례로 검증한 Maintain 자료 구분 보완을 Noline 설치본에 적용했다.

적용 범위는 `context/work/harness/maintain/README.md`, `workspace-context-maintainer.toml`, `codex_session.py`, `tests/test_codex_session.py`다. Noline 고유한 Claude 연결 설명과 Noline용 수동 role 이름은 유지했다. 자동 semantic 경로와 수동 fallback 모두 다음 기준을 공유한다.

- current에는 현재 유효한 기준·진행·결과와 다음 행동을 정규화한다.
- 이후에도 필요한 조사·선택·정정·실패의 과정 근거는 records에 둔다.
- 채택 발화와 임시 전달 경로를 current의 지속 근거로 삼지 않는다.
- 정정·단계·선택 변화가 직접 의존한 current를 선택된 Workspace 안에서 제한적으로 확인한다.
- state를 갱신할 때 끝난 진행 경위와 일회성 보고를 압축하고 색인에 변동 상태를 복제하지 않는다.

적용 전 Noline의 기존 dirty 파일은 `context/work/workspaces/002-code-readability-refactoring/current/memory/tickets/01-expense-totals.md` 한 개였다. 이 파일과 제품 코드, Workspace 002의 current·records는 수정하지 않았다.

적용 당시 HEAD는 `25d401f1d7b42d843500a7b66fc9087574a176d5`다. Noline root에서 `python3 -m unittest context.work.harness.maintain.tests.test_codex_session context.work.harness.maintain.tests.test_operation -v`의 22개 test가 통과했고 `git diff --check`도 통과했다. 이 검증은 계약·Guard 단위 동작이며 실제 host activation이나 기존 Workspace 자료의 자동 재분류를 증명하지 않는다.
