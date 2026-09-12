# Recover

`recover`는 다음 세션이 바로 판단하고 행동할 수 있도록 명시된 Workspace 또는 active 기본값의 제한된 recovery packet을 만든다. Workspace id를 명시하면 그 id가 선택 권위이며 `workspaces/index.json`을 읽거나 검증하지 않는다. id가 없을 때만 index의 active Workspace를 기본값으로 사용한다.

Recover는 새 Workspace를 만들 때 이전 작업에서 무엇을 이어받을지 결정하지 않는다. 그 의미 선별과 Workspace 사이의 참조 경계는 [`새 Workspace 생성과 전환`](../../workspaces/CREATE-AND-TRANSITION.md)이 소유한다. Recover는 이미 선별된 successor current를 읽을 뿐, 누락을 찾기 위해 이전 Workspace·source inventory·records를 탐색하거나 계승 의미를 보충하지 않는다. 경로·schema 검사를 통과한 packet도 의미적으로 충분한 인계였음을 증명하지 않는다.

## 소유 계약

- `workspace.json`의 정체성과 `recover.json` schema `6`의 `project_context`만 읽는다. 안정된 routing anchor인 `context/project/README.md`를 반드시 포함하고, 나머지 선택은 Project root의 `context/project/common/`, `current/`, `guidance/`, `decisions/` 아래 regular Markdown으로 제한해 계약 순서대로 싣는다. Root의 다른 평면 문서와 미허용 하위 폴더는 거부한다. README 외에 goal에 필요한 실제 내용 문서를 고르는 것은 Workspace 생성·이관의 의미 판단이며 Recover가 모든 층을 자동으로 읽거나 문서 수·이름으로 충분성을 대신하지 않는다. Schema `2`, 첫 payment 적용에서 target-local로 사용한 schema `3`, overview를 필수 anchor로 삼던 schema `4`, root README는 요구하지만 평면 본문도 허용하던 schema `5`의 의미를 재사용하지 않는다.
- [Workspace의 Spec·Ticket 구성](../../workspaces/spec-and-tickets/README.md)에 따라 `current/memory/index.md`, `spec/` 바로 아래 Markdown 전체, memory 바로 아래 나머지 Markdown, `tickets/index.md`를 순서대로 싣는다. 각 묶음은 파일명 순서로 읽고 Spec 다섯 파일·`project-context.md`·Ticket 색인의 존재를 확인한다. 기존 goal·constraints 대신 Spec이 작업 정의를 제공한다. Ticket 본문은 색인에서 필요한 것을 작업 주체가 추가로 읽으며, 다른 하위 폴더는 재귀 탐색하지 않는다. 개별 실행자의 입력 범위를 이 기본값으로 강제하지 않는다.
- 사람용 `current/state/index.md`와 machine용 `current/state/status.json`을 함께 싣는다. 기존 status schema `2`와 현재 schema `3`을 읽으며, schema `3`에는 사람 판단을 지시하는 `next_action`이 없다.
- Workspace `output/index.md`를 goal 산출물 지도로 싣는다. index가 연결하는 코드·문서·테스트나 같은 폴더의 다른 산출물 본문은 자동으로 읽지 않는다.
- status가 receipt를 연결하면 제품 Verify namespace인 `records/receipts/verify/verify-*.json` 또는 읽기 호환용 `records/verify-*.json`만 허용하고, 기존 receipt schema `1` 또는 현재 schema `2`의 Workspace id, result, finished time header를 대조한다. Schema `2`는 선언된 canonical·evidence snapshot의 SHA-256과 크기를 현재 Project 파일과 다시 비교해 `fresh` 또는 `stale`을 packet에 표시한다. 변경·누락은 재진입을 막지 않지만 receipt 안의 traversal·symlink 같은 안전 위반은 거부한다. Receipt 본문과 snapshot 경로는 context에 싣지 않는다.
- Ticket 본문, 선택되지 않은 Project 문서, Workspace `source/` 전체, Workspace output artifact 본문, `records/` 전체, `verify.json`은 읽지 않는다.

## 진입 시 검사 경계

Recover는 선택된 입력을 안전하고 의미 있게 읽어 bounded packet을 만드는 데 필요한 검사를 유지한다. Workspace id와 identity·recover contract·status의 정합성, exact schema, root·Project layer 경계, 상대 경로, regular file, symlink 방어, 선택 파일 존재 여부와 최소 memory·Project README가 여기에 해당한다. 반면 어떤 layer 문서가 현재 goal에 필요한지, 선택 내용이 의미적으로 충분한지와 문서 나열 순서는 생성·이관 시점에 확인할 구성 정책이므로 재진입을 막지 않는다.

Project root에서 다음처럼 실행한다.

```bash
python3 -m context.work.harness recover
python3 -m context.work.harness recover <workspace_id> --json
```

JSON packet schema는 `6`이다. Schema `5`에 status-linked receipt의 bounded `receipt_freshness` 요약을 추가했다. Workspace 자료가 Work root 상대이고 Project context가 Project root 상대라는 `path_base`를 각 경로에 명시하며, 제어용 경로와 실제로 읽은 context 경로를 구분해 공개한다. `control_paths`에는 실제 읽은 선택 근거만 들어가므로 id 없는 active 선택에는 `workspaces/index.json`이 포함되고, explicit 선택에는 포함되지 않는다.

Spec·Ticket 적용은 기존 `memory.entries`와 `loaded_context_paths`에 경로·본문을 싣는 구조를 유지하므로 packet schema `6`과 Project 선택용 recover contract schema `6`을 바꾸지 않는다. 기존 goal·constraints만 있는 Workspace는 현재 읽기 구성에 맞게 전환한 뒤 사용한다. 과거 records·receipt를 자동 수정하는 migration이나 이전 정의와 새 Spec의 이중 관리는 제공하지 않는다.
