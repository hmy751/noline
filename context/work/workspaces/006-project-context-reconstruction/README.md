# Project Context 수집·검증·재구성

흩어진 제품 자료와 002의 작업 축적을 검증하고, 기존 `context/project` 본문까지 재구성해 다음 개발에서 의미·이유·현재 차이를 이해할 수 있게 한다. `.claude`의 문서는 향후 아카이브를 준비하는 이관 원자료로 다룬다.

005 종료 뒤 새 목표와 범위로 구성한 독립 Workspace다. 하나의 Spec이 전체 결과를 맡고, 첫 조사에서 드러난 주제·우선순위에 따라 실행 Ticket을 나눈다.

- [현재 상태와 다음 행동](current/state/index.md): 생성 완료와 조사 착수 전 상태를 구분한다.
- [Spec](current/memory/index.md): 수집부터 검증·본문 재구성·이관·읽기 경로 정리까지의 목표와 기준.
- [Ticket 01](current/memory/tickets/01-source-map-and-improvement-candidates.md): 자료와 실질적인 보완 후보를 넓게 펼치는 첫 조사.
- [원자료](source/index.md): 사용자 원문과 002·004·005, 기존 문서에 접근하는 경로.
- [산출물](output/index.md) · [기록](records/README.md)

생성만으로 활성화하거나 Project 본문을 변경하지 않는다. 명시적으로 재진입하려면 Project root에서 `python3 -B -m context.work.harness recover 006-project-context-reconstruction`을 실행한다.
