---
name: update-project-context
description: 작업 중 여러 Workspace에 계속 유효할 제품·domain 의미, 현재 Project 상태 또는 조건부 판단 기준의 변화가 명확해졌거나, 사용자가 Project 맥락 갱신·누락 복원·승인된 주제별 Owner 이동을 요청할 때 사용한다. Project 계약을 따라 근거 있는 내용과 열린 판단을 책임 층의 canonical에 반영한다. Workspace current만 갱신하거나 제품 구현만 수행하는 요청에는 사용하지 않는다.
---

# Update Project Context

이 skill은 [Project 관리 계약](../../../context/project/MAINTENANCE.md)을 적용하는 실행 절차다. [Project README](../../../context/project/README.md)는 구조와 권위·주제별 진입을, [구성 기준](../../../context/project/REFERENCE/composition.md)은 내용 선별·주제 구성·분리를 소유한다. 실제 제품 의미와 작업 계약은 각 내용 Owner에 남는다.

## 근거와 반영 범위 확인

1. Project root의 [AGENTS.md](../../../AGENTS.md), Project README, 관리 계약과 구성 기준을 직접 읽는다. 현재 요청이 변화 반영·복원·재구성·승인된 Owner 이동 중 무엇인지 확인하고, 관련 주제의 기존 본문을 선택한다.
2. 현재 Workspace와 요청 범위에 필요한 source·record·output, 제품·domain 문서와 code·test 등 직접 근거만 선택한다. Workspace를 읽을 때는 [`Work 지침`](../../../context/work/AGENTS.md)을 따른다. 다른 Workspace 전체나 archive를 기본 탐색하지 않는다.
3. Project 계약에 따라 남길 내용의 근거, 현재 역할, 기존 Owner와 반영 위치를 찾는다. 이번 작업이 기존 canonical의 일반 갱신·누락 복원인지, 사용자가 이미 한정해 승인한 주제별 Owner 이동인지 구분한다. 기존 사용자 변경과 같은 위치의 충돌을 확인한다.
4. 쓰기 전에 이번 변경의 대조 기준을 잡는다. 기존 Owner에서 보존할 의미, 직접 근거로 확인할 사실과 그 경계, 사용자 결정이 필요한 열린 선택, Owner·경로 변경으로 영향받는 실제 진입점을 구분한다. 이 기준은 작업 메모로 유지할 수 있으며 별도 영구 문서나 고정 표를 만들 필요는 없다.

## 반영과 확인

- 먼저 남길 의미와 다음 관련 작업에서 읽을 주제를 잡는다. 기존 본문에 통합할지 분리할지 구성 기준으로 판단한다. 원자료·Ticket·책임 층의 수를 파일 수로 바꾸거나 모든 주제에 세 층의 문서를 만들지 않는다.
- 일반 갱신·복원은 현재 authority에 따라 기준 본문을 맞춘다. 해당 주제의 의미와 계약·이유·구체적인 적용을 충분히 설명하되 구현 세부를 전부 복제하지 않는다. 미해결 부분 때문에 근거 있는 나머지를 누락하지 않는다.
- 승인된 주제별 Owner 이동은 관리 계약의 순서와 범위를 적용한다. `current`는 없애거나 축소하기로 미리 정하지 않고, 실제 구성에서 별도 현재 맥락의 효용과 유지비용을 확인한다.
- 이동 범위의 기존 canonical은 유효한 뜻을 통합한 뒤 구현 상세·근거·역사·호환 routing 중 실제 남은 역할로 좁히거나 Project 규칙에 따라 전환한다. 같은 현재 답을 소유하는 active canonical을 남기지 않는다. 승인되지 않은 Owner 이동이나 새로운 제품 결정이 필요할 때만 그 미해결 부분을 분리해 사용자 또는 명시된 책임자에게 판단을 요청한다.
- `current`에 구현·검증 정보를 두려면 그 정보가 다음 판단을 어떻게 바꾸고 어떤 변화에서 다시 확인할지 설명한다. 그 관계가 없는 실행 수치·도구 오류·미실행 항목은 Workspace 근거로 연결한다.
- 변경된 의미 때문에 설명·적용·판단·읽기 경로가 달라지는 문서를 함께 맞춘다. Project README와 층별 색인뿐 아니라 같은 작업을 시작시키는 active runbook·workspace guide·호환 문서·skill에서 실제 Owner까지 이어지는지 확인한다. 링크로 연결됐다는 이유만으로 모두 갱신하지 않는다. 경로·책임·authority가 바뀌면 Main이 Work 계약에 따라 live consumer reconciliation을 전체 작업에서 이어가게 명시한다. 이 skill 자체의 쓰기 범위를 Workspace나 제품 code·test·machine 상태로 넓히지는 않는다.
- 관리 계약의 반영 완료 기준에 따라 쓰기 전에 잡은 대조 기준으로 기존 의미의 보존·변경·의도적 제외를 확인하고, 여러 경계를 설명하는 사실의 문장 범위를 직접 근거와 맞춘다. 변경 뒤에는 기존 Owner와 영향받은 기존 작업 진입점에서 각각 시작해, 보존할 의미가 새 본문에 남아 있는지와 이전 경로의 독자가 변경된 기준·열린 판단에 도달하는지 확인한다. 이어 [읽기 기준](../../../context/project/REFERENCE/reading.md)으로 Project README의 주제별 경로에서도 같은 Owner에 도달하고, 본문만으로 맡은 의미를 이해한 뒤 구현으로 내려갈 수 있는지 본다. Local link·diff·문서 수는 이 의미 대조를 대신하지 않는다. 자체 대조와 실제 독립 적용·제품 실행의 증거를 구별하며 문서 갱신을 제품 검증·acceptance·Workspace 완료로 확대하지 않는다.

## 보고

반영한 내용과 근거, 선택한 책임 층과 기존 문서, 남은 판단과 다음 확인을 짧게 보고한다. 근거가 있어도 반영하지 못한 내용은 이유와 함께 밝힌다.
