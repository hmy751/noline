# Work context 운영 규칙

이 파일은 `context/work/` 아래의 Workspace와 Harness를 다루는 작업 지침이다. Work context의 의미와 관계는 [`README.md`](README.md), Workspace collection의 의미는 [`workspaces/README.md`](workspaces/README.md), Harness 책임의 관계는 [`harness/README.md`](harness/README.md)가 각각 소유한다.

## 재진입과 검증

명령은 Project root에서 실행한다.

```bash
python3 -m context.work.harness recover
python3 -m context.work.harness maintain bootstrap <workspace_id>
python3 -m context.work.harness verify
```

- Recover의 목적·입력·출력·비소유 범위는 [`harness/recover/README.md`](harness/recover/README.md)가 정의한다.
- Maintain의 목적·내부 책임 관계·Owner routing·비소유 범위는 [`harness/maintain/README.md`](harness/maintain/README.md)가, session admission·binding·host lifecycle 상세는 [`harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md`](harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)가 정의한다.
- Verify의 목적·입력·출력·상태 반영 범위는 [`harness/verify/README.md`](harness/verify/README.md)가 정의한다.
- Harness 자체 회귀 검증의 범위는 [`harness/validation/README.md`](harness/validation/README.md)가 정의한다.
- 지속 Workspace의 내부 관계는 [`workspaces/README.md`](workspaces/README.md)와 각 Workspace README가 정의한다.
- Workspace의 사람용 문서를 작성·갱신할 때는 [`문서 작성과 갱신`](workspaces/DOCUMENT-WRITING.md)을 직접 읽는다. 글의 기준은 그 문서가 소유하고 실제 작성 책임과 허용 범위는 해당 작업·Maintain 계약을 따른다.

## 책임과 활성 시점

- **Recover**: 새 세션이나 새 작업 주체가 선택한 Workspace에 재진입하거나 현재 context를 다시 구성해야 할 때 실행한다. 제한된 recovery packet을 읽기 전용으로 만들며 작업 중 context를 갱신하거나 제품 정합성을 입증하지 않는다.
- **Maintain**: 사용자가 현재 작업에 명시적으로 선택한 Workspace만 해당 Main session에 연결하고 bounded Recover packet으로 semantic agent를 한 번 grounding한다. 연결된 generation의 사용자 대상 Main response-end를 같은 agent가 점검하며, 명확한 변화만 guarded apply를 거쳐 기존 Owner에 반영한다. 연결하지 않은 새 session은 조용한 no-op이고, No-change는 write·report 없이 끝내며 ambiguity는 관련 write 전에 사용자에게 돌린다.
- **Verify**: Workspace 상태 전환이나 인계에 남길 지속적인 제품 증거가 필요할 때 실행한다. `verify.json`의 고정 명령을 실행하고 receipt와 machine status를 남기지만 context의 의미를 갱신하거나 사람의 acceptance를 결정하지 않는다.
- **Harness validation**: 작업 흐름의 단계가 아니라 Harness 자체 검증 경계다. Recover·Verify 계약이나 구현이 바뀔 때 임시 Project/Workspace fixture에서 결정적 회귀 검사를 실행하고 실제 active Workspace의 receipt나 status를 생성·변경하지 않는다.

<!-- evidence-collector:start -->
## 증거 수집 연결

이 Project의 Workspace 작업에는 당시 자료와 회고 단서를 보존하는 독립 증거 수집기를 선택적으로 연결한다. 로컬 `evidence-collector/`가 없으면 미설치 상태이며 기존 Workspace 작업을 계속한다. 개인 폴더가 Git에서 제외돼 있어도 설치돼 있으면 아래 명시 경로로 운영 안내를 읽을 수 있다. 수집 연결이 켜져 있을 때 사용자가 선택한 Workspace의 activation이 성공하면 다음 사용자 요청부터 수집한다. Workspace 문서를 읽거나 생성한 것만으로 session이 연결된다고 판단하지 않는다.

Main은 기존 Workspace 연결·전환·해제 명령을 사용한다. 원래 요청의 귀속은 연결 어댑터가 전달하며, Main이 사건별 수집 호출·승인·대기·재시도·결과 보고를 수행하지 않는다. 수집 실패 때문에 Main이 대신 수집하거나 개발 흐름에 추가 절차를 넣지 않는다. 연결 성공을 실제 자료 수집 완료나 평가 결과로 해석하지 않는다.

수집 범위·기록·실행 상태 확인, 중단·재개 또는 문제 해결이 필요한 때 수집기 운영 안내 `../../evidence-collector/README.md`를 읽는다. 그 안내가 수집 상세를 소유하며, Workspace 선택과 지속 context의 갱신 책임은 기존 Work·Maintain 계약을 따른다.
<!-- evidence-collector:end -->

