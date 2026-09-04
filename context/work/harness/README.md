# Workspace Harness

이 디렉터리는 Workspace Context를 다시 읽고, 작업 중 의미 변화를 기존 Owner에 반영하고, 상태 전환에 필요한 제품 증거를 남기는 교체 가능한 관리 장치다. Context 자체의 의미와 책임 Owner는 [`Work context`](../README.md)와 [`Workspace collection`](../workspaces/README.md)에 남는다.

```bash
python3 -m context.work.harness recover [workspace_id] [--json]
python3 -m context.work.harness maintain bootstrap <workspace_id> [--json]
python3 -m context.work.harness maintain apply <workspace_id> <decision.json>
python3 .codex/hooks/maintain.py status
python3 .codex/hooks/maintain.py activate <workspace_id>
python3 .codex/hooks/maintain.py deactivate
python3 -m context.work.harness verify [workspace_id]
```

## 책임 계층

작업 Context의 세 책임은 각각 자기 목적·규칙·실행 방식의 진입점을 가진다.

- **Recover**: 새 세션·새 작업 주체의 Workspace 재진입에서 읽기 전용 packet을 만든다. 결정적 `recover` CLI와 [`recover/`](recover/)가 소유한다.
- **Maintain**: 사용자가 현재 Main session에 명시적으로 선택한 Workspace의 사용자 대상 response-end에서 durable 변화를 판단하고, guarded apply가 허용된 기존 Context Owner에만 반영한다. [`maintain/`](maintain/)이 전체 실행 계약을 소유하며, 내부의 session admission·binding·host lifecycle 상세는 [`SESSION-BINDING-AND-LIFECYCLE.md`](maintain/SESSION-BINDING-AND-LIFECYCLE.md), semantic 판단은 [Codex agent 정의](maintain/workspace-context-maintainer.toml), side-effect 경계는 guarded apply로 이어진다. 새 session은 기본 unbound이며 Project 설정은 agent 발견·explicit admission·command routing만 제공한다.
- **Verify**: Workspace 상태 전환·인계에 필요한 지속적 제품 증거를 남긴다. 결정적 `verify` CLI와 [`verify/`](verify/)가 소유한다.

**Harness validation**은 작업 흐름의 네 번째 단계가 아니라 위 관리 장치 자체의 회귀 검증 경계다. [`validation/`](validation/)이 임시 fixture에서 Recover·Verify 연결과 checked-in 제품 상태 격리를 검사한다. 사람의 목표·acceptance·완료 판단은 Harness 바깥에 남는다.

Maintain의 agent는 Context 의미 정합성을 판단하고 guarded apply는 부작용 경계를 보장한다. Verify는 제품 확인의 기계 증거, Harness validation은 관리 장치의 회귀를 담당한다. 하나의 인계 경계에서 Maintain과 Verify가 모두 필요할 수 있지만 한쪽의 통과가 다른 쪽이나 사람 acceptance를 대신하지 않는다.

구현 파일의 배치는 다음과 같다.

- [`workspace_contract.py`](workspace_contract.py): active/id 선택, identity-only `workspace.json`, Work root 내부의 안전한 파일 접근, `status.json`과 receipt 연결 필드의 최소 공통 계약
- [`recover/`](recover/): `recover.json`, current context 선택·로딩, 연결 receipt header와 선언된 snapshot freshness 확인, receipt 본문을 노출하지 않는 recovery packet과 사람용 출력
- [`maintain/`](maintain/): 전체 Maintain 계약과 내부 책임 관계, [`session binding·lifecycle canonical`](maintain/SESSION-BINDING-AND-LIFECYCLE.md), bounded bootstrap, persisted semantic thread, guarded decision apply, host adapter, 책임별 test와 교체 가능한 Codex agent 정의
- [`verify/`](verify/): `verify.json`, evidence 선확보, 제한 실행, Workspace `records/receipts/verify/`의 append-only receipt, atomic status 갱신
- [`validation/`](validation/): 임시 Workspace 순환과 checked-in 제품 machine state 보존 검사
- [`testing.py`](testing.py): Recover·Verify·validation 테스트가 함께 사용하는 최소 fixture 기반
- [`cli.py`](cli.py): Recover·Maintain의 결정적 경계·Verify로 argument를 routing하고 결과를 출력
- [`__main__.py`](__main__.py): module 실행 진입점

Module Maintain CLI는 bounded bootstrap과 guarded apply만 routing하며 의미 판단을 Python command나 schema로 가장하지 않는다. Project wrapper의 `status|activate|deactivate`와 host event 귀속은 [`session binding·lifecycle canonical`](maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 적용한다. 어떤 Workspace를 연결할지는 사람과 main이 결정하며, schema는 event 귀속과 outcome별 side-effect 권한, stale·path 거부만 고정한다. Recover는 `verify.json`을 읽지 않고 Verify는 `recover.json`을 읽지 않으므로 한쪽 전용 계약 오류가 다른 명령의 실행을 막지 않는다.

Harness는 자신의 설치 위치를 Project 의미의 기준으로 사용하지 않는다. Project context·제품 evidence·검증 cwd는 Project root를, Workspace index·current·source·output·records는 [`Work root`](../README.md)를 기준으로 해석한다. Recover는 Workspace source를 기본 입력으로 읽지 않고 Workspace `output/index.md`만 산출물 지도로 읽으며, 연결된 산출물 본문은 자동으로 읽지 않는다. 이 장치를 제거해도 Workspace의 의미와 원자료·산출물 지도·기록은 [`../workspaces/`](../workspaces/)에서 읽을 수 있다.

책임별 테스트까지 모두 실행하려면 Project root에서 다음 명령을 사용한다.

```bash
python3 -m unittest discover -s context/work/harness -t . -p 'test_*.py' -v
```

Harness의 끝까지 연결만 집중해 확인할 때는 임시 fixture에서 `recover → verify → recover`를 실행하는 다음 검사를 쓴다.

```bash
python3 -m unittest \
  context.work.harness.validation.tests.test_ephemeral_workspace_state_preservation \
  -v
```

이 검사가 만든 receipt와 status는 임시 디렉터리와 함께 폐기된다. 실제 active Workspace에서 durable verify를 실행하는 것은 Harness 회귀 검사가 아니라, 그 Workspace의 상태 전환이나 인계 증거가 필요할 때만 한다.
