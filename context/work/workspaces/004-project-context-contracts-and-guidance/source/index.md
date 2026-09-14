# 선택한 원자료

이 Work는 002의 전체 current를 복제하지 않는다. 다음 판단을 바꾸는 원문은 여기서 선택하고, 현재 해석과 진행은 Spec·Ticket·records에 둔다.

- [사용자 요청과 Main 정정 발췌](user-direction.md): 004 생성 범위, current의 유보, 수동 보완과 지침 시험의 차이를 해석할 때 읽는다. 2026-09-14 현재 대화에서 Main이 직접 발췌했다.
- [시험 산출물과 코드 발췌](trial-excerpts.txt): 실제 문제 문구와 코드 근거를 고치기 전에 대조한다. Project 전체의 현재 정본을 복제한 자료가 아니라 이번 실패 판별에 사용한 최소 원문이다.
- [002 구성 합의](../../002-code-readability-refactoring/records/2026-09-14-05-project-context-structure-reading-and-maintenance.md): guidance 역할·세 층의 관계·기준 본문 소유를 다시 판단할 때 읽는다.
- [002 외부 자료 인사이트와 재시험 방향](../../002-code-readability-refactoring/records/2026-09-14-06-project-context-reference-insights-and-retest-direction.md): 정보의 가치와 독립 파일의 필요성, current를 재구성 결과로 판단하기로 한 이유가 필요할 때 읽는다. 당시 조사 보고이며 외부 자료의 실제 운영 효과를 입증하지 않는다.

지침의 고정 비교 기준은 Git commit `2937c252a735ecc6edbe1d3516659fcf459da970`이다. `git show 2937c25:context/project/REFERENCE/composition.md`와 `git show 2937c25:context/project/MAINTENANCE.md`로 시험 당시 기준을 확인한다. 기존 의미의 원문은 `git show 2937c25:.claude/context/currency.md`, `git show 2937c25:.claude/context/time.md`, `git show 2937c25:.claude/context/api-data.md`로 확인한다. 현재 작업 트리는 그 이후 미커밋 시험 결과여서 commit 내용과 같지 않다.

새 Project 본문과 현재 `.claude` 문서는 실제 수정할 Owner에서 읽는다. 원실행 세션의 전체 도구 기록은 004에 수집하지 않았다. 사용자가 붙여넣은 결과 보고와 Main이 직접 확인한 사실의 차이는 [생성 기록](../records/2026-09-14-01-workspace-setup-and-review-basis.md)에 남긴다. Archive나 다른 Work 전체를 기본 입력으로 가져오지 않는다.
