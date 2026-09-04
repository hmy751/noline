# Noline Context Harness 최초 적용

## 기준과 대상

- Reference source commit: `f0bada9a0398e19721ae252b5e283eeed7e33237`
- Reference 상태: `reference-project/`에 staged·unstaged diff 없음
- Target baseline: `74926b8e33f87c04ec11a25991733f1b8bc3cbdc` (`refactor/codebase-audit-2026-05-11`), preflight 당시 dirty entry 없음
- Preflight receipt: [`preflight JSON`](receipts/preflight/preflight-20260904T035945230719Z-b9ccb26968c24cd8b20f1de6e5413785.json)

## 책임별 적응

- Project common context는 root README·CLAUDE, `.claude/context`, rules·guards·runbooks, decisions와 code Owner를 이동하지 않고 `context/project/`에 공통 판단에 필요한 내용으로 재서술한다.
- Work context와 Workspace collection은 같은 root `context/work/`에 두고, 첫 Workspace는 제품 기능이 아니라 이식 자체의 goal·제약·상태·source·output·records를 소유한다.
- Recover·Maintain·Verify·validation code와 tests는 Reference commit의 stdlib Python implementation을 가져온다. Noline 제품 code와 product test는 payload가 아니다.
- `create-context-workspace`는 Noline의 기존 Claude-source/Codex-symlink bridge 규칙에 맞춰 `.claude/skills/`에 source를 두고 `.agents/skills/`에서 연결한다.
- Maintain config·wrapper·hook은 설치하지만 schema v2 explicit admission으로 둔다. target-root Codex task의 trust와 session별 explicit activation 전에는 `activation_pending`이다.

## 의도적으로 제외한 것

Reference sample 제품, sample Workspace 내용·receipt, `src/`·`tests/` 제품 code, Noline의 기존 rules·guards·runbooks·agent 정의, 제품 동작 수정, current session activation, actual-host hook trust, target stage·commit과 사람 acceptance는 이 적용에 포함하지 않는다.

## 검증 계획과 상한

Noline package script가 호출하는 `scripts/check-harness.mjs`, copied Harness unit/validation test, bounded Recover, config parse와 unbound wrapper status를 확인한다. 현재 Codex pnpm runtime은 dependency 재설치를 no-TTY에서 중단하므로 Verify는 같은 Node script를 고정 argv로 직접 실행한다. 이 결과는 Noline 앱의 iOS·네트워크·외부 서비스 동작, actual hook event delivery·UI notice, 자동 skill discovery와 사람 acceptance를 대신하지 않는다.
