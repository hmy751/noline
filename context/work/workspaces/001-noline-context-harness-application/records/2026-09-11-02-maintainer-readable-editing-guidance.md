# Maintainer 문서 통합 편집 기준 반영

Reference source commit `def91c24e9e87344080517c163c734530472bbe5`의 Maintainer 문서 작성 보완을 Noline 설치본에 적응했다. 기준은 Spec·Ticket의 공통 형식을 새로 만드는 것이 아니라, Maintainer가 허용된 사람용 Workspace 문서를 작성하거나 갱신할 때 각 Owner와 기존 구성·내용 관계를 먼저 읽고 새 의미를 통합하도록 하는 것이다.

Workspace collection이 이 일반 기준을 소유한다. 적용 대상은 `current/`의 Spec·Ticket·추가 memory·state, `source/index.md`, `output/index.md`, `records/README.md`와 새 날짜별 record다. 전달받은 순서대로 내용을 덧붙이지 않고 중복·대체된 설명을 정리하며, 문단·목록·소제목과 정보 순서는 문서 역할에 맞춰 선택한다. Machine 계약·status·receipt, raw source와 제품 산출물은 이 가독성 기준으로 다시 쓰지 않는다. Spec·Ticket의 고유 내용 기준은 기존 `SPEC-AND-TICKETS.md`가 계속 소유한다.

Maintain README와 Noline용 `workspace_context_maintainer` 정의는 이 canonical을 적용하도록 연결했다. Agent가 맥락적 편집을 판단하고 Guard는 기존처럼 경로·preimage·허용 side effect만 검사한다. 자동 semantic 경로의 prompt에도 Workspace collection 계약을 포함하고 해당 연결을 단위 테스트로 고정했다. Noline의 agent 이름·설명, root routing, skill·hook·session binding 설정은 바꾸지 않았으며 Project-local Maintain 상태는 계속 `activation_pending`이다.

[Preflight receipt](receipts/preflight/preflight-20260911T103100910635Z-3314edbabaf843b49e96eb9da6f98ba5.json)는 target HEAD `a51b7592eb71576dc617a01a79e3b9f6cb3e390a`와 당시 미커밋 변경 5개를 고정했다. 제품의 `geonames.api.ts`와 Workspace 002의 Ticket·색인·state·output 변경은 적용 payload와 겹치지 않았고 그대로 보존했다. 이번 적용은 Workspace 공통 계약, Maintain 계약·agent·prompt·테스트와 Application Workspace의 state·output·record에 한정했다.

Noline Maintainer 단위 테스트 70개와 TOML parse, `node scripts/check-harness.mjs`, `git diff --check`, explicit Workspace 001 Recover와 active/default Recover가 통과했다. `pnpm harness:check` wrapper는 검사 본체 전에 현재 pnpm이 `node_modules` 재설치를 요구해 실행하지 않았고, 같은 script 본체를 직접 실행해 link·bridge·whitespace를 확인했다. [전체 Harness test receipt](receipts/harness-tests/harness-test-20260911T103551216510Z-1439f46892cb4db4a4a31bc9c89f8182.json)는 122개 중 121개 통과와 Verify의 `test_timeout_covers_descendant_after_group_leader_exits` 타이밍 실패 1개를 보존한다. 이 시험은 같은 source 변경의 Reference 전체 실행에서도 동일하게 실패했으며, Noline에서 해당 시험만 분리 재실행했을 때는 1개가 통과했다. 이번 변경과 직접 연결된 Maintainer 검증은 통과했지만 semantic 재생, actual-host hook trust·session activation·runtime event와 기존 문서 가독성의 실제 개선 효과는 확인하지 않았다. 제품 코드·Product Verify·machine status는 변경하지 않았다.
