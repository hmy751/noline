# Decision: Deprecate noline-work

> Date: 2026-09-10
> Status: Accepted

## 배경과 결정

사용자가 코드베이스 분석 도중 `noline-work` 스킬을 deprecated 처리하도록 명시했다. 이 요청에 따라 스킬의 사용을 중단한다. 스킬의 효과나 다른 하네스 요소의 필요성까지 이번 결정으로 판정하지 않는다.

- `SKILL.md`의 description과 본문에 deprecated 상태와 실행 금지를 표시한다. 기존 본문은 이력으로 보존한다.
- Codex 호출 설정은 `allow_implicit_invocation: false`로 둔다. Claude/Codex가 공유하는 원본과 상대 symlink는 보존한다.
- root·workspace guide와 문서·skill 색인에서 현재 작업을 이 스킬로 보내는 연결을 해제한다. 필요한 기준은 기존 guide·rules·guards·runbooks·context에서 직접 찾는다.
- `harness:check`에서 이 스킬의 Team Workflow 본문과 workspace routing을 요구하던 검사를 해제한다. 스킬 파일·bridge, agent의 report-only 경계와 나머지 하네스 검사는 유지한다.

## 영향 범위

이 결정은 [실행층 결정](2026-05-06-harness-execution-layer.md)과 [workspace guide 계약](2026-05-06-workspace-guide-harness-contract.md)의 `noline-work` 사용·필수 연결만 대체한다. 과거 decision·audit·Workspace 증거는 당시 기록으로 유지한다.

제품 코드·정책 Owner, report-only agents, 다른 운영 스킬과 Maintain 연결은 이번 변경의 대상이 아니다. 새로운 공통 dispatcher나 workflow는 만들지 않는다.
