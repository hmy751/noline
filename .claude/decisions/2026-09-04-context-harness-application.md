# Decision: Context Harness application

> Date: 2026-09-04
> Status: Accepted for this installation
> Scope: Noline의 Project/Work context와 Codex·Claude lifecycle adapter 연결

## Background

Noline은 이미 root guide, workspace guide, rules, guards, runbooks, deep context, execution dispatcher와 report-only agents를 분리해 두었다. 그러나 특정 작업의 current state·source·output·records를 bounded하게 복구하고, product common context와 작업 context를 분리해 지속시키는 구조는 없었다.

## Decision

기존 `.claude` Owner를 유지하고 root `context/`에 Project common context와 Work context를 별도 추가한다. Workspace는 선택한 Project 문서만 Recover하고, source·output·records·machine receipt를 분리한다. Reference의 stdlib Python Harness는 Noline root에서 작동하도록 가져오되, Workspace 의미·제품 기준·사람 판단을 소유하지 않게 한다.

새 Workspace 생성 skill은 Noline의 기존 bridge 모델에 맞춰 `.claude/skills/create-context-workspace/`를 source로, `.agents/skills/create-context-workspace`를 Codex symlink로 둔다. Maintain은 `.codex`에 설치하지만 default-unbound explicit admission을 유지한다.

## Scope and non-goals

- 기존 `AGENTS.md -> CLAUDE.md` bridge와 `noline-work`, `noline-*` report-only agents를 교체하지 않는다.
- `.claude/context/`를 root `context/project/`로 이동하거나 복제하지 않는다.
- 제품 코드, iOS·서버 runtime, 외부 서비스, target Git history를 변경하지 않는다.
- config 설치만으로 Codex 또는 Claude Code hook trust, session activation, response-end event delivery 또는 UI notice가 검증됐다고 주장하지 않는다.

## Follow-up checks

`pnpm harness:check`는 Noline bridge와 새 Context Harness entrypoint를 함께 확인한다. Python Harness tests와 bounded Recover는 local contract를 확인한다. 실제 Codex 또는 Claude Code target-root task에서 hook을 trust하고 선택한 session을 explicit activate한 뒤 같은 binding generation의 prompt/Stop receipt를 확인하기 전에는 Maintain 상태를 `activation_pending`으로 둔다.