## 새 Workspace 생성과 전환

새 Workspace를 만들거나 현재 작업을 후속 Workspace로 분리하는 요청에는 repo-local [`create-context-workspace` skill](../../.agents/skills/create-context-workspace/SKILL.md)을 사용한다. Skill과 main은 [`생성·전환 canonical`](workspaces/CREATE-AND-TRANSITION.md)을 적용하며, 상세 의미를 이 운영 파일에 다시 정의하지 않는다.

기존 Workspace의 단순 재진입·수정이나 이미 만든 Workspace로의 전환에는 생성 skill을 다시 사용하지 않는다. 생성과 actual activation은 별도 경계다. 전환 요청에서는 canonical에 따라 현재 binding과 Maintain의 처리 중·pending·failed 상태가 successor 판단에 미치는 영향을 확인하고, 같은 Main session을 이어 갈지 새 session으로 격리할지 정한다. 같은 session을 잇는다면 [`session binding·lifecycle canonical`](harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)에 따라 현재 turn 안에서 `python3 .codex/hooks/maintain.py activate <successor_workspace_id>`를 실행한다.

## Maintain agent routing

Main이 자동 lifecycle 없이 수동 fallback으로 호출할 Maintain role 정의는 [`harness/maintain/workspace-context-maintainer.toml`](harness/maintain/workspace-context-maintainer.toml)이다. Project-scoped role `workspace_context_maintainer`는 Project root의 [`.codex/config.toml`](../../.codex/config.toml)이 이 파일을 `config_file`로 등록한다. 자동 경로는 이 등록 role을 시작하는 것이 아니라 `codex_session.py`가 같은 Maintain 계약을 읽는 별도 persisted thread를 시작하고 hook adapter가 lifecycle을 연결한다. Agent 계약과 Maintain 책임은 Work 아래에 두고, 루트 설정에는 수동 role 발견에 필요한 경로만 둔다.

새 Main session의 unbound 기본값, explicit activation·rebind·deactivation, generation 전환, prompt·response-end·late worker 귀속, hook·notice·runtime과 실제 host 증명 상한은 [`SESSION-BINDING-AND-LIFECYCLE.md`](harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)를 따른다. 이 control은 Main만 실행한다는 운영 정책이며 현재 CLI가 Main과 같은 outer session id를 가진 subagent를 기술적으로 인증해 거부하는 권한 장치는 아니다.

Maintain semantic agent는 연결된 response-end의 durable 의미만 판단한다. 이미 입력에 포함된 제한된 실제 근거나 기존 Verify 결과가 있으면 그 입증 범위를 보존할 수 있지만, host adapter나 Maintainer가 repository 전체 diff·Git 상태·test/eval evidence를 기본 수집하거나 새 검증을 실행하지 않는다. 살아 있는 session에서 warm identity가 사라지면 warm이라고 가장하지 않고 실패로 드러낸다.

Maintain semantic agent는 read-only이며 다른 Workspace나 active index를 기본 탐색하지 않는다. Structured decision의 수정 후보는 guarded apply만 실행하며 raw source snapshot·제품 코드·machine 계약·Verify receipt·status와 active index를 거부한다. Important 결과는 실제 apply 성공 뒤에만 보고하고, agent 보고나 정적 검사가 사용자 acceptance를 대신하지 않는다. 바깥 Project에 이름이 비슷한 maintainer가 있어도 이 Reference agent로 간주하지 않는다.

Project agent role 등록만으로 automatic lifecycle·warm reuse·매 response-end·비차단이 생기지는 않는다. 이 Reference의 [hook 설정](../../.codex/hooks.json)과 [`host_adapter.py`](harness/maintain/host_adapter.py)는 [`session binding·lifecycle contract`](harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)를 Codex host에 연결한다. Hook이 없거나 trusted·actual acceptance되지 않은 환경에서는 main이 같은 Maintain 흐름을 수동으로 수행하며 automatic lifecycle을 주장하지 않는다.

## 변경 배치

