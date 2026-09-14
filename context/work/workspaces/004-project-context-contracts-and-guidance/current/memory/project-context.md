# 선택한 Project 본문과 직접 읽을 기준

Recover는 Project README와 제품 공통 기준에 더해 [통화와 금액](../../../../../project/common/currency.md), [날짜와 시각](../../../../../project/common/date-and-time.md), [API 계약과 변경 가이드](../../../../../project/guidance/api-contracts.md)를 선택한다. 이 본문들은 기존 `.claude` Owner의 유효한 의미와 직접 코드 사실을 통합한 현재 Project Owner다. 기존 [통화](../../../../../../.claude/context/currency.md), [시간](../../../../../../.claude/context/time.md), [API/Data](../../../../../../.claude/context/api-data.md) 문서는 구현 위치와 호환 진입을 맡는다.

Main은 통화의 금액과 code/symbol 동시 표시, 대표 금액과 나머지 통화 개수 표시를 복원하고 API·날짜·통화 runbook 및 server/client guide에서 새 Owner까지 이어지는 경로를 맞췄다. `current/architecture.md`는 일회성 실행 기록을 덜어 낸 지속 검증 범위로, 도시 검색·저장 용량 current와 리팩터링 guidance는 관련 작업의 현재 계약·판단 기준으로 채택했다.

날짜의 장기 의미, 금액 정밀도와 `주 통화` 라벨, 서버 오류 계약은 아직 사용자 선택이 필요하다. Ticket 01에서는 [대표 사례](spec/02-behavior-and-cases.md)와 직접 코드를 새 Project Owner에 대조하며 이 선택만 이어 간다.

지침 분석·수정이나 Project 갱신 전에 [Project 관리 계약](../../../../../project/MAINTENANCE.md), [구성 기준](../../../../../project/REFERENCE/composition.md), [읽기 기준](../../../../../project/REFERENCE/reading.md)을 직접 읽는다. 관리 지침은 Recover의 제품 본문 선택에 억지로 넣지 않고 작업 시점에 읽는다. [갱신 스킬](../../../../../../.claude/skills/update-project-context/SKILL.md)과 [읽기 스킬](../../../../../../.claude/skills/read-project-context/SKILL.md)은 해당 기준을 적용하는 실행 경로다.

Ticket 02의 지침 시험과 원복 전 초안 평가는 [02 실행 기록](../../records/2026-09-14-02-guidance-failure-analysis-and-retest.md)에 보존돼 있다. 원복 뒤 작성된 문서의 채택 전 검토와 현재 기준을 구별한다.

이전 진입점을 대조할 때는 [.claude 문서 지도](../../../../../../.claude/README.md), [API·날짜 runbook](../../../../../../.claude/runbooks/README.md), [server guide](../../../../../../apps/server/CLAUDE.md)에서 실제 경로를 따라간다. 원문·코드·이전 합의의 정확한 접근점과 용도는 [source 색인](../../source/index.md)에 있다.
