# Maintain

Maintain은 한 작업 session을 이해한 agent가 모든 사용자 대상 Main response-end에서 지속할 의미가 생겼는지 점검하고, 명확한 변화만 선택한 Workspace의 기존 Context Owner에 반영하는 Harness 책임이다.

Context의 의미와 Owner는 [`Work context`](../../README.md), [`Workspace collection`](../../workspaces/README.md)과 선택한 Workspace README가 소유한다. Maintain agent, decision contract와 host adapter는 이 기준을 적용하는 교체 가능한 장치이며 새 canonical이 아니다.

Codex에서 main이 수동 fallback으로 부를 의미 판단 role은 [`workspace-context-maintainer.toml`](workspace-context-maintainer.toml)이다. Project root의 [`.codex/config.toml`](../../../../.codex/config.toml)은 이 하위 파일을 `workspace_context_maintainer` role로 발견하게 할 뿐 자동 session 시작, warm identity나 response-end dispatch를 보장하지 않는다. Claude Code는 [`.claude/settings.json`](../../../../.claude/settings.json)의 hook으로 같은 lifecycle 계약에 들어오며, 현재 semantic runner는 Codex implementation을 재사용한다. 자동 lifecycle은 별도의 persisted session bridge와 hook adapter가 맡는다.

모델·추론 수준은 같은 role 파일의 `model`과 `model_reasoning_effort`에서 설정한다. 자동 bridge도 시작과 재개마다 이 두 값을 읽어 CLI에 명시하므로, 전역 기본값이나 기존 thread의 모델 선택에 맡기지 않는다. 설정을 읽을 수 없거나 필수 값이 없으면 기본 모델로 대체하지 않고 실패한다. 자동 bridge의 TOML 읽기에는 Python 3.11 이상이 필요하다. 설정 변경은 다음 호출부터 적용되며 이미 실행 중인 판단을 재시작하지 않는다.

## 내부 책임과 진입점

Maintain 전체의 목적과 비소유 범위는 이 README가 canonical이다. 내부의 서로 다른 판단과 집행 경계는 다음 진입점에서 이어진다.

- **Session binding과 lifecycle**: 사람·Main의 explicit Workspace 선택을 session별 generation으로 commit하고 prompt·response-end·worker·notice를 정확한 Workspace와 semantic thread에 귀속한다. 상세 계약은 [`SESSION-BINDING-AND-LIFECYCLE.md`](SESSION-BINDING-AND-LIFECYCLE.md)가 소유한다.
- **Semantic 판단**: [`workspace-context-maintainer.toml`](workspace-context-maintainer.toml)과 [`codex_session.py`](codex_session.py)가 bounded grounding과 같은 thread의 response-end 판단을 연결한다. Agent는 durable 변화·기존 의미 Owner·ambiguity·보고 중요도를 판단하지만 Workspace 선택과 사람 acceptance를 대신하지 않는다.
- **Guarded apply**: [`operation.py`](operation.py)와 decision schema가 agent의 structured decision에 새 의미를 더하지 않고 exact Workspace·허용 Owner·preimage·경로·outcome별 side effect를 검사한다.

이 세 경계는 Maintain 안에서 함께 한 response-end 책임을 완성한다. Session binding을 Main session 전체의 일반 Workspace 선택 canonical이나 Recover·Maintain·Verify의 새 peer로 사용하지 않는다.

## 사용자에게 보여야 하는 동작

1. Project에서 새 작업 session을 시작하는 것만으로 Maintain에 가입하지 않는다. 명시적 activation 전에는 unbound이며 Workspace grounding·queue·write·경고를 만들지 않는다.
2. 사용자가 현재 작업에 Workspace를 명시적으로 연결하면 그 Main session만 선택한 Workspace의 bounded current를 한 번 읽고 시작 상태를 맞춘다.
3. 같은 binding generation의 후속 response에서는 이미 얻은 이해를 이어 쓰고 넓은 recovery를 반복하지 않는다.
4. 연결된 generation의 모든 사용자 대상 Main response-end에서 durable 변화 여부를 점검한다.
5. 변화가 없으면 지속 Workspace Context write와 Maintain report를 모두 만들지 않는다.
6. 명확한 변화는 기존 Owner에 반영한다. 사소하면 조용히 끝내고, 중요하면 실제 반영 뒤 보고한다. 목표·source 권위·acceptance처럼 사람 판단이 필요한 ambiguity는 관련 write 전에 묻는다.
7. 최초 grounding 뒤 장시간 의미 판단 때문에 Main response를 기다리게 하지 않는다. 접수, 판단, write와 report 완료를 구별하며 실패·지연·stale을 `fresh`, `current` 또는 `completed`로 가장하지 않는다.
8. 같은 Main session을 다른 Workspace로 전환하면 이미 접수된 turn은 predecessor에 마감하고, 성공한 새 grounding 뒤의 다음 prompt부터 successor를 사용한다. 실패하면 predecessor binding을 그대로 유지한다.

