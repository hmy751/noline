# 결정 기록: 하네스 실행 정리

> Date: 2026-05-06
> Status: Accepted
> 범위: Noline AI/developer 하네스 실행 단계

## 배경

`docs/noline-harness-restructure`와 `docs/harness-doc-prune`가 main에 병합되면서 Noline의 하네스 레이어 모델은 이미 정리되었다. 하지만 미병합 reference 브랜치, 깨진 worktree, 오래된 `implementation/` 추적표, 오래된 `references/` 자료 때문에 현재 상태가 덜 끝난 것처럼 보였다.

## 결정

- stale local unmerged branch는 삭제하고 새 브랜치 `docs/harness-execution-cleanup`에서 진행한다.
- `.claude/implementation/`은 active/evidence 디렉터리에서 제거하고, 기존 v3 추적표와 테스트 시나리오는 `.claude/_archive/implementation/`에 보존한다.
- `.claude/references/`는 active surface에서 제거하고, PRD/wireframe/image guide는 `.claude/_archive/references/`에 보존한다.
- 루트에는 이번 실행 패스의 진행 계획인 `NOLINE_HARNESS_EXECUTION_PLAN.md`를 둔다.
- 반복 검증을 위해 `pnpm harness:check`를 추가한다.

## 영향

- active startup path는 root/workspace guides, rules, guards, runbooks, context로 더 좁아진다.
- v3 구현 완료율 같은 오래된 체크리스트는 history로만 읽는다.
- 다음 하네스 변경자는 `pnpm harness:check`로 bridge/link/legacy surface를 먼저 검증할 수 있다.

## 하지 않는 일

- runtime code 변경 없음.
- `.codex/`, `.agents/`, `.claude/agents/`, `.claude/skills/` 생성 없음.
- decisions, sessions, audits, changelog의 history를 현재 정책처럼 재작성하지 않음.
