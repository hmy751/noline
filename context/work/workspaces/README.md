# Workspaces

이 디렉터리는 [`Work context`](../README.md) 안에서 실제 작업을 복구하고 이어 가는 Workspace들의 지속 상태를 소유한다.

- [`index.json`](index.json): 명령에 Workspace id를 주지 않았을 때만 사용할 active 기본값을 선택한다. 명시한 id는 이 index와 독립적인 선택 권위다.
- 각 Workspace 디렉터리: 하나의 작업 정체성, 책임별 실행 계약, 현재 context, 선택한 원자료, goal 산출물 지도, 누적 기록을 함께 둔다.

각 Workspace의 내부 관계는 해당 `README.md`에서 시작한다. Harness는 이 자료를 읽고 갱신하는 관리 장치이며 Workspace의 목표, Project 기준, 사람의 판단을 소유하지 않는다.

## Workspace 내부 경계

- `workspace.json`: Workspace id와 schema를 가진 machine identity
- `recover.json` schema `6`: Project-root 상대 경로로 Recover가 읽을 Project Markdown과 선택 이유. 안정된 routing anchor인 `context/project/README.md`를 포함하고, 나머지는 `common/`, `current/`, `guidance/`, `decisions/` 아래에서 현재 goal에 필요한 실제 문서만 선택한다. Root 평면 본문과 미허용 layer는 선택할 수 없으며 문서 순서는 Workspace가 정한다.
- `verify.json` schema `2`: Verify가 연결할 구체적인 claim, 그 claim의 Project canonical basis, 고정 argv, evidence와 실행 제한. 사람의 다음 행동은 두지 않는다.
- `current/`: 다음 작업자가 이어받을 현재 유효 context와 machine status. `current/memory/`는 Spec 다섯 파일, Ticket 색인·본문, Project context 선택을 소유하고 `current/state/`는 Workspace 전체 상황과 다음 행동을 소유한다. 구성·내용·읽기·갱신 기준은 [Spec과 Ticket](SPEC-AND-TICKETS.md)이 정의한다. 현재 status schema `3`은 최근 제품 검증의 기계 결과와 receipt cursor만 소유하며, 과거 schema `2`는 기존 기록 복구를 위해 읽기 호환한다.
- `source/`: 이 Workspace가 작업 입력으로 선택한 원문, 변경하지 않은 snapshot, provenance를 분리·보존하는 층. `source/index.md`를 최소 inventory로 두며 별도 원자료가 없으면 그 사실과 Project canonical을 복제하지 않은 경계를 적는다. 원자료의 저자와 정본 권위는 원래 출처에 남으며, Workspace는 선택 범위·사용 시점·무결성·재접근 경로를 관리한다. 현재 판단, 분석, 결정, 실행·검증 기록은 두지 않는다.
- `output/`: Workspace goal을 위해 선택된 현재 산출물을 찾는 층. `output/index.md`를 최소 산출물 지도로 두고, 실제 산출물이 Project root의 코드·문서·테스트에 있으면 복제하지 않고 canonical 상대 경로를 연결한다. Workspace 안에서만 소유하는 goal 산출물은 이 폴더에 직접 둘 수 있다. 아직 선택된 산출물이 없으면 index에 없다고 명시한다.
- `records/`: source와 실제 작업을 바탕으로 만든 분석·결정·실행·검증 기록의 누적층. 분석 메모·후보·비교·탈락안·선택 근거처럼 goal 산출물을 만들고 고른 사람이 읽는 기록은 이 폴더 바로 아래에 날짜와 내용을 드러내어 둔다.
- `records/receipts/`: 기계가 만든 append-only 증거를 종류별로 격리하는 층. 제품 검증은 `verify/`, Harness 자체 검증은 `harness-tests/`, 이식 전 상태 캡처는 `preflight/`를 사용한다. 새 제품 Verify는 `records/receipts/verify/verify-*.json`에 쓰며 `status.json`의 receipt 경로는 Work root 상대다. 이전 flat `records/verify-*.json`만 기존 제품 Verify 증거의 읽기 호환 경로로 허용하고 다른 receipt 종류는 product status에 연결하지 않는다.

## 사람용 문서 작성과 갱신

Workspace의 사람용 Markdown은 각 파일이 맡은 역할 안에서 다음 판단과 재검토에 필요한 의미를 읽기 좋게 전달한다. 이 기준은 `current/`의 Spec·Ticket·추가 memory·state, `source/index.md`, `output/index.md`, `records/README.md`와 새 날짜별 record에 적용한다. Machine identity·계약·status·receipt, 변경하지 않는 raw source와 제품 산출물의 형식을 바꾸는 기준은 아니다.

문서를 만들거나 갱신할 때는 먼저 해당 층의 Owner 역할과 대상 문서의 기존 구성, 새 내용 사이의 관계를 읽는다. 전달받은 사실을 도착한 순서대로 옮기지 않고 의미에 따라 묶으며, 기존 문서에서는 아직 유효한 내용에 새 의미를 통합한다. 겹치는 설명은 합치고 새 결과가 대체한 상태·진행 문구는 고치거나 덜어 내며, 서로 떨어져 있어 이해를 방해하는 내용은 관계가 드러나게 재배치한다. 새 record도 대화나 실행 출력을 그대로 전사하지 않고 이후 판단을 재검토하는 데 필요한 사건·근거·결과를 조직한다.

