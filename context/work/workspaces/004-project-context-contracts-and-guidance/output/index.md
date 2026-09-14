# 현재 산출물

현재 선택한 결과는 보완을 거쳐 채택한 Project 제품·작업 기준과 최소 지침 수정이다. 열린 제품 선택과 실제 구현 변경은 이 산출물의 완료 범위에 포함하지 않는다.

- [통화와 금액](../../../../project/common/currency.md), [날짜와 시각](../../../../project/common/date-and-time.md): 기존 의미와 경계별 현재 사실을 통합한 Project Owner
- [API 계약과 변경 가이드](../../../../project/guidance/api-contracts.md), [동작 보존 리팩터링](../../../../project/guidance/behavior-preserving-refactoring.md): 관련 변경의 계약·적용·검증 기준
- [현재 구조](../../../../project/current/architecture.md), [도시 검색](../../../../project/current/city-search.md), [저장 용량](../../../../project/current/storage-statistics.md): 다음 판단에 필요한 현재 관계와 재확인 범위
- [기존 작업 runbook](../../../../../.claude/runbooks/README.md), [server guide](../../../../../apps/server/CLAUDE.md), [client guide](../../../../../apps/client/CLAUDE.md): 새 Owner와 현재 날짜 경계로 이어지는 실제 작업 진입점
- [갱신 skill](../../../../../.claude/skills/update-project-context/SKILL.md): 변경 뒤 기존 Owner와 기존 작업 진입점에서 시작하는 최소 완료 확인
- [Project 관리 계약](../../../../project/MAINTENANCE.md): 초안 전 대조와 초안 후 의미 보존·사실 범위·실제 routing 확인, `current`의 판단 효용·재확인 조건
- [구성 기준](../../../../project/REFERENCE/composition.md)과 [읽기 기준](../../../../project/REFERENCE/reading.md): 근거 범위를 넘지 않는 사실, 일회성 근거의 위치, Project README 밖의 대표 진입점 확인
- [읽기 skill](../../../../../.claude/skills/read-project-context/SKILL.md): 위 기준을 실제 읽기 행동에 연결
- [후속 결정](../../../../../.claude/decisions/2026-09-14-project-context-semantic-and-routing-verification.md): 실패 원인, 선택, 격리 재시험과 다시 볼 조건
- [실행 기록](../records/2026-09-14-02-guidance-failure-analysis-and-retest.md): 재시험 prompt 조건, 관찰 결과, 검사와 한계

01에는 날짜의 장기 의미, 금액 정밀도·`주 통화` 라벨과 서버 오류 계약의 사용자 선택이 남아 있다. 현재 본문은 이 항목을 열린 판단으로 보존하며 합의되지 않은 정책을 대신 결정하지 않는다.
