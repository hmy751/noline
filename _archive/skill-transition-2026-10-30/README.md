# 교체 전 스킬의 보존판

현재 실행 스킬이 아닌 역사 자료다. Noline `4fb309d2ba50afaca44019879d7161964b9b2328`의 다음 SKILL.md 원문을 바이트 그대로 `.txt`로 보존했다. 뒤의 `2839d467`에서 잠시 남겼던 호환 안내는 해당 Git 이력에 있으며 별도 실행 진입으로 남기지 않는다.

- [read-project-context](read-project-context.txt): 당시 `.claude/skills/read-project-context/SKILL.md`.
- [update-project-context](update-project-context.txt): 당시 `.claude/skills/update-project-context/SKILL.md`.
- [work-artifact-briefing](work-artifact-briefing.txt): 당시 `.claude/skills/work-artifact-briefing/SKILL.md`.
- [explanation-recovery](explanation-recovery.txt): 당시 `.claude/skills/explanation-recovery/SKILL.md`.

현재 읽기·갱신·설명 경로와 제거 근거는 [전환 결정](../../decisions/2026-10-30-development-skill-transition.md)에 있다. 보존판 안의 상대 링크·명령은 당시 원문이며 현재 실행·이동 경로로 사용하지 않는다.

## 변경하지 않은 과거 링크의 재접근

Workspace002의 아래 두 기록은 append-only 원문을 유지하므로 삭제된 update-project-context 경로가 당시 표기대로 남아 있다. 그 링크의 본문을 대조할 때 위 `update-project-context.txt` 보존판과 명시한 Git 판본을 사용한다. 이 snapshot은 교체 직전 판본이며 각 기록 작성일의 파일과 동일하다고 보장하지 않는다. 해당 날짜 판본이 필요하면 Git 이력을 추가 대조한다.

- `context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-05-project-context-structure-reading-and-maintenance.md`
- `context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-06-project-context-reference-insights-and-retest-direction.md`

구조 검사는 위 두 원문 파일의 해시와 정확한 옛 target이 일치할 때에만 보존판의 존재·고정 해시를 대조한다. 변경된 기록, 다른 옛 target, 새 현재 링크, 사라지거나 변조된 보존판은 이 경로로 통과하지 않는다. 실제 현재 스킬이나 실행 bridge를 남기는 호환 장치는 아니다.