점검 cadence와 write·report cadence는 다르다. 매 response-end 점검한다는 이유로 Workspace에 heartbeat, no-change record 또는 machine status를 남기지 않는다. Host adapter가 순서·중복·실패를 구별하기 위해 쓰는 ignored runtime은 Context나 기록이 아니며 제거 가능해야 한다.

## 책임 배치

### Recover가 소유하는 최초 grounding 입력

새 Maintainer session은 explicit `workspace_id`로 기존 [`Recover`](../recover/) packet을 한 번 만든다. 이 호출은 active index를 읽지 않고 선택된 current, `output/index.md`와 Workspace가 선택한 Project context만 안전하게 읽는다. Workspace source·records 전체, Ticket 본문, output artifact 본문과 `verify.json`은 자동 grounding 입력이 아니다. Spec 전체와 Ticket 색인은 Recover를 통해 들어온다.

제품 Verify receipt의 snapshot이 `fresh`라는 사실은 선언된 제품 파일이 receipt와 같다는 뜻일 뿐, 사람용 current 의미가 실제 작업과 맞다는 뜻이 아니다.

### Workspace 생성·전환 비소유

Maintain은 explicit binding으로 선택된 한 Workspace 안의 의미 변화를 관리한다. 후속 Workspace를 만들거나 이전 Workspace의 의미를 옮기고, active index를 바꾸거나 Workspace 사이를 동기화하지 않는다. Project context에도 Project-wide 적용 후보를 자동 반영하지 않는다. 어떤 Workspace를 현재 Main session에 연결·전환할지는 사람과 main이 결정하며, host adapter는 그 명시적 선택의 grounding 성공과 event 귀속만 결정적으로 집행한다.

새 Workspace 생성과 전환은 [`생성·전환 canonical`](../../workspaces/CREATE-AND-TRANSITION.md)을 main과 별도 skill이 적용하는 책임이다. 같은 Main session을 이어 갈지 새 session으로 격리할지는 canonical이 요구하는 현재 binding·미처리 상태·successor 영향과 실제 host 능력을 main이 대조해 정한다. Maintain은 그 선택을 대신하지 않으며, 이전 generation의 warm 이해, 설정 파일 변경이나 아직 반영 여부가 확정되지 않은 background event를 successor의 current·새 grounding 또는 전달 완료처럼 간주하지 않는다.

### Agent가 소유하는 의미 판단

같은 Maintainer agent session은 최초 packet으로 이해를 갖춘 뒤 각 response-end의 사용자 발화와 Main response를 이전 이해에 붙인다. 이미 그 입력에 제한된 실제 근거나 기존 Verify 결과가 포함돼 있으면 출처와 입증 범위를 함께 보존할 수 있지만, 누락된 repository diff·Git 상태·raw test log를 기본 수집하거나 제품 test·eval을 새로 실행하지 않는다. 다음은 자연어 맥락을 종합해야 하므로 agent 판단에 남는다.

- 새 사실이 이후 재진입에 남길 durable 변화인지
- Spec의 목표·요구·판단 기준, Ticket의 작업 정의·진행·결과, 전체 Workspace state, records, source provenance 또는 output 색인 중 기존 의미 Owner가 어디인지
- 사용자 결정 전에는 쓸 수 없는 ambiguity인지
- 반영 뒤 사용자에게 알려야 할 정도로 중요한지

Agent는 제품 test를 대신 실행하거나 사람의 목표·acceptance·완료를 결정하지 않는다. 사용자 결정은 결정으로, Main의 완료·test 주장은 `Main이 보고한 상태`로 출처 강도를 보존한다. 실제 확인을 입력으로 받을 때만 무엇을 확인했고 무엇은 확인하지 못했는지도 함께 유지한다.

#### 현재 의미와 과정 근거의 구분

