# 선택한 원자료와 조사 시작점

이 목록은 생성 시 선택한 진입점과 이후 사용자가 추가한 분산 컨텍스트 접근점을 담는다. 전체 자료 조사를 마친 목록이 아니다. 저장소 자료는 생성 기준 commit `f525421`에서 접근점을 확인했으며, 본격 조사에서는 읽은 범위와 현재 코드·후속 변경의 대조 시점을 별도로 남긴다. 링크한 과거 자료의 정본과 당시 권위는 원래 위치에 남는다.

이곳의 옛 `.claude` 링크는 이관 조사와 역사 확인을 위한 접근점이다. 최종 개발 읽기 경로로 유지한다는 뜻이 아니다. 사용자가 정정한 아카이빙의 뜻과 Workspace 교정 요청은 [사용자 방향 원문](user-direction.md#이관-완료와-아카이빙의-뜻에-대한-정정)에 추가 보존했다.

| 자료 | 역할과 읽을 시점 |
| --- | --- |
| [사용자 방향 원문](user-direction.md) | 목표·범위 해석이나 후보 제외가 사용자의 기대와 맞는지 판단할 때 읽는다. |
| [002 source](../../002-code-readability-refactoring/source/index.md) · [원래 코드 분석](../../002-code-readability-refactoring/source/codebase-analysis/README.md) | 당시 분석·snapshot의 범위와 확보 방법을 확인하고, 근거로 사용할 자료를 고른다. |
| [002 산출물](../../002-code-readability-refactoring/output/index.md) · [002 Ticket](../../002-code-readability-refactoring/current/memory/tickets/index.md) · [002 기록](../../002-code-readability-refactoring/records/README.md) | 작업 전체를 펼친 후 주제별 구현·선택 이유·검증 근거와 후속 수정을 찾는다. 과거 pass를 현재 사실로 올리지 않는다. |
| [004 제품 질문과 선택](../../004-project-context-contracts-and-guidance/current/memory/tickets/01-product-contract-agreements.md) · [004 산출물](../../004-project-context-contracts-and-guidance/output/index.md) · [004 source](../../004-project-context-contracts-and-guidance/source/index.md) | 논의 방식, 이미 이관한 내용과 당시 미결 질문을 살핀다. 현재성은 이후 기록·코드에 대조한다. |
| [005 산출물](../../005-context-based-code-improvement/output/index.md) · [005 종료 기록](../../005-context-based-code-improvement/records/2026-10-30-17-workspace-close-and-next-discussion.md) | 기존 보완 내용·근거의 재사용과 종료의 의미를 확인한다. 후속 방향에 대한 추가 발화는 위 사용자 원문에 있다. |
| [옛 문서 지도·하네스 원문 재접근](../output/ticket-13-readme-integration.md#원문과-역사-참조) | 제거된 두 README를 조사 자료로 다시 읽을 때 commit·원래 경로·해시를 확인한다. 현재 개발은 root·Project·Work·스킬의 각 Owner에서 시작한다. |
| [루트 가이드](../../../../../CLAUDE.md) · [client](../../../../../apps/client/CLAUDE.md) · [server](../../../../../apps/server/CLAUDE.md) · [schema](../../../../../packages/schema/CLAUDE.md) · [UI](../../../../../packages/ui/CLAUDE.md) | 최초 대응 조사부터 현재 의미·경로별 기준·Project 연결을 대조한다. 각 위치의 `AGENTS.md`와 주변 README도 포함하며 유지·보완·통합·이관할 내용을 판단한다. |
| [Project 진입점](../../../../project/README.md) | 현재 본문의 내용·구성·Owner와 자료의 대응을 살핀다. 현재 본문을 source로 복제하지 않는다. |

002·004·005는 이 Workspace가 선택한 근거이지 서로를 순서대로 복구해야 하는 의존 사슬이 아니다. 자료를 실제로 읽고 해석한 내용은 source 원문에 섞지 않고 records와 현재 산출물에 남긴다. 저장소 안의 다른 흩어진 자료는 Ticket 01에서 탐색·추가한다.

2026-10-30, `aae7c22` 이후 범위 보완에서 위 다섯 `CLAUDE.md`의 존재와 같은 위치의 `AGENTS.md`가 각각 `CLAUDE.md`를 가리키는 symlink임을 확인했다. 이것은 경로·연결 확인이며 본문 최신성·제품 사실 검토는 Ticket 01에 남아 있다. 사용자 범위 추가의 원문과 적용 판단은 [범위 보완 기록](../records/2026-10-30-06-distributed-context-scope.md)에 보존한다.
