# 최신 Reference 보완 적용

2026-09-09 사용자가 승인한 범위에서 기존 Context Harness를 보완한다. Source `87d21023f6acd8ae709322d48da9851594f9acb0`의 Reference는 clean이며 target은 `feat/noline-context-harness`, `b4ed41f6e4bbae26fd45827b3b9063097a2c1ea4`에서 시작한다. 이전 설치는 `f0bada9`를 사용했다. 사라진 이전 준비물을 재사용하지 않고 새 preflight를 확보했다.

## 적용과 보존

Project common/current/guidance와 Decision 계약을 구성하고, 기존 active 이식 Work를 Spec 다섯 파일·Ticket으로 이어간다. 최신 Recover·Maintain 원본의 변경분과 tests를 적용하되 Noline Claude adapter·settings·wrappers와 기존 agents·dispatcher는 유지한다. 여섯 Reference skill은 `.claude/skills/` 원본과 `.agents/skills/` 상대 bridge에 적응한다.

기존 상세 문서 전체 정비와 제품 리팩토링은 하지 않는다. Flat Project 본문은 전환 안내 뒤에 원문을 보존하고 현재 authority에서는 내려왔다. 이전 memory 세 파일의 바이트는 [prior-memory](../source/prior-memory/)에 보존한다. [Fresh preflight](receipts/preflight/preflight-20260909T140507056185Z-f1caf35fc6894327a7d811ffd7622f3c.json)는 기존 untracked 18개 entry를 보호 목록으로 고정한다. Private 원문은 해석·복제하지 않았다.

Active/default 및 변경 대상 consumer는 `001-noline-context-harness-application` 하나다. Preflight에서 두 host runtime 디렉터리가 없어 current-generation bound consumer는 관찰되지 않았다. 이 Workspace의 Project 선택·memory·state·output을 reconcile하며 active id는 바꾸지 않는다.

## 검증 입력과 상한

직접 `node scripts/check-harness.mjs`는 기존 Git whitespace 확인까지 유지한다. Durable Verify는 `node scripts/check-harness.mjs --no-git-diff`로 regular-file 검사를 실행한다. 그 명령이 읽는 모든 현재 Markdown 본문, 설정·agent 본문과 검사 스크립트를 evidence로 선언한다. Package manager·lockfile·compiler·제품 소스는 이 argv가 실행하지 않으므로 그 내용을 검증했다고 하지 않는다.

Symlink의 연결과 directory membership·링크 target 존재는 실행 당시 관찰이며 regular-file snapshot freshness가 이후 topology의 동일성을 보장하지 않는다. Git HEAD·index·whitespace는 별도 직접 검사 결과다. 새 Markdown이나 entry가 추가되면 Verify 입력 closure를 다시 구성하고 실행해야 한다. Node/OS와 외부 상태는 snapshot할 제품 입력이 아니다. Receipt는 선언 snapshot과 해당 실행 사건에만 한정한다.

Harness 테스트는 별도 [Harness test receipt](receipts/harness-tests/)에서 보존하고 Product Verify의 구조 검사와 구별한다. Ephemeral validation은 임시 fixture만 사용한다. 기존 descendant timeout timing failure는 원본 test를 바꾸지 않고 실제 결과로 남긴다.

## 현재 결과

적용 후 직접 `node scripts/check-harness.mjs`가 통과했고 명시·기본 Recover는 같은 15개 context 경로를 읽었다. Spec 다섯 본문·Ticket 색인·state·output과 선택한 Project 문서 네 개가 들어오며 옛 memory와 Ticket 본문은 기본 packet에 없다. 여섯 skill의 전체 파일은 승인된 Source와 같고 상대 bridge·frontmatter·호출 설정과 JSON/TOML parse를 확인했다.

관련 63 tests는 전부 통과했다. 첫 전체 122 tests에서 `test_timeout_covers_descendant_after_group_leader_exits`의 PID 파일 생성 timing failure 한 건이 재현됐다. 원본 log를 보존했다. 승인된 receipt 쓰기 실행에서 source 27개를 snapshot한 전체 재실행은 122 tests가 통과했다. 첫 실패와 재실행 성공의 실행 환경 차이를 유지하며 timing 문제가 해결됐다고 주장하지 않는다. Ephemeral validation은 두 전체 실행에서 pass했다.

Node의 실제 regular file 읽기를 계측해 [input closure](receipts/application/input-closure-20260909.json)와 선언 evidence를 대조했고 빠진 content input은 없었다. 이후 이 문서·현재 상태를 최종 반영해 실행하는 Verify의 result와 receipt cursor는 [machine status](../current/state/status.json)에서 확인한다. 이 문서가 과거 receipt의 입력 freshness를 소급해 보증하지 않는다.

기존 untracked 18개 entry의 hash가 preflight와 같았고 제품 코드·기존 상세 문서·Claude/Codex 고유 연결 보존을 Main도 직접 확인했다. 구현과 별개의 reviewer는 실제 target 내용·보존 및 explicit/default Recover, 최종 문서·regular input closure에서 actionable P1/P2가 없다고 Main에게 보고했다. Reviewer가 대조한 regular read 입력 111개는 선언 basis+evidence 123개에 모두 포함됐고, 여섯 skill의 Source 동일성과 prior-memory의 원문 바이트 보존도 확인했다. Fresh preflight의 보호 대상을 개인 세션 파일 9개라고 잘못 쓴 표현은 실제 receipt 기준의 기존 untracked 18개 entry로 정정했다. 실제 보호 검사는 처음부터 receipt의 18개 hash 전부를 대조했다.

서면 provenance는 Source `context-harness`의 `context/workspaces/011-noline-harness-upgrade/records/review/2026-09-09-installed-independent-review.md`다. 이 기록에는 target에서 다시 판단할 핵심 결과와 한계를 직접 보존했다. Reviewer가 직접 대조한 이전 Verify는 `8e8696f` 사건이며, 이 결과를 현재 문서에 반영한 뒤 새 Verify→Recover로 최종 cursor를 연결한다.

Reviewer는 실패 test 본문과 Verify runtime이 baseline에서 달라지지 않았으며, baseline과 현재 target의 해당 test 단독 실행은 통과했다고 보고했다. 첫 전체 실패와 후속 전체·단독 성공을 함께 보존해 timing-sensitive 관찰로 남긴다. 이식 결과의 사람 수락은 Main·사용자에게 남아 있다. 실제 target-root skill discovery·invocation·Main 결과 전달·문서 유지와 Codex/Claude host trust·explicit activation·event receipt는 미확인이다. Maintain 상태는 `activation_pending`이며 Codex status는 현재 session을 unbound로, Claude status는 명시한 read-only probe id를 unbound로 반환했다. Claude wrapper를 selector 없이 호출하면 오류가 나는 기존 동작도 유지된다. 두 status 조회 뒤 runtime 디렉터리는 생성되지 않았다. 이는 actual-host lifecycle의 격리 장면을 대신하지 않는다. 새 session default-unbound를 유지한다. Stage·commit·branch 변경·제품 acceptance·Workspace 완료는 수행하지 않는다.
