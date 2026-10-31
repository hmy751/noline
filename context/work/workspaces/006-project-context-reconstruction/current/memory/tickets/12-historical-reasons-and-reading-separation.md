# Ticket 12 — 선택 이유 복원과 역사 자료 분리

## 맡은 결과와 범위

현재 판단에 필요한 이유가 sessions·audits·CHANGELOG·옛 하네스 결정에만 남아 있지 않게 한다. 현재 설명과 당시 원문의 권위를 구별하고, 역사 자료가 일반 읽기의 우회 정본이나 필수 경로가 되는 연결을 없앤다.

남은 harness decisions·sessions·audits·CHANGELOG와 root·harness의 역사 연결을 Ticket 09–11의 현재 Owner 및 기존 형성 자료와 대조한다. 09–11에서 이동하는 자료의 원문 보존과 해당 주제의 선택 이유는 각 Ticket이 맡는다. 이 Ticket은 그때까지 미처리된 역사 묶음과 현재 소비를 맡으며 앞선 Ticket의 내용 복원을 대신하는 마지막 수거 단계가 아니다.

## 실행 맥락과 접근

[09–13 구성](../../../output/ticket-recomposition-09-13.md)과 [Spec의 내용 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)을 적용한다. 제품 의미는 Project, 실행·관리 기준은 해당 책임 본문에 통합하고, 정확한 원문이 필요한 선택 이유는 가까운 형성 근거에 선별한다. 이미 충실히 보존한 내용을 다시 복제하지 않는다.

원문은 재검토·복구 가치와 중복 여부를 판단해 일반 읽기 밖의 archive로 격리하거나 불필요한 사본을 제거한다. 모든 archive를 옮기거나 과거 문장을 현재 정책으로 고쳐 쓰지 않는다. 이미 격리된 자료는 현재 읽기 의존·중복·보존 문제가 있는 범위에서만 추가 처리한다.

## 완료 조건과 확인 방법

- 현재 읽기에서 필요한 이유·비용·재검토 조건을 이해할 수 있고 옛 문서나 archive를 필수 단계로 열 필요가 없다.
- 보존한 원문은 이동 전후 내용과 출처를 확인할 수 있다.
- 현재 root·guide·형성 자료와 live consumer의 참조는 함께 전환하되 역사 Workspace를 일괄 최신화하지 않는다.
- 남긴 역사 자료와 제거한 사본의 역할·재접근 경로·판단 이유를 설명한다.
- 현재 판단과 역사 근거를 혼합하거나 archive를 경쟁 Owner로 유지하지 않는다.

## 현재 상태와 실제 결과

Main은 사용자가 승인한 [역사 자료 28개 통합안](../../../output/history-integration-proposal.md)을 적용했다고 보고했다. 적용 내용과 보존·검증 범위는 [통합 결과](../../../output/history-integration-result.md)에 정리됐다.

- 기존 Selective Local-First Decision은 활성화 대안, 온라인 의존 비용과 Router/Sync 구분을 보완했다.
- 주제별 Owner로 통합한 이유와 Project의 `common`·`current`·`guidance` 구성 및 검증 방식의 형성 이유를 각각 새 Project Decision으로 구성했다.
- audits 6개는 당시 조사·검증·실행·재진입 기록으로 보존하고 현재 정비의 선행 입력으로 요구하던 연결을 제거했다.
- sessions의 활성화 대안과 비용은 기존 Decision에 통합했다. 지도·경로 의미는 현재 Owner와 형성 자료에 이미 있어 중복하지 않았으며 당시 완료·성능·rollback 주장을 현재 지원 근거로 옮기지 않았다.
- 원문 28개는 `.claude/_archive/2026-10-31-project-context-reconstruction/history-integration/`에 원래 경로·기준 commit·SHA-256과 함께 보존했다. Main은 삭제 전 원문과 보존본의 바이트·해시를 대조한 뒤 기존 `.claude/audits`·`.claude/decisions`·`.claude/sessions` 폴더를 제거했다고 보고했다.
- 루트·Document Map·harness·스킬 색인·Project/REFERENCE 입구와 현재 소비자를 새 Owner에 맞췄다. 001의 Recover/Verify 근거와 006 Recover 선택도 현재 경로로 전환했지만 durable Verify receipt는 새로 만들지 않았다.

Main이 전달한 독립 검토에서는 내용상 추가 결함을 찾지 못했고, 별도 검증자는 28개 원문의 바이트·SHA 일치와 대표 질문의 선택 이유·비용·대체·재검토 조건을 확인했다고 기록됐다. 전체 Harness 검사는 기존 55건에 역사 문서의 옛 링크 8건이 추가되어 63건 실패를 재현했다. 추가 8건은 현재 일반 읽기의 소비자가 아니라 역사 Workspace 문서이며, 보존 묶음의 경로표와 `historical-links.json`으로 재접근할 수 있다.

이번 적용은 승인된 28개 자료의 현재 의미 통합·원문 보존·현재 읽기 전환 범위를 마친 것이다. 아직 커밋하지 않았고, 역사 링크 전반의 정비·제품 실행·이미 로드된 host cache 갱신·전체 스킬과 host 연결 작업·006 전체 사용자 수락을 완료한 것은 아니다. Ticket 11의 공통 실행 기준·host 연결 작업도 이 결과로 완료 처리하지 않는다.
