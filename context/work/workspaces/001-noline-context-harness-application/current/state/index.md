# 현재 이식 상태

## 문서 작성 기준과 Maintainer 설정

Workspace 사람용 문서의 내용 충분성·선택 이유와 조건 보존·구성·갱신 기준은 [문서 작성과 갱신](../../../DOCUMENT-WRITING.md)이 소유한다. Workspace README는 층·Owner·보존 경계와 읽기 경로를 맡고, Spec·Ticket과 생성·전환 기준은 각 절차 안에서 새 지침을 적용한다. 모든 문서에 같은 목차나 정보 순서를 강제하지 않는다.

Maintainer는 [역할 설정](../../../../harness/maintain/workspace-context-maintainer.toml)의 Sol high를 사용하도록 설정됐다. 자동 runner도 시작·재개마다 같은 값을 읽고 작성 지침 정본의 전체 본문을 입력에 한 번 포함한다. 본문이 제공된 경우 같은 파일을 다시 읽지 않으며, 수동 경로에서 본문이 없으면 직접 읽는다. Python 3.11 이상이 필요하고 다음 호출부터 설정이 적용된다. 실행 중인 호출을 재시작하거나 session binding을 변경하지 않았다.

Source `5f6db35`의 변경을 Noline 고유 설명·Claude Code 연결·증거 수집 routing과 기존 제품 작업을 유지하며 반영했다. Maintain 72개, 전체 Harness 재검사 124개와 직접 구조 검사가 통과했다. 첫 전체 검사의 기존 timeout 실패, 독립 검토와 적용 범위는 [이번 기록](../../records/2026-09-11-03-workspace-writing-and-maintainer-settings.md)에서 확인한다. 실제 Noline host의 모델 호출·문서 작성 품질과 자동 반영까지 확인한 결과는 아니다.

## 이전 설치에서 유지하는 결과

Project README는 구조·내용 위치·권위 관계를, `MAINTENANCE.md`는 작성·복원·갱신 기준을 소유한다. 관리 주체가 이를 직접 읽고 일반 Recover 문서 목록은 늘리지 않는다. 관련 [Ticket](../memory/tickets/003-project-management-contract.md)은 기존 Project 관리 계약 적용을 맡으며, 이번 작성 지침·실행 설정 보완의 상세는 위 새 기록에 남겼다.

실행 계약·layer·운영 skill 보완은 [Reference 적용 기록](../../records/2026-09-09-01-reference-upgrade.md), 이전 요약 세 문서의 내용 귀속·제거는 [문서 전환 기록](../../records/2026-09-10-01-document-transition.md), Project 관리 기준 배치와 당시 검증은 [재적용 기록](../../records/2026-09-10-02-project-management-contract.md)에 보존한다. Maintainer의 current·records 구분과 직접 영향받는 current 갱신, 기존 구성에 통합하는 편집 기준도 유지한다. 각각 [자료 구분](../../records/2026-09-11-01-maintainer-material-classification-correction.md)과 [통합 편집](../../records/2026-09-11-02-maintainer-readable-editing-guidance.md) 기록이 근거를 소유한다.

## 운영과 검증의 경계

명시·기본 Recover는 이 Workspace의 같은 context 15개를 읽는다. 새 작성 지침은 Recover 선택에 추가하지 않고 작성 시점과 Maintainer 입력에서 소비한다. Active id와 Project 선택은 유지한다. 기존 Verify receipt는 현재 snapshot과 달라 stale이며, 이번 Harness 검사로 제품 검증을 갱신하거나 fresh로 바꾸지 않았다.

[status.json](status.json)은 마지막 Verify result·receipt cursor·시각만, [verify.json](../../verify.json)은 claim·basis·argv·evidence를, [recover.json](../../recover.json)은 Project 선택을, [workspace.json](../../workspace.json)은 identity를 소유한다. Recover freshness는 선언 snapshot의 현재 일치이며 사람용 문서의 최신성이나 선언하지 않은 입력을 증명하지 않는다.

이번 적용에서 host trust·activation·deactivation과 runtime 변경은 수행하지 않았다. 기존 host 연결 상태를 새로 확인한 것으로 보고하지 않으며, 실제 다음 호출의 모델·문서 유지 효과는 해당 Noline session에서 관찰할 후속 사항이다. 제품 리팩토링·상세 문서 전체 정비, 실제 skill discovery·invocation, 제품 acceptance와 Workspace 완료는 이번 적용 범위 밖이다.