- Recover 전용 규칙·구현·검증은 `harness/recover/`에서 함께 변경한다.
- Maintain 전체 계약·semantic 판단·guarded boundary·test와 Codex agent 정의는 `harness/maintain/`에서 함께 변경한다. Session admission·binding·host lifecycle의 상세 Owner는 같은 경계의 `SESSION-BINDING-AND-LIFECYCLE.md`다. `.codex/config.toml`은 role 발견, `.codex/maintain.json`은 explicit admission mode, `.codex/hooks.json`은 lifecycle command routing만 소유하며 Maintain 의미 규칙이나 Workspace 선택을 복제하지 않는다.
- Verify 전용 규칙·구현·검증은 `harness/verify/`에서 함께 변경한다.
- Harness 자체 회귀 검증은 `harness/validation/`에서 변경한다. 공통 test fixture는 `harness/testing.py`에만 둔다.
- Recover와 Verify에서 실제로 같은 의미로 사용하는 Workspace 식별·안전한 접근·status 인계 계약만 `harness/workspace_contract.py`에 둔다.
- 한 책임만 사용하는 코드를 공유 영역으로 올리지 않는다.
- Project 기준은 `../project/`, 제품 코드·테스트는 Project root의 `apps/`·`packages/`와 해당 Owner에 두고 Harness 아래로 옮기거나 복제하지 않는다.
- `../project/README.md`는 `common/current/guidance` 물리 layer, 실제 내용과 Owner 우선순위를 찾는 안정된 routing anchor다. 각 Workspace는 이 anchor와 현재 goal에 필요한 layer 문서를 선택하며, README나 link 목록만으로 내용 충분성을 대신하지 않는다.
- Project의 제품·domain 본문은 root 평면 파일이 아니라 주 책임에 맞는 `common/`, `current/`, `guidance/`에 두고, 선택 이유·재검토 신호는 `decisions/`에 둔다. Context 자체의 작성·복원·갱신 기준은 [`../project/MAINTENANCE.md`](../project/MAINTENANCE.md)를 해당 관리 작업에서 직접 읽는다. 상세 제품 Owner, 코드나 채택 결정이 바뀌면 영향받는 Project content와 이를 선택하는 live consumer를 다시 대조한다.
- Workspace `current/`, `source/`, `output/`, `records/`의 의미를 Harness가 독점 정의하지 않는다. 사람이 읽는 날짜별 records와 `records/receipts/<종류>/`의 기계 증거를 분리하고, Harness가 생성하더라도 receipt의 보존 Owner는 해당 Workspace로 유지한다.
- 작업별 Project context 선택은 `recover.json`, 검증 claim·canonical basis·고정 argv·evidence·실행 제한은 `verify.json`에서 변경한다. 사람의 다음 행동은 machine 계약이 아니라 사람용 current가 소유한다. Recover가 선택하는 Project context는 root `context/project/README.md`와 `common/`, `current/`, `guidance/`, `decisions/` 아래 regular Markdown으로 제한한다.
- Project 문서의 path·책임을 크게 바꿀 때에는 [`Workspace collection 계약`](workspaces/README.md)의 live consumer reconciliation을 적용한다. Active/default Recover consumer뿐 아니라 current generation에 explicit session-bound된 Workspace도 확인하고, 역사 Workspace 비동기화 원칙은 live consumer에서 내려온 뒤에만 적용한다.
- Project 문서·제품 evidence·검증 cwd는 Project root 기준, Workspace index·current·source·output·records는 이 Work root 기준으로 해석한다.
- 분석 메모·후보·비교·탈락안·선택 근거는 `records/` 바로 아래 날짜별 기록에 누적하고, 제품 검증 JSON은 `records/receipts/verify/`에 둔다. Goal을 위해 선택된 현재 산출물은 Workspace `output/index.md`에서 찾게 한다.
- 실제 산출물이 Project root의 코드·문서·테스트라면 Workspace `output/`에 복제하지 않고 `output/index.md`에서 canonical 상대 경로를 연결한다.

## 검증

전체 Harness 검증은 Project root에서 다음 명령으로 실행한다. Noline 제품 검증은 해당 app/package guide를 따른다.

```bash
python3 -B -m unittest discover -s context/work/harness -t . -p 'test_*.py' -v
```

Harness 책임 재배치 뒤의 `recover → verify → recover` 연결은 실제 active Workspace가 아니라 임시 fixture를 쓰는 다음 Harness validation으로 확인한다.

```bash
python3 -m unittest \
  context.work.harness.validation.tests.test_ephemeral_workspace_state_preservation \
  -v
```

이 검사는 임시 Workspace에서 packet, `records/receipts/verify/` receipt, `current/state/status.json`의 연결을 확인하고 종료 시 모두 폐기한다. 반복 개발 확인은 직접 test 명령을 사용하고 durable Verify는 상태 전환이나 인계에 필요한 제품 검증 경계에서만 실행한다.

정적 설정·링크 검사와 unit test는 Maintain의 등록, bounded bootstrap과 guarded side-effect 범위만 확인할 수 있다. 어떤 의미를 지속 Context에 남겨야 하는지, 같은 session 이해·response-end cadence·Main 비차단과 사용자 보고가 실제로 성립하는지는 semantic eval과 actual host acceptance로 따로 확인한다.

검증 통과는 `verification_passed`라는 기계 사실이며 사람의 수락이나 Workspace 완료를 뜻하지 않는다. Acceptance와 완료 전이는 Verify 책임에 암묵적으로 추가하지 않는다.
