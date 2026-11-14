# 010 — README를 다시 고칠 때 이어받을 것

README는 여러 번의 정정을 거쳐 지금 구성이 됐다. 다시 손대기 전에 "왜 이 구성인가"를 먼저 복원한다. 결과물만 보고 고치면 이미 버린 안(결정 8개 나열, 서술형 보강, 원칙만 나열한 UI 절)으로 되돌아가기 쉽다.

먼저 [현재 상태](current/state/index.md)에서 반영된 범위와 남은 일을 확인하고, [문제·목표·범위](current/memory/spec/01-problem-goal-scope.md)와 [제약·현재 설계](current/memory/spec/05-constraints-design-assumptions.md)에서 독자와 지킬 조건, 지금 구성의 이유를 읽는다. 이 둘이 빠지면 README의 분량·구성 판단이 달라진다.

요청에 따라 아래를 더 읽는다.

- **구성이나 절 수를 바꿀 때:** [구별해야 할 사례](current/memory/spec/02-behavior-and-cases.md)와 [뼈대와 문장 기록](records/2026-11-15-02-structure-and-readability.md). 반려된 두 판과 설계 절을 4개로 묶은 근거, 사용자가 개수를 정하지 않았다는 점이 있다.
- **UI State 절을 고치거나 프론트엔드 쪽 내용을 더할 때:** [UI State 절 기록](records/2026-11-15-04-ui-state-section.md). 초안 네 판이 반려된 이유와 최종판에서 다시 빠진 것을 먼저 본다.
- **문장의 사실 여부를 고칠 때:** [근거와 인용의 계약](current/memory/spec/03-concepts-and-contracts.md)과 [선택한 Project 맥락](current/memory/project-context.md). 이미 바로잡은 여섯 곳과 근거를 확인하지 못한 문장은 [코드·배경 문서 대조 기록](records/2026-11-15-03-code-and-background-check.md)에 있다.
- **남은 확인·보강을 수행할 때:** [Ticket 02](current/memory/tickets/02-post-publish-checks.md).
- **사용자가 실제로 한 말과 그 강도가 문제일 때:** [사용자 방향 원문](source/user-direction.md). 그 밖의 원문 구간과 커밋되지 않은 초안은 [source 색인](source/index.md)의 행 번호로 내려간다.

첫 행동은 실제 README와 `git log -- README.md`로 현재 판본을 확인하는 것이다. 이 문서들이 가리키는 커밋 이후에 README가 바뀌었을 수 있다.
