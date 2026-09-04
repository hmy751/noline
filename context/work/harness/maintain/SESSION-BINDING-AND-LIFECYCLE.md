# Maintain session binding과 lifecycle

이 문서는 Maintain 내부에서 하나의 Main session을 explicit Workspace와 semantic thread에 연결하고, Codex 또는 Claude Code host event를 그 연결의 정확한 generation에 귀속하며, 비동기 처리와 사용자 전달 상태를 보존하는 상세 계약의 canonical이다. 새로운 Harness 책임이나 Recover·Maintain·Verify의 peer를 만들지 않는다. Maintain 전체의 정체성, 의미 판단과 Context 반영 경계는 [`Maintain`](README.md)이 계속 소유하고, 새 Workspace를 왜·언제 만들고 successor로 전환할지는 [`새 Workspace 생성·전환 canonical`](../../workspaces/CREATE-AND-TRANSITION.md)이 소유한다.

이 경계의 교체 가능한 구현은 [`host_adapter.py`](host_adapter.py), [`codex_session.py`](codex_session.py), Claude payload를 turn id와 연결하는 [`claude_hook.py`](claude_hook.py)다. 구현 파일과 ignored runtime은 이 계약을 집행하는 장치이지 Workspace 의미의 Owner가 아니다.

## 책임과 결정권

사람은 어떤 작업을 어느 Workspace로 이어 갈지 결정한다. Main은 사용자 지시와 생성·전환 canonical을 적용해 현재 Main session을 연결·전환·해제할지를 정하고 control command를 실행한다. Active index, Project 기본값, 저장소 경로와 대화 내용만으로 Workspace를 자동 선택하지 않는다.

Host adapter는 이미 명시된 선택에 대해 다음 기계적 보장을 소유한다.

- 새 session을 기본 unbound로 두고, session id별 상태를 다른 session과 격리한다.
- activation의 bounded grounding이 성공한 뒤에만 새 binding generation을 commit한다.
- 각 prompt와 response-end를 접수 시점의 generation·Workspace·semantic thread에 고정한다.
- rebind 뒤 predecessor의 late event·worker·failure를 successor로 retarget하지 않는다.
- pending·failed·notice·delivery 상태를 성공이나 Context freshness로 가장하지 않는다.

