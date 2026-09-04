# 새 WORKSPACE 생성과 전환

이 문서는 이미 Context Harness가 설치된 Project에서 새 Workspace를 만들고 다음 세션이 독립적으로 재진입할 수 있게 준비하는 전체 계약의 canonical이다. Workspace collection과 각 내부 Owner의 의미는 [`README.md`](README.md)가 소유하고, 이 문서는 생성·전환 동작의 시작 조건, 의미 선별, 산출물, 검토와 활성화 경계를 소유한다.

Repo-local [`create-context-workspace` skill](../../../.agents/skills/create-context-workspace/SKILL.md)은 이 계약을 적용하는 교체 가능한 관리 장치다. Skill을 사용하지 않거나 제거해도 사람이나 다른 AI가 이 문서를 따라 같은 책임을 수행할 수 있어야 하며, skill 문장을 이 계약의 두 번째 정본으로 사용하지 않는다.

## 시작 조건과 책임

서로 무관한 작업을 새 Workspace로 시작하거나, 현재 작업에서 이어지는 새 goal을 후속 Workspace로 분리할 때 적용한다. 기존 Workspace에 재진입하거나 그 Workspace 안의 current를 갱신하는 일에는 적용하지 않는다.

- 사람은 새 goal, 완료 장면, 범위, 중요한 source 권위, Project 전체 반영과 acceptance를 결정한다.
- Main 또는 이 계약을 적용하는 skill은 새 goal을 해석하고 필요한 현재 의미를 선별해 새 Workspace의 기존 Owner 구조에 배치한다.
- Workspace schema와 Harness validation은 id·shape·경로·파일 안전처럼 명시 가능한 조건만 검사한다. 중요한 의미가 빠지지 않았다는 보장은 하지 않는다.
- Recover는 완성된 bounded packet을 읽고, Maintain은 explicit Workspace 하나 안의 변화를 관리한다. 둘 다 새 Workspace 생성, predecessor 탐색과 Workspace 사이 동기화를 소유하지 않는다.

새 Workspace는 predecessor의 다음 번호이거나 후속 작업이어도 자기 goal과 current를 소유하는 독립된 지속 단위다. 서로 무관한 새 작업에는 predecessor 관계를 만들지 않는다.

## 생성 workflow

