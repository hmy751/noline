# Ticket 10의 1번 — 제품 런북의 내용·진입 통합

2026-10-31. 사용자가 승인한 제품 개발 런북 범위를 적용했다. 제품별 기준·조사 방법은 기존 Project 본문에, 필요한 탐색은 기존 guidance 색인과 경로별 guide에 통합했다. `.claude/runbooks/`와 `.claude/workflows/`는 현재 경로에서 제거했다. Ticket 10 전체 완료나 사용자 수락·commit을 뜻하지 않는다.

## 판단을 바꾼 이유와 최종 구성

처음에는 런북의 번호형 절차를 없애고 같은 위치에 일곱 작업의 선택표를 남겼다. 사용자는 “잠깐 지금 .claude는 결국 아카이빙 한느건데 왜 남기는거야?”라고 물었고, Main의 설명 뒤 “다시 생각하고 해봐”라고 지시했다. 앞선 “일단 1번만 적용해봐”는 부분 실행 범위였으며, 006의 옛 자료 읽기 제외 기준을 바꾼 근거로 보지 않았다.

별도 self-check는 006의 앞선 아카이빙 정정과 09–13 재구성 기록을 대조했다. 필요한 역할과 기존 위치·구조를 구별해야 한다는 기준을 이미 세웠는데, Main이 내용 간소화만으로 1번을 마치려 했음을 확인했다. 지적을 받아 선택표를 다른 위치로 그대로 옮기는 안도 재검토했다.

기존 [guidance 색인](../../../../project/guidance/README.md)은 이미 API·Form·UI·데이터 수명과 각 변경의 적용 조건을 설명한다. 별도 런북과 일곱 작업표를 만들지 않고, Entity 변경의 여러 책임을 찾는 안내와 날짜·통화·동기화 조사 진입만 이 색인에 보완했다. 개발의 요구 해석·구현·검토·검증·결과 연결은 기존 `development`가 계속 맡는다. 스킬을 단순 분배기로 축소하거나 모든 제품별 순서를 스킬로 옮기지 않았다.

이 구성은 짧은 런북 요약을 한 번 더 관리하는 부담을 줄이는 대신, 관련 주제 본문에서 조건·현재 차이까지 읽는 비용을 받아들인다. 경로별 guide가 이미 본문을 선택했다면 색인을 다시 거칠 필요가 없다. 옛 workflow 앵커의 호환성은 유지하지 않으며, 실제 현재 소비자를 직접 본문으로 전환했다.

## 내용별 처리

| 옛 내용 | 현재 본문과 처리 |
| --- | --- |
| Entity | [schema·타입](../../../../project/guidance/development-boundaries/schema-and-types.md), [계층](../../../../project/guidance/development-boundaries/layers.md), [API](../../../../project/guidance/api-contracts.md), [데이터 수명](../../../../project/guidance/data-lifecycle/INDEX.md)의 기존 schema·생성 ID·Router·원자성·삭제·권한 설명을 사용한다. 색인에 변경 책임별 선택을 보완했고 별도 Entity 체크리스트는 만들지 않았다. |
| 동기화 조사 | 데이터 수명 본문에 같은 계정·여행·Entity·변경·관찰 시점을 맞추고 Local 행·queue·실제 요청을 대조하는 출발점을 통합했다. 부분 UPDATE를 전체 행과 같아야 한다고 해석하지 않으며, 증상별 분기를 모든 경우의 강제 순서로 만들지 않았다. |
| API | 기존 API 본문의 request/response 검증·serializer·인증·소유권·repository/query 경계를 사용한다. 런북의 짧은 번호 절차를 별도로 유지하지 않았다. |
| Form | [작성·입력](../../../../project/guidance/writing-and-input/INDEX.md)의 초안·선택창·제출·제한·실패·종료 설명을 사용한다. 기존 화면·Drawer·feature의 실제 책임을 단순한 screen/data 이분법으로 덮지 않았다. |
| 날짜·시각 | [날짜와 시각](../../../../project/common/date-and-time.md)의 시점/date-only·timezone·저장/표시·분리 입력·DB 의미와 helper 기준을 사용한다. |
| 통화 | [통화와 금액](../../../../project/common/currency.md)에 새 표시의 `formatCurrencyDisplay`, 경비 묶음의 `groupExpensesByCurrency` 사용 기준을 보존했다. 기존 화면 차이·대표 의미·환산 조건·열린 저장 정밀도는 유지한다. |
| UI | [UI 책임](../../../../project/guidance/development-boundaries/ui.md)의 primitive/domain/workflow·외부 margin·props·Policy 기준을 사용하며 날짜·금액을 표시할 때 해당 주제의 공용 helper·표시 계약으로 연결했다. |

독립 내용 검토에서 통화 helper의 동작 사실만으로 새 구현의 사용 기준을 대체하면 의무가 약해진다는 의견을 채택했다. UI의 조건부 날짜·통화 연결도 보완했다. 제품 코드의 동작이나 기존 구현 공백을 이번 문서 이관으로 해결했다고 쓰지 않았다.

## 현재 소비 경로와 보존

루트·앱·패키지 guide, Context/Project/Work 진입, `.claude` 문서 지도·harness 안내·skills/commands/audits 색인, development의 Noline 본문 선택을 현재 Project로 맞췄다. context collector와 harness observer는 Claude/Codex 양쪽에서 제거한 런북 읽기·Owner 지칭을 함께 정정했다. 이 변경은 agent의 report-only 권한이나 개발 스킬의 수행 흐름을 바꾸지 않는다.

