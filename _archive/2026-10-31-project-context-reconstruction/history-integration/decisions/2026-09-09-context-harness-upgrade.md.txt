# Decision: Context Harness 보완

2026-09-09 사용자가 기존 설치를 최신 이식 skill로 보완하도록 승인했다. 기존 상세 문서 전체 정비와 제품 리팩토링은 제외하고 기존 사용자 작업·Noline 고유 연결을 보존한다.

Project의 지속 의미·현재 현실·조건부 기준을 물리 layer로 분리하고 기존 flat 본문은 현재 authority에서 내려 원문을 보존한다. active 이식 Workspace는 새 제품 계획을 만들지 않고 최신 Spec·Ticket으로 이어간다. 이전 goal·constraints 원문은 해당 Workspace source에 보존한다.

Reference skill은 Noline의 `.claude/skills/` 원본과 `.agents/skills/` 상대 bridge에 적응한다. 동등 내용을 별도 `.codex/skills/`에 중복 설치하지 않는다. 기존 Claude hook·test·settings·wrappers·agents를 유지하고 최신 Recover·Maintain 계약을 함께 올린다.

기존 상세 Owner 전체를 지금 재작성하면 승인 범위와 후속 리팩토링의 출발 상태가 불필요하게 달라지므로 필요한 Project 재서술과 운영 연결만 바꾼다. 이 선택은 상세 문서가 모두 최신이라는 판정이 아니다. 실제 후속 작업에서 충돌이 확인되거나 제품 책임·지원 경계가 바뀌면 관련 Owner만 다시 대조한다.

[적용 Workspace 기록](../../context/work/workspaces/001-noline-context-harness-application/records/2026-09-09-01-reference-upgrade.md)이 source 판본·검증·미확인을 소유한다. 설치가 host activation·제품 acceptance·commit을 뜻하지 않는다.

## 2026-09-10 문서 전환 보완

위의 기존 Project 요약 보존 선택은 후속 보완에서 전환했다. 유효한 내용은 현재 layer에 통합하고, 현재 역할이나 호환 소비자가 없는 이전 파일은 현재 경로에서 제거한다. 해당 본문이 기존 Git HEAD와 동일함을 대조했으므로 원문은 Git 이력으로 복원한다. 계속 사용하는 상세 제품 정본과 이전 Workspace source·records는 유지한다. [문서 전환 기록](../../context/work/workspaces/001-noline-context-harness-application/records/2026-09-10-01-document-transition.md)이 내용 귀속·검증 근거를 소유한다.

## 2026-09-10 Project 관리 계약의 분리

사용자가 승인한 Source 변경을 재적용해 Project README는 구조·실제 내용 위치·권위 관계를, `MAINTENANCE.md`는 작성·복원·갱신 기준을 맡긴다. 관리 주체는 해당 작업에서 계약을 직접 읽으며 일반 Recover 입력은 늘리지 않는다. Noline 제품·domain 의미와 Workspace Maintain의 쓰기 권한은 바꾸지 않는다. 기존 문서 전환의 실행 결과는 Workspace 기록에 보존한다. [재적용 기록](../../context/work/workspaces/001-noline-context-harness-application/records/2026-09-10-02-project-management-contract.md)이 승인된 dirty Source 판본·내용 귀속·직접 검증을 소유한다.