하나의 response-end에 여러 지속 의미가 함께 생길 수 있으므로, 변화 전체를 먼저 한 파일 종류로 정하지 않고 각 의미의 역할과 수명을 나눈다.

- 다음 판단과 행동에 직접 필요한 현재 유효 기준·계약·실행 범위·진행·결과·전체 상황은 Spec·Ticket·state의 해당 Owner에 간결하게 반영한다.
- current가 바뀐 뒤에도 선택·교정·검증을 다시 살필 때 필요한 조사 과정, 선택·탈락 이유, 철회된 전제, 실패와 상세 근거는 records에 남긴다.
- 변경하지 않은 원문과 provenance는 source, 선택한 산출물과 실제 canonical 위치는 output의 기존 책임을 따른다.

같은 사건이 current와 새 record를 함께 요구할 수 있다. 이때 current에는 지금 유효한 의미를 직접 적고, record에는 그 의미가 나온 과정과 근거를 적어 같은 서술을 복제하지 않는다. 중요하다는 이유만으로 매 response-end에 record를 만들지 않으며, 설명·재진술이나 current가 바뀐 뒤 재검토할 필요가 없는 경위에는 새 record를 만들지 않는다.

사용자가 방향이나 진행 방식을 채택하면 current에는 채택된 기준과 그 적용 범위를 정규화해 적는다. 채택 날짜·turn·발화 원문·대화 순서 자체가 이후 판단 근거로 필요하면 records에 보존하며, `기록해 달라`는 요청만으로 그 원문을 current에 옮기지 않는다.

current는 현재 유효한 뜻을 정규화해 보여 주는 층이다. 과거 전제를 `주의`, `기준 아님`, `유지하지 않는다` 같은 부정문과 긴 turn 경위로 계속 남기지 않는다. 정정이 목표·기준·문제 정의·근거 선택·접근·책임 경계를 바꾸면 무효화된 전제를 찾고, 그 전제를 직접 사용한 관련 Spec·Ticket·state·추가 memory를 제한적으로 확인한다. 영향받은 current는 유효한 현재 의미로 교정하거나 불필요한 서술을 삭제하고, 과거 전제와 교정 이유가 이후에도 필요할 때만 records로 격리한다. 정정과 무관한 목표·계약·검증된 결과는 유지한다.

사람용 Workspace 문서를 만들거나 갱신할 때는 [문서 작성과 갱신](../../workspaces/DOCUMENT-WRITING.md)을 적용한다. 문서 목적에 맞는 내용의 충분성·구성·표현 판단은 agent가 맡고, guarded apply는 이를 기계적으로 판정하지 않는다. Spec·Ticket·state의 상세 의미는 [Spec과 Ticket](../../workspaces/SPEC-AND-TICKETS.md)이 계속 소유한다. Codex bridge는 정본 파일에서 읽은 작성 지침 본문을 grounding과 후속 판단 입력에 포함한다. 입력에 본문이 있으면 이를 사용하며 같은 파일을 다시 읽지 않고, 본문이 제공되지 않는 수동 경로에서만 직접 읽는다.

입력만으로 요청한 기록의 중요한 의미를 복원하기 어려우면 아래의 허용된 근거 읽기 범위에서 보완한다. 보완할 수 없는 자료와 그 때문에 남기지 못한 의미는 `unresolved`에 구체적으로 반환하며, 확인한 부분의 반영과 기록 요청 전체의 충족을 구별한다. 이를 다른 session의 원문 자동 수집이나 기본 탐색 범위 확대로 해석하지 않는다.

state를 갱신할 때는 그 파일 전체에서 이미 끝났거나 뒤 단계가 대체한 진행 경위·접수 이력·일회성 보고를 함께 확인한다. 현재 단계, 다음 행동, 계속 유효한 제약, 실제 결과와 미확인만 남기고, 이후에도 필요한 과거 경위는 records 링크로 압축한다. 이 정리는 갱신 중인 state 안에 한정하며 다른 current를 포괄 정리하는 계기로 삼지 않는다.

진행 단계나 사용자 선택이 바뀌면 그 상태를 직접 소유하는 Ticket·state와, 같은 상태를 실제로 서술한 current 문서만 함께 확인한다. 색인은 제목·역할·본문 경로를 안내하며 추천·확정 여부·진행 단계의 두 번째 정본이 되지 않는다. 색인에 이미 변동 상태가 있으면 이번 변화와 충돌하지 않게 제거하거나 안정된 역할 설명으로 바꾼다.

