# Ticket 10의 원본과 미채택 초안

역사 조사·복구용 보존물이다. 현재 제품 기준이나 작업 절차로 읽지 않는다.

`manifest.json`은 commit `c6bc416`에서 확보한 원본 10개와 당시 bridge 정보를 기록한다. 원본은 `.txt`로 보존하며 SHA-256으로 대조할 수 있다. 원본을 보존했다는 사실이 해당 항목의 이관·제거 완료를 뜻하지 않는다.

이번 1번에서 `runbooks/README.md`와 `workflows/README.md`의 유효한 의미·현재 진입을 Project와 경로별 guide에 통합하고 옛 현재 경로를 제거했다. 이어 2번에서 `check-docs`·`doc-save`·`doc-discuss`·`doc-refactor` 네 문서 관리 command도 현재 경로에서 제거했다. 3번에서 PR 작성 방법은 development의 조건부 reference로 통합하고 사용자의 후속 요청에 따라 generate-pr와 남은 commands 안내도 현재 경로에서 제거했다. 4번에서 deprecated noline-work의 원본·Codex bridge·발견 기대값을 제거했다. 삭제 직전 판본은 기존 보존본에서 1번의 현재 진입 설명 한 문장만 바뀐 상태였으며 commit 528a5fb에서 복구할 수 있다.

`unadopted-drafts/`는 Main이 앞서 작성했지만 사용자가 채택하지 않은 문서 관리·PR runbook 초안이다. 원본 제품 지침과 구별하며, 채택된 절차나 완료 근거로 사용하지 않는다. 각 초안의 당시 바이트와 SHA-256은 그 폴더의 manifest가 보존한다.

현재 적용 결과와 검증 한계는 Workspace 006의 `output/ticket-10-part-01-result.md`와 `output/ticket-10-part-02-result.md`, `output/ticket-10-part-03-result.md`, `output/ticket-10-part-04-result.md`가 설명한다. 이 보존물을 현재 본문의 필수 읽기로 연결하지 않는다.

추가 사용자 요청으로 제거한 Noline agent 3종의 Claude·Codex 정의 6개는 `retired-agents/`에 원문과 SHA-256 manifest를 보존한다. 현재 실행 정의로 사용하지 않는다.
