# 목표와 완료 경계

## 목표

Noline의 기존 `.claude` 정책 Owner와 Claude/Codex bridge를 유지한 채 Project common context, 첫 Workspace, Recover·Maintain·Verify·Harness validation과 Workspace 생성 skill을 설치한다. Codex와 Claude Code의 lifecycle entrypoint는 같은 explicit-unbound Maintain 계약에 연결한다.

## 완료 경계

- 새 `context/project/`가 Noline의 공통 제품 사실을 링크만이 아닌 실제 내용으로 설명한다.
- 새 `context/work/`와 첫 Workspace가 이식 작업의 현재 상태·source·output·records를 분리한다.
- Noline bridge check와 Claude adapter 단위 test가 설치 범위에서 통과한다. 전체 copied Harness suite의 inherited timing failure는 별도 proof ceiling으로 남긴다.
- Maintain은 설치되되 새 Codex·Claude Code session은 자동 binding하지 않으며 activation은 별도 사용자 선택으로 남긴다.

이 목표는 제품 코드의 correct behavior, 실제 Codex·Claude Code hook trust, UI delivery, 사람 acceptance, commit 또는 release를 완료로 주장하지 않는다.
