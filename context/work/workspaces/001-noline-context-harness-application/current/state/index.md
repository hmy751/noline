# 현재 이식 상태

2026-09-09 실행 계약·layer·운영 skill 보완과 당시 tests·독립 review는 [Reference 적용 기록](../../records/2026-09-09-01-reference-upgrade.md), 2026-09-10 이전 요약 세 문서의 내용 귀속·제거와 당시 검증은 [문서 전환 기록](../../records/2026-09-10-01-document-transition.md)에 보존한다. 이 결과를 이번 재적용의 확인으로 대신하지 않는다.

2026-09-11에는 Maintainer가 current의 현재 의미와 records의 과정 근거를 구분하고 정정·단계 변화가 직접 의존한 current를 함께 확인하도록 행동 계약을 보완했다. Reference의 실제 002 사례 재시험 뒤 Noline 설치본에 적용했으며, Noline 고유 연결과 사용자의 Workspace 002 Ticket 수정은 유지했다. 적용 범위와 단위 검증은 [자료 구분 보완 기록](../../records/2026-09-11-01-maintainer-material-classification-correction.md)이 소유한다. 실제 host activation과 기존 문서의 자동 재분류는 아직 확인하지 않았다.

사용자가 승인한 dirty Source의 Project 관리 계약 배치를 재적용했다. README는 구조·실제 내용 위치·권위 관계를, `MAINTENANCE.md`는 작성·복원·갱신 기준을 맡긴다. 관리 주체가 해당 작업에서 직접 읽도록 지침과 갱신 skill을 연결하며 일반 Recover 문서 목록은 늘리지 않는다. [현재 Ticket](../memory/tickets/003-project-management-contract.md)과 [재적용 기록](../../records/2026-09-10-02-project-management-contract.md)이 이번 범위와 검증을 소유한다.

Source hash와 기준 보존·읽기 경로·skill 연결, 직접 구조 검사와 explicit/default Recover, regular input closure·기존 파일 보호 대조가 통과했다. Main도 실제 target의 Noline layer·상세 Owner, 관리 계약·갱신 skill의 Source bytes·bridge·routing을 확인하고 별도로 baseline 602개 경로와 Git index 보존을 대조했다. 현 범위에서 추가 수정 의견은 없었다. 최종 문서 뒤 실행한 구조 Verify의 result는 아래 machine cursor에서 찾고 다음 Recover가 현재 snapshot 일치를 계산한다. 다음 행동은 Main이 최종 실제 변경·보호·Verify와 Recover 근거를 회수하는 것이다. Active Workspace id와 선택한 제품 문서는 유지한다. 두 host runtime 디렉터리는 이번 baseline에서도 없으며 actual-host trust·explicit activation·같은 generation의 event receipt가 없는 `activation_pending` 상태다.

[status.json](status.json)은 마지막 Verify result·receipt cursor·시각만 소유한다. [verify.json](../../verify.json)은 claim·basis·argv·evidence를, [recover.json](../../recover.json)은 Project 선택을, [workspace.json](../../workspace.json)은 identity를 맡는다. Recover가 계산하는 freshness는 선언 snapshot의 현재 일치이며 사람용 상태의 최신성이나 undeclared input을 증명하지 않는다.

제품 리팩토링·상세 문서 전체 정비, 실제 host skill discovery·invocation·문서 유지, 제품 기능과 사람 acceptance, stage·commit·Workspace 완료는 이번 재적용의 결과가 아니다.