임시 전달 파일, session 산출물이나 제거될 수 있는 경로를 current의 지속 근거로 삼지 않는다. 현재 의미는 Owner 본문에 직접 적고, 해당 원문의 최소 발췌·출처·판단 과정이 current 변경 뒤에도 필요하면 Workspace가 소유하는 새 record에 보존한다. 허용된 Owner로 충분히 보존할 수 없는 원문이 필요하면 가능한 current 변경의 범위를 과장하지 말고 그 필요를 `unresolved`에 남긴다.

Spec·Ticket도 기존 기록·갱신 책임에 포함한다. 대화에서 정해진 내용을 처음 문서로 만들거나 결과를 반영할 수 있으며 Main만 작성하도록 제한하지 않는다. Main이 필요한 설계·작업 분해·위임·결과 확인과 다음 행동을 조율한다. Maintain은 실행자 선택·dispatch·작업 재계획을 맡지 않는다. 상세 내용 기준은 [Spec과 Ticket](../../workspaces/SPEC-AND-TICKETS.md)을 따른다. Codex bridge는 이 canonical을 Maintain README와 함께 규칙 입력으로 제공하므로 grounding 중 추가 탐색 없이 읽을 수 있다. 개별 Workspace의 읽기 범위는 기존 bounded Recover packet으로 유지한다.

기존 Owner와 이번 delta에 명시된 로컬 파일은 필요한 범위에서 읽어 Ticket 본문·실제 preimage·관련 근거를 확인할 수 있다. 정정이나 단계 변화에서는 무효화된 전제나 달라진 상태를 직접 서술한 선택된 Workspace의 current 문서도 제한적으로 찾아 읽을 수 있다. Main이 받은 subagent 결과나 다른 세션의 대화가 자동으로 입력되지는 않는다. 입력에 연결된 결과와 출처만 보존하고, 다른 실행자가 직접 수정했을 수 있는 문서는 현재 내용과 SHA-256을 확인한다. 비동기 반영을 접수했다는 사실만으로 실행에 사용할 Spec·Ticket이 준비됐다고 하지 않는다.

### 규칙 장치가 소유하는 side-effect 경계

Agent 결과는 `no_change`, `update`, `needs_user_decision` 중 하나인 structured decision으로 넘긴다. Maintain의 guarded apply는 의미가 맞는지 재판단하지 않고 다음을 결정적으로 검사한다.

따라서 read-only인 것은 의미 판단 agent의 도구 권한이지 Maintain 전체의 기능이 아니다. `update`가 명확하고 아래 검사를 통과하면 Maintainer 흐름이 별도 사용자 승인 없이 해당 Context Owner를 실제로 수정한다.

- decision과 실제 binding의 exact Workspace id
- exact schema와 outcome별 허용 side effect
- 기존 파일의 expected SHA-256 preimage
- Project root·Workspace root 경계, 허용된 폴더와 깊이, regular file와 symlink
- Markdown EOF newline, 줄 끝 공백과 로컬 링크
- 아래 allowlist 밖의 모든 write 거부

허용되는 Workspace 상대 경로는 다음뿐이다.

- `current/memory/`, `current/memory/spec/`, `current/memory/tickets/` 각각 바로 아래의 Markdown
- `current/state/index.md`
- `source/index.md`
- `output/index.md`
- 새로 만드는 `records/YYYY-MM-DD-NN-*.md`
- 기존 `records/README.md`

기존 record를 다시 쓰지 않는다. Raw source snapshot, 제품 코드·문서·test, `workspace.json`, `recover.json`, `verify.json`, `current/state/status.json`, `records/receipts/`, `workspaces/index.json`은 수정하지 않는다.

새 memory 주제·Spec 파일은 같은 decision에서 `current/memory/index.md`를 갱신해 연결한다. 새 Ticket 본문은 `current/memory/tickets/index.md`를 갱신해 연결한다. Ticket 색인 자체를 새로 만들 때는 memory 색인에서 연결한다. Guard는 해당 색인 갱신과 새 문서 링크가 없는 proposal을 거부한다. 기존 본문 갱신마다 색인·state를 기계적으로 다시 쓰지는 않는다. 필요한 폴더는 Workspace 생성 시 준비하며 guarded apply는 폴더 생성·삭제나 Ticket의 자동 보관·이동을 수행하지 않는다.

