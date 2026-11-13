# 007 — 다음 설명과 작업을 이어가기

**5단계 관련 변경의 분리 커밋을 마쳤고, 다음은 6단계 호환·삭제 설명**이다. 5단계 첫 설명은 최근 사례와 동작 보장에 치우쳤다는 지적을 받았고, 재설명에서 1·2단계 합의의 책임·타입·표현 선택 및 비용을 실제 코드에 연결했다. [5단계 기록](records/2026-11-14-01-stage-five-explanation-and-isolated-commit.md)에서 정정과 선별·검증·커밋 결과를 확인한다. 설명·커밋 요청을 모든 분기의 이해 확인이나 제품 최종 수락으로 확대하지 않는다.

먼저 [Ticket09](current/memory/tickets/09-staged-code-review-and-refinement.md)에서 수행 범위와 현재 상태를, [후속 설명·판단 참고](records/2026-11-13-16-explanation-and-review-continuity.md)에서 이번까지 이해한 것과 설명·검토·커밋 시 참고할 조건을 읽는다. 기존 [1단계 실행 합의](records/2026-11-12-12-workflow-application-agreement.md)와 [2단계 판단의 적용](records/2026-11-13-05-stage-three-pull-review.md#기존-워크플로에-더해-적용한-판단)은 유지한다. 스킬을 바꾸거나 여섯 검토자 전수조사·매번 퀴즈 같은 새 고정 절차를 도입한 것이 아니다.

필요한 질문이 생기면 다음 자료로 내려간다.

| 살필 조건 | 읽을 자료와 이유 |
| --- | --- |
| 코드 설명을 어떻게 구성할지 판단할 때 | [설명 참고](records/2026-11-13-10-code-explanation-as-shared-review.md). 입력·판단·호출/저장·결과와 조건을 실제 코드에서 연결한다. |
| reconcile의 필요성이나 pending 보존을 다시 묻는 경우 | [이해 과정11](records/2026-11-13-11-reconcile-understanding-and-explanation-gaps.md). 서버 확인본·Local·큐의 차이, B 추가 시점 누락과 “화면에서 사라짐”의 정정을 확인한다. |
| pull 보호나 snapshot/cursor 관계를 다시 볼 때 | [이해 과정12](records/2026-11-13-12-pull-boundaries-and-understanding.md). 기존 timestamp 증분 조회의 누락과 DB 경계·반복 비용, 기기 반영 조건을 확인한다. |
| 코드 표현의 채택 이유·전수 검토 결과를 볼 때 | [기록13](records/2026-11-13-13-full-readability-review-and-refinement.md)과 [검토 자료](output/2026-11-13-readability-review/README.md). 당시 판본의 선택·검증이며 과거의 미커밋·설명 미착수 표시는 현재 상태와 구별한다. |
| 어떤 코드가 커밋됐는지 또는 후보판 검증을 판단할 때 | [3단계 분리14](records/2026-11-13-14-stage-three-isolated-commit.md), [4단계 분리15](records/2026-11-13-15-stage-four-isolated-commit.md). 필수 의존성과 제외한 후속, 실제 검사·미실행을 확인한다. |

3단계 코드 **941e8557**·기록 **904202f9**, 4단계 코드 **e994171c**·기록 **09169262**, 후속 설명·전수 검토 근거의 기록 **0a2c489a**는 완료됐다. 5단계 관련 3파일은 **a8f57bc8**로 분리 커밋했다. 핵심 동작은 선행 커밋에 포함돼 있으며 이번에는 DB 매핑 재사용과 관련 표현만 정리했다. 6·7단계 및 다른 작업 변경은 보존한다. 과거 기록의 당시 미커밋 표시를 현재로 읽거나 전체 workingtree를 일괄 stage·reset하지 않는다.

구현·검증의 상세는 [현재 상태](current/state/index.md)와 [산출물](output/index.md)이 소유한다.4단계 후보의 추가 PG 검사는 준비 단계에서 멈췄고 임시 자원은 정리됐다. 커밋 시에는 기존 근거 재사용과 새 확인이 필요한 부분을 구별하며, 이번 시간 지적을 테스트 금지로 넓히지 않는다. 실제 환경 검증·SQL/서버/앱 배포와 사용자 최종 수락은 별도다.

다른 주제로 재개할 때는 [목표와 범위](current/memory/spec/01-problem-goal-scope.md), [Project 선택](current/memory/project-context.md), [Ticket 색인](current/memory/tickets/index.md)에서 필요한 계약을 고른다. 원본 없는 요청 격리는 [Ticket08](current/memory/tickets/08-orphaned-queue-task-blocks-login.md), 진단 운영의 남은 확인은 [Ticket06](current/memory/tickets/06-stalled-sync-visibility.md), 과거 판단은 [기록 색인](records/README.md)에서 찾는다. 이 안내의 연결 확인은 실제 새 세션 인수 성공을 뜻하지 않는다.
