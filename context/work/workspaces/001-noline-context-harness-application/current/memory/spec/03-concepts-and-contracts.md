# 핵심 개념·입출력 계약

Project common은 여러 Work의 제품 의미, current는 교체되는 구현 현실, guidance는 조건부 판단을 맡는다. 상세 Noline 제품·규칙 Owner는 기존 위치에 남는다. Decision은 선택의 이유·재검토 신호를 보존하며 현재 답을 기본적으로 대신하지 않는다.

Work당 하나의 Spec을 다섯 파일에 나누고 실행 범위·설계·진행·결과는 필요한 Ticket에 둔다. 전체 상황과 다음 행동은 state가 맡는다. 내용과 유지 책임은 [Spec·Ticket canonical](../../../../spec-and-tickets/README.md)을 따른다.

`workspace.json`은 identity, `recover.json`은 Project 문서 선택·이유, `verify.json`은 claim·basis·argv·evidence, `status.json`은 마지막 Verify result와 receipt cursor를 소유한다. Recover가 실행 시 계산하는 freshness는 선언 snapshot의 현재 일치만 의미한다. `output/index.md`는 사람이 찾을 실제 산출물 지도로 machine 결과의 정본이 아니다.

Reference source는 `87d21023f6acd8ae709322d48da9851594f9acb0`, target preflight는 `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`이다. 상세 적용과 증거는 [기록](../../../records/README.md)에서 선택한다.
