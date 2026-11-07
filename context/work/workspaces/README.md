# Workspaces

이 디렉터리는 [Work context](../README.md) 안에서 서로 다른 작업의 정체성·현재 의미·선택한 입력과 산출물·누적 기록을 Workspace별로 유지한다. 각 Workspace의 README가 내부 관계를 설명하고 `recover.md`로 재개를 안내한다.

## 작업 목록과 기본 선택

- 기본 Workspace: [001-noline-context-harness-application](001-noline-context-harness-application/README.md) — Noline Context Harness application Workspace
- [002-code-readability-refactoring](002-code-readability-refactoring/README.md) — 코드 가독성 리팩토링
- [003-bug-investigation-and-fixes](003-bug-investigation-and-fixes/README.md) — 발견한 버그 확인·수정
- [004-project-context-contracts-and-guidance](004-project-context-contracts-and-guidance/README.md) — Project 계약 합의와 작성 지침 검증
- [005-context-based-code-improvement](005-context-based-code-improvement/README.md) — 02의 제품·구조·계약을 Project Context에 복원한다
- [006-project-context-reconstruction](006-project-context-reconstruction/README.md) — 006 — Project Context 재구성과 남은 `.claude` 정리
- [007-sync-failure-recovery](007-sync-failure-recovery/README.md) — 007 — 동기화 실패가 큐를 영구히 막지 않게 하기
- [008-exception-notice-rules](008-exception-notice-rules/README.md) — 008 — 앱의 예외 안내를 상황별 규칙으로 정리하기

사용자가 지정한 Workspace가 이 기본 선택보다 우선한다. 일반 재개는 [Work 지침](../AGENTS.md)을 따르며, 기본 선택 변경·현재 요청의 대상·host 세션 상태는 [생성·전환](CREATE-AND-TRANSITION.md)에서 구별한다.

## Workspace 내부 경계

| 위치 | 소유하는 내용 |
| --- | --- |
| `README.md` | 작업의 정체성·범위와 바로 아래 구성의 관계, 재개 안내 위치 |
| `recover.md` | 현재 재개 초점과 기본·조건부 읽기 대상·이유. 내용과 갱신 기준은 [Work 지침](../AGENTS.md#재개-안내를-구성하고-갱신한다)이 소유한다. |
| `current/` | 다음 작업자가 이어받을 현재 유효한 의미. memory는 Spec·Ticket·선택한 맥락, state는 전체 상황·다음 행동을 맡는다. 상세는 [Spec·Ticket](spec-and-tickets/README.md)을 따른다. |
| `source/` | 선택한 원문·변경하지 않은 snapshot·provenance. `source/index.md`에 선택 범위와 출처를 두며 현재 해석·결정·실행 기록은 쓰지 않는다. |
| `output/` | goal을 위해 선택한 현재 산출물 지도. `output/index.md`에서 실제 canonical을 연결하며 Project 코드를 복제하지 않는다. Work가 소유하는 산출물은 직접 둘 수 있다. |
| `records/` | 분석·후보 비교·선택·탈락 이유·실행·검증의 누적 근거. 날짜별 과거 record는 보존하고 보완은 새 기록으로 연결한다. |
| `records/receipts/` | 이미 생성된 기계 증거를 종류별로 보존한다. 기존 Verify receipt는 당시 실행 근거이며, 새 Workspace에 특정 receipt 종류·기계 상태를 의무화하지 않는다. |

원자료의 저자와 정본 권위는 원래 출처에 남는다. Source에는 가능한 범위에서 원래 위치·확보 시점·방법·commit/version/hash 등 재접근과 대조에 필요한 근거를 남긴다. 원자료가 없으면 inventory에 그 사실을 밝히며 빈 자료를 만들지 않는다.

Output은 records를 자동 승격하는 archive가 아니다. 현재 결과로 선택한 위치와 의미를 설명하며 선택 이유·이전 후보는 records에 남긴다. 산출물의 존재는 검증 통과·사람 수락·Work 완료를 뜻하지 않는다. 안내된 output 색인을 읽었다고 연결된 모든 산출물 본문을 읽은 것으로 간주하지 않는다.

## 문서 관리와 생성

문서를 만들거나 고칠 때 [문서 작성과 갱신](DOCUMENT-WRITING.md)을 적용한다. [Spec·Ticket](spec-and-tickets/README.md)은 내용과 유지 관계를, [생성·전환](CREATE-AND-TRANSITION.md)은 새 목표 구성·인수·선택 변경을 소유한다. [record-work](../../../.agents/skills/record-work/SKILL.md)는 원문 판단과 직접 기록을 맡는 수행 수단이다.

새 Workspace는 후속 작업이어도 자기 goal과 current를 소유한다. Workspace 사이 자동 동기화·역전파나 다른 current를 차례로 읽어야 하는 계승 사슬을 만들지 않는다. Project의 본문과 권위는 [Project](../../project/README.md), 관리 기준은 [Project 관리](../../project/MAINTENANCE.md)가 소유하며 Workspace에는 필요한 선택 이유와 적용 의미만 남긴다.

## Project context 변경과 live consumer

Project의 경로·책임·권위가 크게 바뀌면 실제 소비 경로를 확인한다. 기본 Workspace, Main·기록 담당자에게 명시적으로 배정되어 현재 작업 중인 Workspace, 이번 변경 대상이 포함된다. 무관한 대화·역사 Workspace를 전수 조사하거나 자동 갱신하지 않는다.

영향받는 Workspace의 `recover.md`, 선택한 Project 맥락, current의 설명과 output target을 현재 canonical에 맞추거나 후속 Workspace로 전환한다. 명시한 Work와 미지정 일반 재개가 각각 맞는 대상으로 이어지고, 안내가 필요한 본문·이유·조건을 제공하는지 읽어 확인한다. 링크 존재와 label·주변 설명이 의도한 실제 Owner에 도달하는 의미 확인을 구별한다. 현재 소비 경로를 맞춘 뒤 역사 Workspace 비동기화 원칙을 적용한다.

반복 검사는 직접 test·eval·수동 확인으로 수행한다. 인계·완료 판단에 필요한 실행 조건·대상 판본·결과·한계는 해당 Ticket·records에 남기고 state에서 현재 의미로 연결한다. 과거 receipt는 결과가 같아도 자동 삭제·병합하지 않으며, 선언된 옛 입력과 현재 대상이 같은지 확인하지 않은 채 최신 성공으로 사용하지 않는다.
