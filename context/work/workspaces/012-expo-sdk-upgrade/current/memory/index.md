# 이번 작업의 의미

이번 Work의 기준은 다음 다섯 문서다. 2026-11-17 버전 설정을 전수 조사하고 서버 Node를 범위에 넣었으며, SDK 58·최소 iOS 16.4·Node 24, 출시 2번과 Ticket 5개를 정했다. 기기 DB·오프라인 지도 보존 같은 라이브러리 미확인은 Ticket 02에서 판정한다. 각 문서는 확정한 것과 추천·미정을 나눠 적었다. 버전 값의 현재와 이후는 05에 있다.
- [문제·목표·범위](spec/01-problem-goal-scope.md)
- [동작과 구별해야 할 사례](spec/02-behavior-and-cases.md)
- [개념과 지킬 계약](spec/03-concepts-and-contracts.md)
- [완료 판단](spec/04-quality-and-completion.md)
- [제약·현재 설계·가정](spec/05-constraints-design-assumptions.md)

[Ticket 색인](tickets/index.md): 확정한 Ticket 5개(01 준비, 02 데이터 보존 선검증, 03 SDK 54, 04 New Architecture와 1.2.0, 05 SDK 58과 1.3.0)와 공통 규칙, Spec 완료 기준을 맡는 Ticket.

나머지 연결은 다음과 같다.
- [선택한 Project 맥락](project-context.md): 업그레이드에서 깨지기 쉬운 Project 계약과 그 이유
- [state](../state/index.md): 현재 상황과 다음 행동