문단·목록·소제목과 정보의 순서는 문서의 역할, 내용 사이의 관계와 기존 구성에 맞춰 선택한다. 모든 문서에 같은 하위 서식이나 고정 순서를 적용하지 않으며 기존 형식 유지와 새 형식 도입 중 어느 쪽도 기본값으로 삼지 않는다. 독자가 전달 순서를 다시 조립하지 않고도 그 문서가 맡은 현재 의미·판단 지점·근거 위치를 이해할 수 있는지를 본다. 출처 강도와 확인 범위는 구별하되 같은 단서를 문장마다 반복하지 않고 관련 주장을 묶는 수준에서 분명히 한다.

가독성을 이유로 층의 Owner를 흐리거나 같은 설명을 `current`·`source`·`output`·`records`에 복제하지 않는다. Current에는 현재 유효한 의미를, source에는 변경하지 않은 원문과 provenance를, output에는 선택한 산출물과 canonical 위치를, records에는 이후에도 살필 과정과 상세 근거를 둔다. 기존 record는 append-only 근거이므로 다시 편집하지 않으며 새 record와 색인을 읽기 좋게 만드는 것이 과거 record 재작성을 허용하지 않는다.

## 새 Workspace 생성과 관계

새 Workspace는 이전 Workspace의 후속이어도 자기 goal과 current를 소유하는 독립된 지속 단위다. Workspace 사이에 자동 동기화·역전파나 다른 Workspace의 current를 연쇄적으로 읽어야 하는 관계를 만들지 않는다.

새 goal에 필요한 의미를 선별하고 원자료와 상세 근거를 배치하며 bounded 재진입과 활성화 경계를 확인하는 전체 절차는 [`새 Workspace 생성과 전환`](CREATE-AND-TRANSITION.md)이 소유한다. Repo-local [`create-context-workspace` skill](../../../.agents/skills/create-context-workspace/SKILL.md)은 이 canonical을 실행하는 관리 장치이며 Workspace 의미의 Owner가 아니다.

`source/`는 Project 전체가 공유하는 실제 맥락인 [`context/project/`](../../project/)를 복제하는 곳이 아니다. Project context의 `common/current/guidance` 물리 layer와 권위 관계는 [`context/project/README.md`](../../project/README.md)가 소유한다. 작성·복원·갱신 기준은 [`Project 관리 계약`](../../project/MAINTENANCE.md)을 해당 작업에서 직접 읽는다. Workspace는 root README와 goal에 필요한 실제 layer 문서만 선택하고, 원자료를 다시 확인해야 할 때 사람이 필요한 항목만 따로 읽는다. `recover`는 Project layer 전체, `source/` 전체나 inventory를 기본 recovery packet에 싣지 않는다.

## Project context 변경과 live consumer

Project 문서의 path·책임·authority를 크게 바꾸면 그 문서를 만드는 쪽만 검사하지 않고 영향을 받는 live consumer를 확인한다. 여기에는 id 없는 Recover가 선택하는 active/default Workspace와 Maintain current generation에 explicit session-bound된 Workspace가 포함된다. 현재 변경에서 명시적으로 다루는 Workspace도 같은 범위로 본다. Session binding을 확인할 때에는 current generation과 Workspace id 같은 운영 metadata만 사용하고 `turns/`·`events/`의 사용자·Main 원문을 열거나 복제하지 않는다. 과거 generation, unbound session과 이미 소비 경로에서 내려온 역사 Workspace는 자동 갱신하지 않는다.

영향받는 live consumer는 `recover.json`의 실제 문서 선택, 사람용 current의 경로·machine Owner 설명, `output/index.md`의 target을 현재 canonical에 맞게 reconcile하거나 successor로 전환한다. 각 id로 explicit Recover를 실행하고 active/default 경로는 id 없는 Recover도 실행한다. 경로가 존재한다는 사실과 label·주변 설명이 의도한 실제 Owner를 가리킨다는 의미 판정을 분리한다. 이 reconciliation을 끝낸 뒤에만 역사 Workspace 비동기화 원칙을 적용한다.

Source 항목에는 가능한 범위에서 원래 위치나 URL, 확보 시각과 방법, commit·version·SHA-256 같은 안정적인 식별 근거를 함께 둔다. 해석이나 결론이 생기면 source를 고치지 않고 `current/` 또는 `records/`에 분리한다.

`output/`은 `records/`에서 일부 파일을 자동 승격하거나 복제하는 archive가 아니다. 사람이 goal의 현재 결과로 선택한 산출물과 canonical 위치를 보여 주며, 선택 이유와 이전 후보는 `records/`에 남긴다. `output/`에 있다는 사실만으로 검증 통과, 사람의 수락, Workspace 완료가 되지 않는다. `recover`는 `output/index.md`만 기본 packet에 싣고 연결된 산출물 본문은 필요할 때 선택해서 읽게 한다.

작업 중 반복 확인은 가능한 한 직접 test 명령으로 수행한다. Durable `verify` receipt는 Workspace 상태를 바꾸거나 다음 사람·세션에 검증 근거를 인계할 때 만든다. 작업 중 생긴 목표·판단·다음 행동의 의미 변화는 기존처럼 Maintain이 대화와 결과를 이해해 Spec·Ticket·state와 필요한 records에 반영한다. Main은 작업을 조율하고 필요한 결과를 다음 판단에 연결한다. 실행된 verify는 성공·실패 모두 사건이므로 자동 삭제하거나 같은 hash라는 이유로 합치지 않는다. 이 구분은 사람용 탐색과 불필요한 누적을 줄이는 운용 기준이며, retention 자동화는 아직 제공하지 않는다.

관리 장치의 책임별 목적·입력·출력은 [`Recover`](../harness/recover/), [`Maintain`](../harness/maintain/), [`Verify`](../harness/verify/)가 각각 정의한다. Harness 자체 회귀 검증은 [`Harness validation`](../harness/validation/)이 소유한다.
