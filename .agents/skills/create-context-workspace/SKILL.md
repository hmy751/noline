---
name: create-context-workspace
description: >-
  독립 목표를 위한 새 Work를 만들거나 기존 작업의 일부를 새 Work로 분리해 달라는 요청에 사용한다.
  필요한 현재 의미를 구성하고 인수를 확인하며, 전환도 요청됐으면 대상 계약으로 이어간다.
  같은 Work의 단순 재개·기록 갱신·맥락 읽기나 Project context 최초 이식에는 사용하지 않는다.
---

# Create Context Workspace

요청한 새 목표의 Work를 구성해 다음 수행자가 이전 대화 없이 시작할 수 있게 한다. 생성 범위·의미 계승·인수·전환의 정본은 대상 Work의 생성 계약이다. Noline에서는 [Work 생성과 전환](../../../context/work/workspaces/CREATE-AND-TRANSITION.md)을 사용한다. 본문 구조는 대상 Work가 소유하고 이 스킬은 그 계약을 실행해 실제 결과와 남은 범위를 반환한다.

## 대상과 요청을 연결한다

사용자 지정 대상에서 적용 root·context·Work 진입과 생성 계약을 찾는다. 이 스킬의 경로나 Git 최상위를 대상 Project로 가정하지 않는다. 기존 Work와 새 목표의 관계·완료 장면·허용 범위, 실제 목록·새 경로의 기존 파일·사용자 변경과 기존 symlink를 확인하고 같은 경로의 Workspace를 덮어쓰지 않는다. 중요한 정보가 기존 요청과 근거로 정해지면 중복 확인 없이 진행한다.

새 목표 분리가 요청된 경우에만 생성한다. 첫 Work도 대상에 이미 정한 내용 구조가 있으면 같은 계약으로 구성할 수 있다. 구조나 필수 근거가 실제로 부족하면 해당 공백만 설명하고, 퇴역한 Harness를 설치하거나 Project 전체를 repair하는 과업으로 바꾸지 않는다. 최초 context 이식은 `apply-context-harness`의 책임으로 구별한다. 기존 Work로의 전환만 요청됐다면 생성 없이 대상의 전환 계약을 따른다.

## 현재 의미를 구성하고 확인한다

대상 계약의 의미 선별 기준으로 필요한 Personal·Project 원문, 실제 결과, 관련 이전 Work 근거를 읽는다. 이미 유효하게 확보한 자료를 재사용하며 읽기 방법은 대상 context의 공통 지침을 따른다. Noline의 [공통 읽기](../../../context/USAGE.md)를 생성 때의 전면 재독 단계로 만들지 않는다.

선택한 의미를 새 README·current와 필요한 source·output·records에 배치한다. 기존 Workspace는 구조 참고로 사용하고 목표·결과·receipt·완료 상태를 복사하지 않는다. 작성 중 새 제품 약속이나 기존 권한 밖의 선택이 필요해지면 그 판단을 Main에게 연결하며 생성 권한으로 대신 결정하지 않는다.

[Work 재개 기준](../../../context/work/AGENTS.md)에 따라 새 Workspace 루트에 `recover.md`를 구성하고 README에서 연결한다. 기본 읽기와 조건부 상세의 대상·이유·필요한 절이나 구간을 새 목표에 맞춰 고른다. 현재 판단·조건·미정은 해당 current가 직접 설명하고, 재개 안내는 자료 선택에 필요한 뜻과 접근점을 연결한다. 선택한 Project·Personal 자료 목록을 여러 진입점에 복제하지 않는다.

생성 뒤에는 [대상 계약의 인수 확인](../../../context/work/workspaces/CREATE-AND-TRANSITION.md#새-진입에서-인수를-확인한다)으로 README·재개 안내에서 필요한 의미·접근·첫 행동을 복원할 수 있는지 대조한다. 파일·링크 검사와 실제 읽기 확인의 범위를 구별하고, 필수 누락은 해당 current·재개 안내·선택을 보완한다. 기존 원본·사용자 변경이 보존됐는지도 확인한다. 제품 구현·검사를 수행하지 않았다면 생성 확인으로 그 결과를 주장하지 않는다.

## 생성과 전환 결과를 반환한다

생성만 요청받았으면 대상 목록에 존재와 준비 상태를 연결하고 기본 선택·현재 연결을 유지한다. Noline의 기본 Workspace는 [collection 안내](../../../context/work/workspaces/README.md)가 가리킨다. 전환까지 요청받았으면 [대상 전환 계약](../../../context/work/workspaces/CREATE-AND-TRANSITION.md#요청에-맞춰-전환한다)을 수행한다. 새 Workspace 경로만 만들거나 목록을 고친 것을 실제 host 연결로 보고하지 않는다. [record-work](../record-work/SKILL.md)의 담당자에게는 대상·입력 범위를 새로 배정하며 원래 Work의 진행 중 기록·미반영 범위와 섞지 않는다.

마지막에는 새 Work의 목표·위치, 직접 구성한 핵심 의미, 인수 확인과 미확인, 실제로 바뀐 선택·연결과 남은 행동을 요청의 크기에 맞게 설명한다. 같은 Main이 수행하면 이 결과를 기존 작업 설명·기록에 잇고 별도 완료 보고서를 만들지 않는다. stage·commit·배포는 해당 요청의 권한을 따르며 Work 생성만으로 추가하지 않는다.

이 구성의 목적·prototype의 선택과 Reference 전환 이유·적용 한계를 이해하거나 수정할 때는 [형성 자료](_background/README.md)를 읽는다. 운영 설치·자동 발견·host 전환의 효과는 이 본문을 만들었다는 사실만으로 확인되지 않는다.
