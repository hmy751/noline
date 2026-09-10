---
name: create-context-workspace
description: 이미 Context Harness가 설치된 Project 안에서 새 독립 Workspace를 만들거나 기존 Workspace의 후속 작업을 새 Workspace로 분리할 때 사용한다. "001에 이어 002를 만들어줘", "이 작업을 새 Workspace로 넘겨줘"처럼 새 Workspace 생성이 요청되면 적용한다. Context Harness 최초 이식, 기존 Workspace 단순 재진입·수정, Project context 반영만 요청한 경우에는 사용하지 않는다.
---

# Create Context Workspace

## 책임

이 skill은 이미 설치된 Project에서 새 Workspace를 구성하고 bounded 재진입을 검토하는 실행 장치다. 지속 원칙은 [`새 Workspace 생성과 전환`](../../../context/work/workspaces/CREATE-AND-TRANSITION.md)이 소유한다. 이 skill에 그 원칙이나 live schema를 별도 정본으로 복제하지 않는다.

최초 Context Harness 이식과 첫 Workspace 생성은 `apply-context-harness`의 책임이다. 이 skill은 설치 뒤 두 번째 Workspace부터 사용하며, 기존 Workspace의 단순 재진입·current 갱신이나 Project context 반영만을 위해 발동하지 않는다.

## 시작

1. `git rev-parse --show-toplevel`로 Project root를 확인한다. Root [`AGENTS.md`](../../../AGENTS.md), [`context/README.md`](../../../context/README.md), [`Project context`](../../../context/project/README.md), `context/project/common/README.md`, `current/README.md`, `guidance/README.md`, [`Work context`](../../../context/work/README.md), [`Workspace collection`](../../../context/work/workspaces/README.md)과 생성·전환 canonical을 끝까지 읽는다. Project의 세 layer 진입점이 없으면 새 Workspace 생성 중 임의로 보수하지 않고 Project context repair가 필요한 설치 상태로 분리해 알린다.
2. 적용되는 instruction, Git 상태와 새 Workspace exact path의 기존 파일·symlink를 확인해 사용자 변경과 이름 충돌을 보호한다. 기존 Workspace나 같은 이름의 skill·폴더를 덮어쓰지 않는다.
3. 요청이 무관한 새 작업인지 특정 predecessor의 후속인지, 새 goal·완료 장면·범위·Workspace id가 무엇인지 판단한다. 결과를 바꾸는 정보가 없고 안전하게 추론할 수 없을 때만 한 번에 묻는다. 후속 관계를 표현하려고 새 parent schema를 만들지 않는다.

## 생성

1. 생성·전환 canonical의 workflow에 따라 Project `context/project/README.md`에서 물리 layer 지도를 찾고, 관련 `common/`, `current/`, `guidance/` README에서 현재 goal에 필요한 실제 문서와 관련 Decision을 고른다. Guidance는 적용 조건이 맞을 때만 선택한다. README만 내용 payload로 삼거나 predecessor 전체를 복제·수정하지 않는다.
2. Live Workspace collection과 Harness contract에서 현재 machine shape를 확인한다. 유효한 기존 Workspace는 구조 참고로만 사용하고 sample goal·source·검증 값·receipt를 복사하지 않는다.
3. 새 Workspace의 사람용 진입점, machine identity와 Recover·Verify 계약, current·source·output·records를 새 goal에 맞게 구성한다. `recover.json`에는 Project root README와 goal에 필요한 `common/`, `current/`, `guidance/`, `decisions/` 아래 실제 문서만 이유와 함께 선택한다. 모든 layer를 자동 선택하지 않고, Verify의 canonical basis는 Recover 선택과 별도로 claim의 normative Owner에서 고른다. 제품 Verify를 아직 실행하지 않았다면 status에서 receipt·pass·완료를 가장하지 않는다.
4. 다음 세션의 판단을 바꾸는 의미는 successor current의 적절한 Owner에 직접 쓴다. 특정 원문을 먼저 읽어야 하면 current와 source에 exact canonical 접근점, 역할, 이유와 읽을 시점을 남긴다.
5. Detailed predecessor output·record·source는 필요한 것만 단방향으로 연결한다. 의도적으로 이어받지 않은 범주는 오해가 현재 판단을 바꿀 때만 bounded하게 적고, Project-wide 후보는 Project context Owner의 별도 판단 없이 승격하지 않는다. 생성 중 Project path·책임·authority 자체를 바꿔야 하면 먼저 그 Owner 변경을 분리하고 생성·전환 canonical이 정의한 live consumer를 reconcile한다. 보통의 Workspace 생성은 Project 전체 scan을 요구하지 않는다.

## 검토

1. 새 Workspace id를 명시해 bounded Recover를 실행한다. 기본 active index에 의존하지 않는다. Project Owner를 함께 바꿨다면 모든 영향받는 live consumer의 explicit Recover와 id 없는 active/default Recover도 실행한다.
2. 가능하면 새 read-only 주체에게 Recover packet만 주고 goal·제약·첫 판단·다음 행동·필수 원문 접근점을 설명하게 한다. 선택된 Project 문서가 README 안내만이 아니라 실제 판단 내용을 제공하는지, current의 machine Owner 설명과 `output/index.md`의 링크가 실제 canonical을 가리키는지도 판정하게 한다. 생성자의 결론이나 predecessor 자료를 함께 주지 않는다. 별도 주체가 없으면 packet 밖 자료를 다시 열지 않는 자체 검토로 대체하고 증거가 더 약함을 보고한다.
3. 검토가 실패하면 Recover 범위를 넓히거나 predecessor를 수정하지 않고 successor current와 source 선택을 보완한 뒤 다시 확인한다.
4. Live schema·local link·JSON·instruction과 관련 Harness 검사를 변경 위험에 맞춰 실행한다. Local link의 존재와 설명에 맞는 semantic target을 구분하고, sample·rename 잔재를 검사한다. 제품 Verify는 실제 제품 상태 전환 증거가 필요할 때만 실행하며 argv가 읽는 tracked input closure를 먼저 확인하고, pass를 acceptance나 완료로 바꾸지 않는다.

## 활성화와 보고

생성만 요청받았으면 `workspaces/index.json`과 현재 Main session의 explicit binding을 변경하지 않는다. 활성화도 요청받았으면 생성·전환 canonical에 따라 현재 binding과 Maintain의 처리 중·pending·failed 상태가 successor 판단에 미치는 영향만 확인하고 필요한 의미를 보완한 뒤, [`Maintain session binding·lifecycle canonical`](../../../context/work/harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 읽고 실행한다. 같은 Main session을 이어 가는 경우 현재 turn 안에서 현재 `CODEX_SESSION_ID`를 대상으로 `python3 .codex/hooks/maintain.py activate <successor_workspace_id>`를 실행한다. 성공하면 현재 turn은 predecessor로 마감하고 다음 prompt부터 successor를 사용한다. Grounding이 실패하면 기존 binding이 유지됐는지 확인하고 새 Main session을 fallback으로 보고한다. `.codex/maintain.json`, active index나 Project 기본값 변경으로 activation 완료를 가장하지 않는다.

마지막에는 다음을 짧게 보고한다.

- 새 Workspace id와 독립/후속 관계
- current에 직접 남긴 핵심 의미와 필수 source 접근점
- 단방향 참조와 의도적 비상속 범위
- bounded Recover와 독립 재진입 검토 결과
- active index·session binding 변경 여부, activation 결과와 실제로 증명하지 않은 host 범위
- commit 여부와 보호한 기존 변경

사용자가 명시하지 않으면 stage·commit하지 않는다.
