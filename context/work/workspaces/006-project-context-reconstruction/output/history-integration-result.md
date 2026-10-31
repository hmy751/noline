# audits·decisions·sessions 통합 결과

2026-10-31. [승인안](history-integration-proposal.md)에 따라 과거 자료의 유효한 선택 이유를 현재 Owner에 통합하고 원문을 보존했다. 원문 수나 기존 Ticket 번호가 통합 단위를 정하지 않도록 했다.

## 적용한 내용

[0001](../../../../project/decisions/0001-selective-local-first.md)은 활성화 대안·온라인 의존 비용과 Router/Sync 구분을 보완했다. 새 [0002](../../../../project/decisions/0002-topic-ownership.md)는 작은 루트·분리된 규칙에서 주제별 Owner로 통합한 이유·비용·대체 관계를, [0003](../../../../project/decisions/0003-context-structure-and-verification.md)은 Project 세 층·주제 구성·의미/사실/읽기 경로 검증의 형성 이유와 제한된 재시험을 설명한다. 실제 제품 기준과 운영 계약은 기존 주제·스킬·Work Owner에 유지한다.

audits 6개는 당시 조사·검증·실행·재진입 기록으로 보존했다. 오래된 inventory를 문서 정비의 선행 입력으로 요구하거나 5월 기록을 ‘최근’이라고 안내하는 연결을 제거했다. 과거 검사 수치·등급을 현재 검증 근거로 가져오지 않았다.

sessions 3개 중 활성화 선택 이유만 0001에 보완했다. 지도·경로 의미와 구현 차이는 현행 본문·형성 자료에 이미 충분해 중복 추가하지 않았다. 당시 전체완료·성능·rollback 보장은 현재 지원 약속으로 가져오지 않았다.

원문 28개를 [보존 묶음](../../../../../.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/README.md)의 txt와 manifest에 원래 경로·기준commit·SHA-256으로 남겼다. 삭제 전 원바이트와 해시를 대조했고 .claude/audits·decisions·sessions 현재 폴더는 제거했다. 원문 내부 링크·표현은 고치지 않았다.

루트·Document Map·harness·스킬 색인·Project/REFERENCE 입구는 현재 Owner 또는 기존의 가까운 형성 자료를 가리킨다. 커밋 기준에는 domain scope 예외와 추적을 위한 선택 이유를 보완했다. 새로 생기는 지속 결정은 Project decisions 또는 해당 실행·관리 Owner의 형성 자료, 이번 작업 진행·검증은 Work 기록에 연결한다.

## 소비자와 검증

001은 기본 Recover/Verify consumer, 006은 이번 명시 Workspace다. 001 Verify의 canonical_basis는 과거09-09 결정 대신 현재 context/Project README와 기존 harness·001 Spec으로 맞췄다. claim과 실행 명령은 현재 지침·입력·구조 검사에 한정된 기존 범위를 유지하고, 원문을 보존했다는 이유로 구조검사 claim을 archive 검증으로 확대하지 않았다. evidence에서 제거된 본문을 빼고 새 Decision 2개를 추가했다. 006 Recover에는 이번 판단에 쓰는 두 결정을 선택 이유와 함께 추가했다. durable Verify receipt나 freshness는 새로 만들지 않았다.

[검사 원문](history-integration-check.txt)에서 전체 Harness는 기존55건에 역사참조8건이 더해져63건으로 실패한다. 추가항목은001records2개,002output1개,004current2개·output2개·records1개다. 이들은 현재 일반 읽기의 참조가 아니라 원문을 가리키던 역사 문서다. 해당 원문은 보존되어 있고 archive의 경로표와 historical-links.json으로 재접근한다. 역사 본문을 일괄현재화하거나 검사예외를 넓히지 않았다. 기존 실패도 해결했다고 주장하지 않는다.

독립 개선 검토는 원문·현재 본문·현재 소비자를 대조해 수정이 필요한 내용상 결함을 찾지 못했다. 별도 검증자는 source commit의 28개 원문과 snapshot의 바이트·SHA를 직접 대조하고, 대표 질문으로 새 Decision의 이유·비용·후속 대체·재검토 조건을 확인했다. 현재 진입과 Recover/Verify·hook/harness 소비에 옛 폴더의 요구가 남지 않았고, 독립 검사도 동일한63건과 추가8건을 재현했다. 두 담당 모두 역사참조8건을 이번 현재 내용 통합을 막는 결함으로 판정하지 않았다. 현재 산출물 내용의 검증과 제품·host 동작의 실행은 구별한다. 이번 요청에서 제품 실행이나 이미로드된host캐시갱신은 수행하지 않았다.

이번 요청은 적용까지이며 아직 커밋하지 않았다. 이 결과는 세 폴더의 내용 통합과 현재 읽기 전환을 완료한 범위이며, 남은 전체 스킬·host 연결 개편이나 역사 링크 전반의 정비·006 전체 수락을 대신하지 않는다. Main은 이 결과 경로를 기존 Maintain의 후속 기록 입력으로 전달하며, 비동기 접수와 실제 current·Ticket 반영 성공을 구별한다.
