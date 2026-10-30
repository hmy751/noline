# 작업에서 사용할 Context

Recover는 Project README·제품 의미·현재 구조를 기본 입력으로 선택한다. 기존 본문을 실제로 보완할 때에는 Project 관리 계약과 구성 기준, 해당 상세 Owner를 직접 읽는다. 이미 유효하게 읽은 내용은 재사용한다.

- [Project 입구](../../../../../project/README.md): 주제별 현재 Owner와 물리 층의 책임.
- [제품 의미](../../../../../project/common/product.md): 데이터 소유와 일정·경비 관계 및 보존 제약.
- [현재 구조](../../../../../project/current/architecture.md): 앱·패키지·검증 관계의 기존 설명. 04에서 앱 수명과 연결을 보완한다.
- [관리 계약](../../../../../project/MAINTENANCE.md), [구성 기준](../../../../../project/REFERENCE/composition.md), [읽기 기준](../../../../../project/REFERENCE/reading.md): 본문 충분성·권위·진입과 완료 확인.
- [기존 상세 입구](../../../../../../.claude/context/README.md): policy·form·manual-input·components·선택적 활성화 등 05/06의 기존 본문 Owner.
- [날짜와 시각](../../../../../project/common/date-and-time.md), [통화](../../../../../project/common/currency.md), [API 계약](../../../../../project/guidance/api-contracts.md): 이미 반영된 의미를 폼·조회·보존 경계와 연결할 때 읽는다.
- [리팩터링 기준](../../../../../project/guidance/behavior-preserving-refactoring.md), [도시 검색](../../../../../project/current/city-search.md), [저장 용량](../../../../../project/current/storage-statistics.md): 초기 결과의 기존 반영을 확인할 때 읽는다. 코드 재감사의 실행 지시가 아니다.

실제 본문 갱신은 [context-update](../../../../../../.claude/skills/context-update/SKILL.md)를 따른다. Work Spec·Ticket은 기존 Maintain 경로로 갱신한다. Personal 기준·사례·경험과 스킬 보완은 후순위로 두며 현재 Ticket의 산출물에 포함하지 않는다.