새 날짜별 record를 만들 때도 같은 decision에서 기존 `records/README.md`를 preimage와 함께 갱신하고 새 record 링크를 넣는다. Guard는 이 pair가 없는 proposal과 새 `records/README.md` 생성을 거부한다. 여러 파일의 실제 write는 하나의 atomic transaction이 아니므로 중간 실패·crash 때 pair가 항상 함께 남는다는 보장은 하지 않는다.

`no_change`와 `needs_user_decision`에는 write 권한이 없다. `update`도 모든 precondition과 실제 write가 성공한 뒤에만 `updated`가 된다. Stale target이나 일부 write 실패는 성공으로 바꾸지 않으며 실제로 바뀐 범위를 드러낸다.

## Decision contract

Decision은 다음 의미를 갖는다.

- `schema_version`: 현재 contract version
- `workspace_id`: 최초 binding과 같은 explicit id
- `outcome`: `no_change`, `update`, `needs_user_decision`
- `importance`: `none`, `quiet`, `important`
- `summary`: 판단 또는 실제 반영을 사람이 이해할 수 있는 짧은 설명
- `changes`: Workspace 상대 path, expected SHA-256, 전체 새 Markdown content와 이유
- `evidence`: 판단에 사용한 사용자 발화, Main의 보고, 이미 제공된 실제 확인과 각각의 출처·입증 범위
- `unresolved`: 아직 확인하지 못했거나 다음 판단에 남길 사항
- `question`: `needs_user_decision`에서 사용자에게 물을 한 가지 구체적 질문

결과별 조합은 고정한다.

- `no_change`: `importance=none`, changes 없음, question 없음
- `update`: `importance=quiet|important`, 하나 이상의 changes, question 없음
- `needs_user_decision`: `importance=important`, changes 없음, 비어 있지 않은 question

이 schema는 agent 판단을 코드로 대체하지 않는다. Outcome마다 어떤 부작용 권한이 있는지와 false success를 제한한다.

## Session binding과 lifecycle

새 Main session의 unbound 기본값, explicit activation·rebind·deactivation, binding generation, prompt·response-end·late worker 귀속, hook·worker·notice lifecycle, 민감 runtime의 실제 저장 범위와 retention, config migration과 actual-host 증명 상한은 [`SESSION-BINDING-AND-LIFECYCLE.md`](SESSION-BINDING-AND-LIFECYCLE.md)가 소유한다.

자동 lifecycle adapter가 없는 host나 현재 자동 연결을 사용하지 않는 session에서도, 문서 반영이 허용된 작업이면 Main은 explicit Workspace의 bounded bootstrap과 이 README의 semantic 판단·guarded apply 책임을 수동으로 수행할 수 있다. 수동 처리는 자동 session binding을 만들지 않으며 unbound hook은 계속 정상 no-op이다. 자동 연결은 사용자의 명시적 Workspace 선택에 따라 별도로 수행한다. 스킬에 기록을 맡겼다는 설명만으로 문서 반영이나 activation을 완료했다고 하지 않는다.

수동 fallback은 모든 response-end 자동 점검, 같은 semantic identity 재사용이나 Main 비차단을 증명하지 않는다. 자동으로 연결된 session에서는 같은 문서를 별도 수동 경로로 중복 수정하지 않고 기존 Maintain 흐름의 결과와 필요한 실제 반영을 확인한다.

## 소유하지 않는 것

Maintain은 다음을 수행하거나 결정하지 않는다.

- Project 제품 코드·제품 문서·제품 test 수정
- 제품 검증 실행, Verify receipt 또는 machine status 생성·수정·삭제
- active Workspace 선택·변경
- 다른 Workspace 생성·수정, Workspace 사이의 계승·동기화
- Project context 후보의 자동 승격·반영
- 사용자 대신 목표·source 권위·설계 기준·acceptance·완료 결정
- 파일 stage, commit, push 또는 외부 쓰기
- no-change heartbeat나 지속 warm cache 생성

허용 범위 밖의 변화가 필요해 보이면 필요와 근거를 `unresolved`로 돌려보낸다.

## 교체와 제거

Maintain의 의미 기준은 agent prompt, decision schema나 hook state에 있지 않다. Adapter를 제거하거나 사람·다른 AI·다른 host로 교체해도 이 README에서 Work·Workspace canonical을 적용하면 같은 책임을 수동으로 수행할 수 있다. Runtime state를 지워도 Workspace Context가 사라지거나 의미가 바뀌지 않아야 한다.
