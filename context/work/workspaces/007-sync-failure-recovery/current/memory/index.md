# 동기화 실패를 끝내는 작업 정의

동기화에 실패한 변경이 영구 정지로 남지 않게 하는 Work다. 흔한 실패를 먼저 시스템이 스스로 끝내게 하고(1단계), 남는 정지를 사람이 알게 하고(2단계), 드문 충돌을 합의한 규칙으로 끝내는(3단계) 순서로 진행한다.

1. [문제·목표·범위](spec/01-problem-goal-scope.md)
2. [요구 동작과 대표 사례](spec/02-behavior-and-cases.md)
3. [개념과 계약](spec/03-concepts-and-contracts.md)
4. [품질과 완료](spec/04-quality-and-completion.md)
5. [제약·현재 설계·가정](spec/05-constraints-design-assumptions.md)

[Ticket 색인](tickets/index.md)에서 실행 범위를, [Project 선택](project-context.md)에서 지킬 Project 계약과 읽을 이유를 찾는다. 전체 진행과 다음 행동은 [현재 상태](../state/index.md)가 소유한다.
