# Decision: Workspace Guide Harness Contract

> Date: 2026-05-06
> Status: Accepted

## Context

Noline의 하위 `CLAUDE.md` 파일들은 `apps/client`, `apps/server`, `packages/schema`, `packages/ui` 작업을 시작할 때 유용했지만, 시간이 지나면서 긴 구현 참고서와 교육 자료에 가까워졌다.

이 상태에서는 AI 작업자가 작업 시작 전에 너무 많은 내용을 읽거나, 오래된 예시를 현재 정책처럼 받아들이거나, 이미 `rules/`, `runbooks/`, `context/`가 소유하는 정책을 workspace guide에 다시 복사할 위험이 있다.

## Decision

- 하위 `CLAUDE.md`는 path-scoped harness entrypoint로 둔다.
- 같은 폴더의 `AGENTS.md`는 sibling `CLAUDE.md`를 가리키는 bridge symlink이며 별도 정책 원천이 아니다.
- workspace guide는 작업자가 바로 알아야 할 책임 경계, 먼저 읽을 rule/runbook/context, high-risk check, command, update rule만 소유한다.
- 긴 feature 설명, 교육용 예시, 디버깅 사례, 오래된 구현 이력은 `context/`, `sessions/`, `_archive/`가 소유한다.
- `noline-work` skill이 path별 workspace guide 진입 기준을 소유한다.
- `pnpm harness:check`가 workspace guide contract와 line-count guardrail을 확인한다.

## Consequences

- 하위 workspace guide는 짧아지고, 상세 맥락은 기존 owner 문서로 이동하거나 링크된다.
- 새 정책을 추가할 때 workspace guide에 복사하기보다 가장 작은 owner를 먼저 고르게 된다.
- guide가 다시 비대해지면 deterministic check가 실패한다.
- 과거의 긴 workspace guide 내용은 Git history와 기존 context/archive 자료로 보존되며, active startup surface에서는 제외된다.

## Non-Goals

- runtime code를 바꾸지 않는다.
- 모든 context 문서를 다시 쓰지 않는다.
- Claude command나 Codex agent 자동 실행 방식을 만들지 않는다.