기본 Workspace 001의 Verify evidence에서 제거한 두 경로를 뺐다. 기존 Project guidance·본문은 이미 evidence에 포함돼 있다. 운영 metadata에서 current generation에 002·006 binding이 남아 있음을 확인하고, 002의 현재 Form/UI 안내도 직접 guidance로 전환했다. session-end가 있는 binding을 새로운 실행 중 세션이라고 주장하지 않으며, binding control이나 다른 session의 원문은 읽거나 변경하지 않았다. 006의 Ticket·state는 기존 Maintain이 이 결과를 반영할 대상이다.

원본은 [Ticket 10 보존 안내](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/README.md)에서 찾는다. manifest의 원본 10개는 commit `c6bc416`의 바이트 및 SHA-256과 일치한다. 보존한 원본 전체가 이번에 이관·제거된 것은 아니며, 이번 제거는 제품 runbook과 workflows 호환 지도다. 현재 제품 본문은 이 원본을 필수 읽기로 연결하지 않는다.

앞서 Main이 승인 전에 만든 문서 관리·PR runbook 두 초안은 같은 보존 영역의 `unadopted-drafts/`로 격리했다. 이를 현재 기준으로 안내하거나 아직 남은 command·noline-work를 제거 완료로 적은 선행 변경, 관련 검사·001 evidence의 선행 기대도 실제 상태로 정정했다. 이는 후속 기능을 구현한 것이 아니라 미채택 초안의 현재 적용을 철회한 것이다. 기존 문서 command·generate-pr·noline-work 원본과 bridge는 유지하며, deprecated 안내의 현재 대체 진입만 바로잡았다. 과거 실행 본문은 현재 기준으로 고쳐 쓰지 않았다.

## 확인 범위와 남은 한계

별도 검증자는 최신 결과를 **이번 1번의 요구 충족 근거 있음**으로 판정했고 중요한 잔여 결함은 찾지 못했다. 대표 작업의 문서 적용과 정적 확인에 한정한 판정이며, 실제 host에서 agent를 호출한 효과는 검증하지 않았다. 검사 원문은 [적용 전 기준선](ticket-10-part-01-checks/harness-before.txt)과 [독립 검증자의 최종 실행](ticket-10-part-01-checks/harness-after-independent.txt)에 보존한다. 이는 Work Verify receipt가 아니다.

- Main의 작성 대조와 별도 개선 검토는 원문 일곱 항목의 조건·강도·역할을 현재 본문·실제 helper와 대조했다. 검토가 발견한 commands 색인과 deprecated 안내의 현재 런북 지칭도 정정했다.
- 별도 검증자는 현재 소비 경로와 원문을 직접 읽고, audits 색인·Work 진입·development에 남은 런북 선택 안내를 발견했다. Main이 수정했고 검증자가 최신판에서 해소를 재확인했다.
- 변경 Markdown의 상대 링크·앵커 378개는 Main과 별도 검증자가 각각 확인해 문제를 찾지 못했다. 이는 문서 의미나 실제 제품 실행을 입증하는 숫자가 아니다.
- 기본 Recover(001)와 명시 001·002·006 Recover를 Main이 실행해 성공했다. 별도 검증자는 기본 001·명시 002·006을 재실행하고 packet의 옛 런북 의존이 없음을 확인했다. durable Verify receipt나 acceptance를 만들지 않았다.
- `git diff --check`와 검사 스크립트 구문 확인은 통과했다. `node scripts/check-harness.mjs`는 **55건으로 실패**했다. 1번 적용 전 Main의 미채택 변경까지 포함한 기준선은 69건이며, 그중 17건이 사라지고 옛 경로 제거로 역사 Workspace 003·004의 링크 3건이 새로 드러났다. 기존 52건과 새 역사 참조 3건을 구별한다. 검사 기준을 완화하거나 역사 원문을 현재 기준으로 고쳐 통과시키지 않았다.

새 역사 참조는 003의 `current/memory/project-context.md` 한 곳, 004의 같은 문서와 `output/index.md` 두 곳이다. 이들은 현재 active/default·binding 소비자에서 확인되지 않았고, 당시 경로를 기록한 자료다. 해당 원문은 유지하며 Ticket 12의 역사 자료 정리와 13의 최종 검증에서 재접근·처리 판단을 이어간다. 전체 Harness 통과나 모든 역사 링크 해소를 이번 완료로 주장하지 않는다.

이번 검증은 문서의 제품 의미 보존·대표 작업의 현재 읽기·bridge 지침과 경로 전환에 한정한다. 실제 앱·DB·네트워크 동작은 바꾸거나 재시험하지 않았다. Ticket 10의 옛 문서 명령, PR 작성 상세, deprecated noline-work 전체 정리와 나머지 guide 정비는 남아 있다. 개인 문서의 병행 변경과 `.pnpm-store/`는 이 작업에 포함하지 않았다. 검증 결과를 보고한 시점에는 commit하지 않았으며, 이후 사용자가 “그래 기록 보완할거 하고 커밋하자”라고 요청했다. 커밋 범위는 이번 1번의 이관 결과·원본 보존·검증 근거와 006의 관련 기록이며, 2–4번 후속 구현은 포함하지 않는다.
