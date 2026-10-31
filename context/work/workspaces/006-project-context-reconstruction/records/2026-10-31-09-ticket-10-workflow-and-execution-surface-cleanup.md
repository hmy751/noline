# Ticket 10의 commands·PR·dispatcher·agent 정리

## 선택이 바뀐 과정

사용자는 옛 문서 관리 명령에 새 내용을 더하지 않아도 된다는 판단 뒤 “그래 그럼 이건 없애면 될것 같고 3번도 봐봐”라고 요청했다. 이에 check-docs·doc-save·doc-discuss·doc-refactor는 유효한 기능이 기존 development·context-update·Project·Work 계약에 있음을 대조하고 제거했다.

PR 작성에서는 처음에 generate-pr 호출 진입을 남기는 안을 검토했다. 사용자는 “그래 따로 문서를 두자 만약 PR 하는 경우 레퍼런스 따르게 정도로”라고 선택해 작성 방법을 development의 조건부 reference로 분리했고, 이어 “generate-pr 삭제해”라고 명시해 command와 commands 안내까지 제거했다. 유효한 기능인 대상 선택·커밋과 최종 diff 대조·문제와 결과·검증과 영향 설명은 reference에 남겼다. 커밋 수·줄 수에 따른 고정 목차, 키워드 기반 migration 요구와 자동 commit·push·원격 PR 권한 확대는 제외했다.

사용자는 기록과 commit을 요청한 뒤 “.claude/skills/noline-work 이것도 다 정리한거 아닌가? 삭제해 다 처리 햇잖아?”라고 정정했다. 이어 “.agent도 없애자”의 대상을 “/Users/hammyeong-yeon/Desktop/10_work/noline/.claude/agents 여기”로 명확히 했다. 이에 deprecated noline-work 원본·Codex skill bridge·발견 기대값과, .claude/agents의 Noline agent 세 정의 및 대응 .codex/agents 정의를 제거했다.

## 유지한 책임과 받아들인 비용

제품 기준과 위험 점검은 Project guidance가, 구현·검토·검증의 배정은 development가 맡는다. Work의 workspace_context_maintainer와 lifecycle hook, 현재 skill bridge는 삭제 대상과 다른 책임이므로 유지했다. 옛 agent별 편의 진입은 사라지지만 같은 판단 역할을 고정된 프로젝트 정의로 유지하는 중복과 양 host parity 부담도 함께 사라진다. Ticket 11은 삭제한 dispatcher·agent 정의를 다시 만드는 작업으로 읽지 않고 남은 공통 실행 기준과 host 연결만 판단한다.

work-discussion의 현재 Workspace 갱신 책임은 Maintain에 있다는 사용자 정정을 유지했고 본문·형성 자료는 이번 범위에서 수정하지 않았다. 제거한 원본은 Ticket 10 archive와 commit 이력에서 복구할 수 있게 했고, 현재 읽기의 필수 경로로 연결하지 않았다.

## 확인과 기록 경로

2번·3번의 독립 검토와 요구 검증에서는 중요한 누락을 찾지 못했다고 Main이 보고했다. 4번의 Main 최종 검사에서는 Harness 실패 55건이 직전과 항목·순서까지 같았고, retired agent 보존본 6개의 SHA-256, 제거 경로 부재, diff와 검사 script 구문을 확인했다고 보고했다. 독립 개선 검토도 중요한 누락을 찾지 못했다. 별도 요구 검증은 4번 요구 충족으로 반환됐다. 제거한 네 경로는 존재하지 않았고, agent 보존본 6개는 manifest·HEAD와 일치했으며 현재 skill bridge 8개는 정상이고 Codex config는 HEAD와 같았다. 독립 Harness 검사도 기존 55건과 같은 목록·순서를 반환했고 검사 script 구문은 통과했다.

상세 결과는 [2번](../output/ticket-10-part-02-result.md), [3번](../output/ticket-10-part-03-result.md), [4번](../output/ticket-10-part-04-result.md)에 있다. 전체 Harness 실패 55건, 실제 host의 모든 호출 효과와 006 전체 사용자 수락은 남은 한계다.

새 사용자 입력에서 자동 Maintain hook은 같은 turn id에 다른 prompt 내용이 들어왔다는 이유로 반복 실패했다. Main은 runtime의 처리 가능한 대기 건이 없음을 확인한 뒤 이 수동 fallback을 요청했다. 이 기록 제안은 자동 반영 성공이나 current freshness를 주장하지 않으며 실제 guarded apply 결과는 Main이 확인한다.
