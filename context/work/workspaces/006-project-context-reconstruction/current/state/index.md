# 현재 상태와 다음 행동

**Ticket 10의 1번인 제품 runbook·workflow 정리는 006의 이관 목표에 맞춰 적용됐다. 유효한 내용과 탐색 연결은 Project 본문·guidance·경로별 guide로 옮겼고 옛 제품 runbook과 workflow 호환 지도는 원본을 보존한 뒤 현재 경로에서 제거했다. Ticket 10 전체는 진행 중이며 다음 행동은 남은 2–4번을 적용·확인하는 것이다.** 01의 첫 조사와 02–09의 주제별 이관·통합·검토는 Main이 완료로 판단했다. 10–13의 남은 실행과 006 전체 사용자 수락은 남아 있다.

## 지금 이어갈 작업

[Ticket 10](../memory/tickets/10-development-and-document-workflows.md)은 runbooks·workflows·옛 commands·deprecated noline-work와 관련 skill을 현재 Project·Work 관리 계약에 대조한다.

1번에서는 기존 guidance가 이미 맡는 작업별 설명을 재사용하고 Entity 변경·동기화 조사·통화 helper처럼 부족한 내용과 탐색 연결만 보완했다. 루트·앱·패키지 guide와 관련 skill·agent·검사·live consumer 연결을 현재 Project 본문으로 전환한 뒤 제품 runbook과 workflows 호환 지도는 현재 경로에서 제거했다. 승인 전에 만든 문서 관리·PR 초안은 미채택 자료로 격리했다. 상세 범위와 근거는 [Ticket 10의 1번 결과](../../output/ticket-10-part-01-result.md)를 따른다.

남은 작업은 다음과 같다.

- `check-docs`·`doc-save`·`doc-discuss`·`doc-refactor`의 유효한 기능을 기존 skill·Project·Work 관리 계약에 연결하고 옛 호출 경로를 정리한다.
- `generate-pr`의 조건부 PR 제목·본문 작성 상세를 `development` 아래에서 Claude와 Codex가 함께 사용하도록 정리한다.
- deprecated noline-work의 원본·bridge·발견 설정과 남은 guide·검사 연결을 실제 최종 배치에 맞춘다.
- Ticket 10의 대표 요청에서 필요한 설명과 담당 경로를 찾을 수 있는지 확인하고, 정적 링크와 실제 도구 연결의 확인 범위를 구별해 남긴다.

그 뒤 기본 순서는 [11 공유 실행 기준·도구 연결](../memory/tickets/11-shared-execution-and-host-connections.md) → [12 남은 선택 이유·역사 자료](../memory/tickets/12-historical-reasons-and-reading-separation.md) → [13 전체 검증·종료 판단](../memory/tickets/13-integrated-verification-and-acceptance.md)이다.

## Ticket 10의 1번 결과와 확인 상한

Main은 제품 runbook과 workflows 호환 지도를 원본 보존 후 현재 경로에서 제거하고, 동기화 조사·통화 helper 기준을 Project 본문에 통합했으며 guide·skill·agent·검사 연결을 맞췄다고 보고했다. 별도 검토자는 이번 1번의 요구 충족 근거가 있다고 판정했다.

결과 기록에 따르면 변경 Markdown의 상대 링크·앵커, 기본·명시 Workspace Recover와 정적 검사를 확인했다. 실제 host에서 agent를 호출한 효과, 앱·DB·네트워크 동작, durable Verify receipt와 사용자 acceptance는 확인 범위가 아니다.

전체 harness 검사는 55건으로 실패했다. 기존 문제 52건과 옛 경로 제거로 드러난 역사 Workspace 003·004의 링크 3건을 구별하며, 역사 원문을 현재 기준으로 고쳐 통과시키거나 검사 기준을 완화하지 않았다. 역사 자료의 재접근·처리 판단은 Ticket 12와 13에 남아 있다.

Main은 Ticket 10의 2–4번 적용과 commit은 수행하지 않았다고 보고했다. 따라서 1번의 부분 결과를 Ticket 10 전체 완료나 006 acceptance로 해석하지 않는다.

## Ticket 09 결과와 계속 유효한 한계

[Ticket 09 결과](../../output/ticket-09-result.md)는 기존 rules·guards의 제품 규칙과 위험 점검을 Project 주제별 Owner에 통합하고 현재 소비 경로를 전환한 범위와 확인 한계를 설명한다. 제품 코드는 바꾸지 않았고 실제 앱·JWT·PostgreSQL·native SQLite 실행은 확인 범위가 아니다.

006 Verify는 JSON parse만 검사하므로 제품 의미 통합의 충분성이나 제품 동작을 입증하지 않는다. 데이터·지도·입력·접근/공개·금액·배포의 기존 제품 공백도 문서 이관으로 해결되지 않았다. 주제별 실제 산출물과 제품 차이는 [output 색인](../../output/index.md)에서 선택한다.
