# Workspace memory map

이 폴더는 이번 작업의 Spec, 실행할 Ticket과 선택한 Project 맥락을 유지한다. Spec·Ticket은 필요하면 수정하며 Workspace와 함께 남긴다. Ticket의 정의·진행은 한 문서에서 다루고, 전체 상황·판단·다음 행동은 [state](../state/index.md), 상세 과정은 records가 맡는다. [구성·관리 기준](../../../spec-and-tickets/README.md)을 따른다.

## 현재 문서

- [문제·목표·범위](spec/01-problem-goal-scope.md): 해결할 문제와 이번 작업의 범위
- [요구 동작과 대표 사례](spec/02-behavior-and-cases.md): 동작에서 보존할 의미
- [핵심 개념·입출력 계약](spec/03-concepts-and-contracts.md): 전달할 입력과 결과
- [품질·완료 판단](spec/04-quality-and-completion.md): 확인할 결과와 완료의 근거
- [제약·현재 설계·가정](spec/05-constraints-design-assumptions.md): 지킬 조건과 다시 판단할 선택
- [`project-context.md`](project-context.md): 이번 작업에 필요한 상위 Project 맥락과 선택 경계
- [Tickets](tickets/index.md): 실행할 일의 목록과 본문 접근점

일반 재진입에서는 Spec 전체와 Project 맥락 선택·Ticket 색인을 읽고 필요한 Ticket 본문을 선택한다. 새 memory 주제는 기본 재진입에 필요한 의미가 있을 때 추가한다. 상세 과거 기록이나 모든 Ticket 본문을 매번 자동으로 읽지는 않는다.