1. 사용자가 정한 새 goal, 완료 장면, 범위와 하지 않을 것을 먼저 고정한다. 새 Workspace id나 goal을 안전하게 추론할 수 없거나 검증 기준·source 권위의 선택이 결과를 바꾼다면 관련 write 전에 사용자에게 묻는다.
2. 현재 Project context와 새 goal에 실제로 이어지는 predecessor의 current, 선택된 output, 정확한 source와 필요한 record만 확인한다. 관련 이유가 없는 다른 Workspace를 넓게 탐색하지 않는다.
3. 후보마다 그것을 모르면 새 goal, 계속 지킬 제약, 첫 판단, 현재 산출물의 의미 또는 다음 행동이 달라지는지 판단한다. 지금도 유효한지, 원문을 직접 다시 읽어야 하는지, 실제 canonical과 Owner가 어디인지 함께 확인한다.
4. 다음 재진입에 계속 적용되는 의미는 링크로 대신하지 않고 새 Workspace의 적절한 current Owner에 직접 서술한다. Goal에 관한 의미는 goal에, 계속 지킬 제약은 constraints에, 현재 열린 판단과 다음 행동은 사람용 state에 둔다.
5. 원문 전체가 기본 current에는 불필요하지만 특정 판단 전에 직접 읽어야 한다면 `source/index.md`에 원래 canonical과 provenance를 선택한다. Recover가 읽는 current에도 exact canonical 경로나 직접 링크, 문서의 역할, 필요한 이유와 읽을 시점을 함께 남긴다. Source나 current의 링크만으로 필수 재진입 의미 자체를 대신하지 않는다.
6. Predecessor만 소유하는 당시 선택 이유나 상세 과정은 복제하지 않고 exact output·record·source를 단방향으로 가리킨다. 관련 있어도 새 goal의 판단과 행동을 바꾸지 않는 과거 상태, 세부 과정, 후보와 실행 기록은 predecessor에 그대로 둔다.
7. 과거의 특정 범주가 successor에도 계속 적용된다고 오해할 가능성이 있고 그 오해가 현재 판단을 바꾼다면, 빠진 파일을 전부 열거하지 않고 그 범주와 지금 적용하지 않는 이유·현재 영향만 successor current에 적는다. 선택·제외 판단을 나중에 재검토할 필요가 있으면 새 Workspace record에 남긴다.
8. [`Workspace 내부 경계`](README.md#workspace-내부-경계)에 맞춰 사람용 진입점, machine identity와 Recover·Verify 계약, current·source·output·records를 완성한다. 기존 Workspace의 파일이나 값을 통째로 복제하지 않고, live schema와 새 goal에 맞는 Project context·검증 claim·evidence·상태를 각각 구성한다. 아직 제품 Verify를 실행하지 않았다면 machine status는 receipt나 성공을 가장하지 않는다.

## Workspace 사이의 참조 경계

- Successor는 predecessor의 `current/` 전체를 live dependency로 삼지 않는다. 현재 적용되는 의미는 자기 current에 소유하고, 상세 근거만 정확한 canonical이나 predecessor의 exact artifact로 연결한다.
- 두 Workspace 사이에 자동 전파, 상호 갱신이나 역전파를 만들지 않는다. Predecessor가 나중에 바뀌어도 successor가 자동 추종하지 않으며, 영향이 생기면 successor가 원래 canonical과 현재 사실을 다시 대조해 자기 current를 갱신한다.
- 과거 Workspace의 상세 근거를 읽을 수는 있지만, 다른 Workspace의 current를 차례로 복구해야만 이해되는 계승 사슬은 만들지 않는다.
- 이 관계를 표현하기 위해 필수 `parent_workspace_id`, 공통 handoff 문서, 새 schema·hook이나 동기화 장치를 전제하지 않는다.
- Workspace 밖 Project 전체에도 적용될 수 있는 사실은 Project context 후보로만 다룬다. 실제 반영은 [`Project context`](../../project/README.md)의 상세 Owner와 source 권위가 Project 전체 적용을 뒷받침하는지 별도로 판단한 뒤 그 Owner가 결정한다. 여러 Workspace가 사용했다는 사실만으로 승격하지 않는다.

## Bounded 재진입 검토

생성한 Workspace를 작업 대상으로 전환하기 전에 predecessor를 보지 못한 새 주체에게 그 Workspace의 explicit bounded Recover packet만 제공하고 다음을 확인한다.

- 현재 goal, 제약, 실제 상태와 다음 판단을 설명할 수 있는가.
- 이전 작업에서 현재 의미로 이어받은 것과, 계속 적용된다고 오해할 수 있지만 의도적으로 이어받지 않은 범주를 구분할 수 있는가.
- 추가 원문이 필요하다면 exact 접근점, 역할, 이유와 어느 판단 전에 읽을지를 알 수 있는가.
- Predecessor 전체를 다시 Recover하거나 연쇄적으로 거슬러 올라가지 않고 첫 행동을 시작할 수 있는가.

가능하면 생성자의 warm 이해를 공유하지 않는 별도 주체가 검토한다. 별도 주체를 사용할 수 없으면 생성자가 packet 밖 자료를 다시 열지 않고 같은 질문을 점검하되 더 약한 증거임을 밝힌다. 부족하면 Recover가 과거를 더 읽게 하지 않고 successor의 current와 source 선택을 보완한다. 파일 존재와 schema validation만으로 의미 충분성을 통과했다고 주장하지 않는다.

## 생성과 활성화 경계

Workspace 생성과 실제 활성화는 별도 결정이다. 생성만 요청받았으면 `workspaces/index.json`과 현재 Main session의 explicit binding을 바꾸지 않는다. 새 Main session은 Project의 active index, 기본 Workspace나 대화 주제로 Maintain에 자동 가입하지 않는다.

현재 작업을 successor로 전환할 때 새 Main session을 보편적으로 강제하지 않는다. 먼저 현재 binding과 background Maintain의 처리 중·pending·failed 상태를 확인한다. 미반영 내용이 successor의 goal·제약·첫 판단·다음 행동을 바꾸면 predecessor current를 먼저 보완하거나 successor가 알아야 할 의미를 직접 남긴다. 관련 없는 미처리 상태는 predecessor에 그대로 보존할 수 있으며, 존재 자체만으로 전환을 막지 않는다.

같은 Main session을 이어 간다면 Main이 현재 사용자 turn 안에서 `CODEX_SESSION_ID`를 대상으로 `python3 .codex/hooks/maintain.py activate <successor_workspace_id>`를 실행한다. 실행 메커니즘과 operational state의 canonical은 [`Maintain session binding과 lifecycle`](../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)이다. 이 전환에서는 새 Maintain grounding이 실제로 성공한 뒤에만 future turn binding을 바꾸고, 이미 접수된 현재 prompt와 그 Stop은 predecessor로 마감하며 다음 prompt부터 successor를 사용한다. Grounding이 실패하면 기존 binding을 유지한다. 현재 host가 이 경계를 지원하지 않으면 새 Main session을 fallback으로 사용하며, 더 강한 격리나 독립 재진입이 필요할 때도 새 session을 선택할 수 있다.

Successor 판단을 실제로 바꾸는 미반영 의미는 전환 전에 정리하지만, 관련 없는 pending의 존재만으로 이동을 막거나 successor로 넘기지 않는다. 이전 generation의 pending·failed·late worker 귀속과 `deactivate`의 runtime 보존 계약은 Maintain session lifecycle canonical이 소유한다.

Active 기본값이나 `.codex/maintain.json`을 바꿨다는 사실만으로 actual activation, background event 반영 또는 새 grounding 완료를 주장하지 않는다. `activate` 성공 결과와 session별 persisted binding을 확인한다. Adapter test와 actual Codex host acceptance의 증명 범위는 Maintain session lifecycle canonical을 따른다.

## 완료와 증명 상한

생성 책임은 새 Workspace의 구조와 현재 의미를 구성하고 bounded 재진입 검토 결과를 보고하는 데서 끝난다. 사람의 acceptance, Workspace 완료·보관, Project context 반영과 commit은 각각 별도 권한이다.

Repo-local skill과 검토 절차는 의미 누락 가능성을 줄이지만, 자동 skill 선택, 자동 의미 선별, 의미 충분성이나 actual host 활성화를 결정적으로 보장하지 않는다. 반복되는 구조 오류가 실제로 확인되기 전에는 이 의미 판단을 새 schema나 생성 script로 고정하지 않는다.
