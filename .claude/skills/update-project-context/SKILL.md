---
name: update-project-context
description: 작업 중 여러 Workspace에 계속 유효할 제품·domain 의미, 현재 Project 상태 또는 조건부 판단 기준의 변화가 명확해졌거나, 사용자가 Project 맥락 갱신·누락 복원·승인된 주제별 Owner 이동을 요청할 때 사용한다. Project 계약을 따라 근거 있는 내용과 열린 판단을 책임 층의 canonical에 반영한다. Workspace current만 갱신하거나 제품 구현만 수행하는 요청에는 사용하지 않는다.
---

# Update Project Context

이 skill은 [`Project context 관리 계약`](../../../context/project/MAINTENANCE.md)을 적용하는 실행 절차다. [`Project context README`](../../../context/project/README.md)는 구조와 권위 관계를, 관리 계약은 내용 복원·변경·갱신 기준을 소유하며 실제 제품 의미는 각 내용 Owner에 남는다.

## 근거와 반영 범위 확인

1. Project root의 [`AGENTS.md`](../../../AGENTS.md), Project context README, 관리 계약과 관련 책임 층의 진입점·기존 문서를 읽는다. 현재 요청이 작업 중 변화 반영인지 기존 맥락 복원인지 확인한다.
2. 현재 Workspace와 요청 범위에 필요한 source·record·output, 제품·domain 문서와 code·test 등 직접 근거만 선택한다. Workspace를 읽을 때는 [`Work 지침`](../../../context/work/AGENTS.md)을 따른다. 다른 Workspace 전체나 archive를 기본 탐색하지 않는다.
3. Project 계약에 따라 남길 내용의 근거, 현재 역할, 기존 Owner와 반영 위치를 찾는다. 이번 작업이 기존 canonical의 일반 갱신·누락 복원인지, 사용자가 이미 한정해 승인한 주제별 Owner 이동인지 구분한다. 기존 사용자 변경과 같은 위치의 충돌을 확인한다.

## 반영과 확인

- 일반 갱신·복원은 Project 계약의 내용 충분성과 현재 authority를 적용해 해당 층의 기존 canonical을 갱신한다. 미해결 부분은 계약에 맞게 드러내며, 그 때문에 근거 있는 나머지 내용까지 누락하지 않았는지 확인한다.
- 승인된 주제별 Owner 이동은 Ticket·Workspace·evidence 묶음이 아니라 지속되는 책임과 판단 질문을 기준으로 내용을 구성한다. `common/current/guidance`와 필요한 `decisions`에 나누고, 각 선택 문서가 링크 없이도 맡은 주제의 뜻·현재 답·경계·재검토 신호를 설명하게 한다.
- 이동 범위의 기존 canonical은 유효한 뜻을 통합한 뒤 구현 상세·근거·역사·호환 routing 중 실제 남은 역할로 좁히거나 Project 규칙에 따라 전환한다. 같은 현재 답을 소유하는 active canonical을 남기지 않는다. 승인되지 않은 Owner 이동이나 새로운 제품 결정이 필요할 때만 그 미해결 부분을 분리해 사용자 또는 명시된 책임자에게 판단을 요청한다.
- 같은 내용을 찾는 layer README·root index·link를 갱신한다. Project path·책임·authority가 바뀌면 현재 작업의 Main이 Work 계약에 따라 live consumer reconciliation을 같은 전체 작업에서 이어가게 명시한다. 이 skill 자체의 쓰기 범위를 Workspace나 제품 code·test·machine 상태로 넓히지는 않는다.
- 변경한 문장과 직접 근거, local link와 diff를 대조한다. Fresh reader가 source 링크를 열지 않고 선택 문서만으로 각 주제의 현재 의미와 authority 관계를 설명할 수 있는지 확인한다. 문서 갱신을 제품 검증·acceptance·Workspace 완료로 확대하지 않는다.

## 보고

반영한 내용과 근거, 선택한 책임 층과 기존 문서, 남은 판단과 다음 확인을 짧게 보고한다. 근거가 있어도 반영하지 못한 내용은 이유와 함께 밝힌다.
