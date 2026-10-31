# Project Context 수집·검증·재구성

흩어진 제품 자료와 002의 작업 축적을 검증하고, 기존 `context/project` 본문까지 재구성해 다음 개발에서 의미·이유·현재 차이를 이해할 수 있게 한다. 이관이 끝나면 현재 가이드와 Project에서 필요한 설명을 얻고, `.claude/context`·`.claude/decisions` 등 옛 제품 문서로 돌아가지 않는다. 옛 자료는 일반 읽기에서 제외되는 아카이브로 격리하거나 제거한다.

005 종료 뒤 새 목표와 범위로 구성한 독립 Workspace다. 하나의 Spec이 전체 결과를 맡고, 첫 조사에서 드러난 주제·우선순위에 따라 실행 Ticket을 나눈다.

- [현재 상태와 다음 행동](current/state/index.md): 현재 진행 중인 Ticket과 다음 실행, 남은 범위.
- [Spec](current/memory/index.md): 수집부터 검증·본문 재구성·이관·읽기 경로 정리까지의 목표와 기준.
- [Ticket 색인](current/memory/tickets/index.md): 01의 조사 결과, 02의 실제 이관 결과와 03 이후 후속 범위.
- [원자료](source/index.md): 사용자 원문과 002·004·005, 기존 문서에 접근하는 경로.
- [산출물](output/index.md) · [기록](records/README.md)

명시적으로 재진입하려면 Project root에서 `python3 -B -m context.work.harness recover 006-project-context-reconstruction`을 실행한다. Recover는 위 현재 상태와 실행 정의를 복구하는 절차이며 이관 완료를 증명하지 않는다.