Codex와 Claude Code host는 각자 hook을 실제로 신뢰·호출하는지, event payload와 시점이 무엇인지, session 종료 뒤 process를 얼마나 유지하는지를 소유한다. Semantic agent의 durable 의미 판단과 guarded Context apply는 [`Maintain`](README.md#책임-배치)이 소유하며 이 문서에서 두 번째 계약으로 복제하지 않는다.

## Control과 Main-only 정책

Reference wrapper는 다음 control surface를 제공한다.

```bash
python3 .codex/hooks/maintain.py status
python3 .codex/hooks/maintain.py activate <workspace_id>
python3 .codex/hooks/maintain.py deactivate
```

Claude Code session에서는 `SessionStart`가 `NOLINE_MAINTAIN_CLAUDE_SESSION_ID`를 해당 session의 후속 Bash 환경에 기록한 뒤 아래 wrapper를 쓴다.

```bash
python3 .claude/hooks/maintain.py status
python3 .claude/hooks/maintain.py activate <workspace_id>
python3 .claude/hooks/maintain.py deactivate
```

Codex wrapper의 기본 selector는 현재 process의 `CODEX_SESSION_ID`다. Claude wrapper의 기본 selector는 Claude `SessionStart`가 기록한 `NOLINE_MAINTAIN_CLAUDE_SESSION_ID`다. 다른 기존 session을 관리할 때만 explicit `--session-id`를 사용한다. 비어 있는 explicit session id를 ambient 값으로 대체하지 않는다. `status`는 binding과 runtime truth를 읽기만 하며 unbound session의 runtime directory나 lock file을 만들지 않는다.

Control command를 Main만 실행한다는 제한은 현재 host adapter가 인증하는 권한 보장이 아니라 운영 정책이다. Subagent도 outer `CODEX_SESSION_ID`를 상속할 수 있고 CLI는 호출자가 Main인지 판별하지 못한다. 따라서 Workspace 선택 책임을 가진 Main이 직접 실행하며 subagent에게 activation·deactivation을 위임하지 않는다. Claude Code hook payload에 non-empty `agent_id`가 있으면 Claude adapter는 Main binding, selector export, turn pairing을 건드리지 않고 조용히 종료한다. 이 정책을 더 강한 보장으로 표현하려면 host가 검증 가능한 caller identity나 별도 capability를 제공하고 실제 acceptance를 통과해야 한다.

## Binding generation과 전환

Session state는 nullable `current_generation`과 append-only binding history를 가진다. 각 binding은 generation, Workspace id, persisted semantic thread id와 grounding 시각을 함께 고정한다.

- 새 session에는 binding이 없다. `SessionStart`, prompt와 `Stop`은 조용히 no-op하고 runtime도 만들지 않는다.
- Unbound 상태에서 Workspace A activation이 성공하면 generation 1을 current로 commit한다. 실패하거나 grounding이 사람 결정을 요구하면 unbound를 유지한다.
- A에서 B activation이 성공하면 B를 새 generation으로 append하고 그 generation을 current로 바꾼다. B grounding이 실패하면 A를 그대로 current로 유지한다.
- 이미 current인 같은 Workspace activation은 기존 generation을 재사용하며 새 semantic thread나 generation을 만들지 않는다.
- A→B→A는 각 성공마다 서로 다른 generation을 만든다. Workspace id가 같아도 과거 A generation과 새 A generation은 같은 event 경계가 아니다.
- `deactivate`는 `current_generation`만 null로 바꾸어 future prompt를 unbound로 만든다. 이전 binding, prompt, event, worker 결과와 failure history는 삭제하거나 취소하지 않는다.

Activation 전에 이미 `UserPromptSubmit`이 접수된 turn은 그때의 snapshot으로 마감한다. A prompt 도중 B를 activation해도 해당 turn의 `Stop`은 A에 남고 다음 prompt부터 B를 쓴다. Unbound prompt 도중 처음 activation한 경우에는 그 prompt snapshot이 없으므로 해당 `Stop`을 새 binding에 사후 귀속하지 않고 다음 prompt부터 새 generation을 사용한다.

## Prompt, response-end와 late worker 귀속

Bound session의 `UserPromptSubmit`은 stable `turn_id`, **사용자 prompt 전체 문자열**, sequence와 현재 binding snapshot을 `turns/`에 저장한다. `Stop`은 같은 turn snapshot과 짝을 맞춘 뒤 **`last_assistant_message`의 Main response 전체 문자열**을 `events/`에 저장하고 빠르게 반환한다. 서로 다른 내용으로 같은 turn id가 중복되거나 prompt·response snapshot이 바뀌면 실패로 드러낸다.

Detached worker는 event에 저장된 Workspace와 semantic thread만 resume한다. Worker 시작 이후 current binding이 달라져도 late event는 원래 generation에 남는다. 같은 session의 worker는 drain lock과 event sequence로 직렬 처리하고, 이미 effect가 확정된 ordinary duplicate는 다시 적용하지 않는다.

Semantic resume나 guarded apply 실패는 해당 generation의 이후 event만 fail-closed로 막는다. 다른 generation의 관련 없는 pending·failure는 current generation을 막지 않는다. Prompt가 다음 prompt나 `SessionEnd` 전까지 matching `Stop`을 받지 못한 경우와 prompt-response pairing 자체가 실패한 경우는 completion을 주장하지 않는 nonblocking failure로 남긴다. Semantic 또는 apply 이후 effect 기록 전에 hard crash가 나면 strict effect-once는 보장하지 않는다.

## Hook, worker와 notice lifecycle

[`.codex/hooks.json`](../../../../.codex/hooks.json)과 [`.claude/settings.json`](../../../../.claude/settings.json)은 각 Project wrapper [`.codex/hooks/maintain.py`](../../../../.codex/hooks/maintain.py), [`.claude/hooks/maintain.py`](../../../../.claude/hooks/maintain.py)를 다음 경계에 연결한다. Claude Code는 prompt와 Stop 사이의 turn id를 제공하지 않으므로 후자는 ignored Claude runtime 안에서 이 짝만 좁게 유지한다. Claude handler의 timeout은 host state scan과 atomic pairing write에 쓸 수 있도록 30초다. 이 설정은 host가 실제 hook을 끝까지 실행·전달한다는 증명이나 중단 없는 pairing 보장이 아니다.

- `SessionStart`: persisted current binding이 있으면 재사용 사실만 Main context에 알리고, unbound면 조용히 끝난다. 새 grounding은 하지 않는다.
- `UserPromptSubmit`: current binding snapshot을 저장하고 session 전체에서 아직 전달하지 않은 important update·ambiguity·failure·pending 상태를 가져온다. 처리 가능한 pending event가 있으면 worker를 다시 시작한다. Predecessor generation의 늦은 결과를 함께 표면화하더라도 write·effect 귀속과 blocking은 원래 event snapshot에 남으며 current generation으로 retarget하거나 그 generation을 막지 않는다.
- `Stop`: paired response-end event를 먼저 지속한 뒤 detached worker를 시작하고, 의미 판단과 write 완료를 기다리지 않는다.
- `SessionEnd`: orphan prompt와 unresolved·failed 상태를 확정해 `session-end.json`에 남기고 처리 가능한 event에 대해 best-effort worker를 시작한다. SessionEnd 자체가 완료를 보장하지 않는다.

Notice는 `important`, `ambiguity`, `failure`만 만든다. 새 chat message를 능동적으로 생성하지 않으며, 다음 `UserPromptSubmit`에서 Main context와 사용자 UI로 전달된 뒤 `surfaced-notices/`로 이동한다. Quiet update와 no-change는 notice를 만들지 않는다. Host가 다음 prompt를 받지 않으면 background 결과가 사용자에게 도달한다고 보장하지 않는다.

## Runtime 데이터와 retention

Runtime 기본 위치는 Git에서 제외한 Codex의 `.codex/maintain-runtime/`과 Claude의 `.claude/maintain-runtime/`이다. 두 host의 runtime은 서로 섞지 않는다. Session id는 SHA-256 key로 directory 이름에 숨기지만 이는 암호화나 익명화를 의미하지 않는다. 각 session directory에는 구현 version에 따라 다음 상태가 남는다.

- `session.json`: current generation과 과거 binding history, Workspace id, semantic thread id, grounding 시각
- `turns/*.json`: turn id, **사용자 prompt 전체**, 접수 시각과 binding snapshot
- `events/*.json`: turn id, **사용자 prompt 전체와 Main response 전체**, 접수 시각과 binding snapshot
- `effects/*.json`: 처리 성공·실패, failure ordering, Context status와 binding snapshot
- `notices/`, `surfaced-notices/`: 사용자에게 아직 전달하지 않은 notice와 이미 전달한 notice
- `next-sequence.json`, `session-end.json`, process lock: 순서·종료·동시성 상태
- Claude runtime의 `claude-hook-turn-state.json`: Claude host가 제공하지 않는 prompt/Stop pairing id. 사용자 prompt·응답 원문은 Host adapter의 turn/event 파일만 소유한다.

따라서 runtime은 단순 binding metadata가 아니라 사용자와 Main의 대화 원문을 포함하는 민감한 로컬 운영 데이터다. Repository에 commit하거나 Workspace `current/`·`records/`·`source/`로 복제하지 않고, 일반 분석 자료처럼 재사용하지 않는다.

Host adapter는 runtime 형식, atomic write, 경로 제한, pending·failure·delivery truth의 일관성을 소유한다. Project 운영자와 사람은 보존 기간, 접근 범위와 실제 삭제 승인을 소유한다. 현재 Reference 구현에는 TTL, 자동 redaction, garbage collection이나 안전한 cleanup command가 없으므로 runtime은 명시적으로 정리하기 전까지 남는다.

`deactivate`는 cleanup이 아니며 runtime directory 삭제를 rebind 방법으로 사용하지 않는다. 삭제하면 과거 binding·late worker 귀속·pending·failure·notice delivery truth를 함께 잃는다. 정리가 필요하면 먼저 `status`와 실제 Context를 대조해 처리 중 event, 검토할 failure, 전달하지 않은 결과와 필요한 이력이 없음을 확인하고 별도 운영 변경으로 승인·실행해야 한다. 이 확인 절차와 retention 기간을 코드가 자동 보장한다고 주장하지 않는다.

## Config, wrapper와 runtime 호환성

[`.codex/maintain.json`](../../../../.codex/maintain.json)의 schema v2 `mode: "explicit"`는 두 host adapter가 공통으로 읽는 새 session admission 설정이다. Schema v1의 Project-wide `workspace_id`는 중단 없는 migration을 위해 validation할 수만 있고 새 session의 기본값으로 사용하지 않는다. Config 변경만으로 이미 존재하는 session을 retarget하거나 grounding 완료를 주장하지 않는다.

Project wrapper는 호출 cwd와 무관하게 자기 Project root를 adapter에 명시해 같은 설치의 config·runtime·Work root를 사용하게 한다. Hook payload의 cwd를 binding 선택 근거로 사용하지 않는다. Runtime root는 Project 내부의 absolute lexical descendant여야 하고 기존 symlink component를 거부한다. Reference lock은 POSIX `fcntl`을 사용하므로 non-POSIX portability를 주장하지 않는다.

`codex` 실행 경로가 symlink이고 실제 binary 옆에 `codex-code-mode-host`가 있으면 semantic bridge는 실제 binary 경로를 사용한다. Host가 sibling tool을 실행 파일의 겉보기 경로에서 찾는 설치에서는 이 해소가 read-only Owner inspection을 가능하게 하며, sibling host가 없으면 임의 경로를 추정하지 않고 원래 실행 실패를 그대로 드러낸다.

기존 schema v1 `session.json`과 event는 원래 Workspace와 semantic thread의 generation 1로 읽어 continuation과 late event 귀속을 보존한다. Failure ordering 정보가 없는 legacy failed effect는 안전하게 단계를 구분할 수 없으므로 해당 legacy generation의 뒤 event를 fail-closed로 막는다. Migration은 runtime을 일괄 삭제·이동하거나 모든 살아 있는 session을 한 Workspace로 바꾸지 않는다.

## Actual-host 증명 상한과 열린 위험

Unit test는 unbound no-op, session 격리, activation rollback, A→B→A generation, event snapshot, late worker와 generation-local failure 같은 adapter 상태 전이를 검증할 수 있다. 그러나 다음은 실제 Codex host에서 별도로 확인하기 전까지 보장하지 않는다.

- 각 host의 project hook trust와 실제 `SessionStart`·`UserPromptSubmit`·`Stop`·`SessionEnd` 호출, payload와 순서
- 사용자 대상 Main response와 `Stop`의 실제 대응, 중복·누락·순서 역전·session 종료 중 worker 생존
- 여러 실제 session에서의 binding 격리와 notice가 다음 Main request 및 사용자 UI에 도달하는 표면
- 최초 `codex exec` grounding에 명시한 read-only sandbox가 `codex exec resume`에서도 동일하게 보존되는지
- Grounding 중 Codex thread가 생성된 뒤 schema 검증·grounding decision이나 후속 단계가 실패했을 때 그 실패한 thread가 host에서 정리되는지

현재 구현은 최초 grounding command에 read-only sandbox를 명시하고 semantic prompt에도 read-only 역할을 요구하지만, resume command가 동일 권한을 유지한다는 actual-host 증거는 아직 없다. 또한 failed grounding은 이전 binding 또는 unbound 상태를 보존하고 새 generation을 commit하지 않지만, 그 과정에서 이미 만들어진 Codex thread를 회수·삭제하는 lifecycle은 구현하거나 입증하지 않았다. 두 항목은 성공한 binding이나 Context write로 가장하지 않고 열린 host acceptance 항목으로 남긴다.

## 교체와 제거

이 하위 경계는 Maintain의 host 연결과 운영 truth를 위한 제거 가능한 장치다. Adapter, hook과 runtime을 제거해도 Workspace의 goal·current·source·output·records와 Maintain의 의미 기준은 남아야 한다. 다른 host adapter로 교체할 때도 explicit selection, 성공 뒤 generation commit, event snapshot, generation-local failure, false success 금지와 민감 runtime의 retention Owner를 다시 충족해야 한다.
