# 유지할 결정과 제약

- root `CLAUDE.md`와 `.claude`의 rules·guards·runbooks·context·decisions는 계속 Noline의 상세 Owner다. `context/project/`는 이를 대체하지 않는다.
- root `AGENTS.md`와 workspace `AGENTS.md` symlink, 기존 `noline-work` skill과 `noline-*` report-only agent는 보존한다.
- 새 `create-context-workspace` skill은 `.claude/skills/`를 원천으로 두고 `.agents/skills/`에서 symlink로 연결한다. 최초 이식의 첫 Workspace는 이 skill이 아니라 apply 책임이 직접 만들었다.
- 새 Codex·Claude Code session은 default-unbound다. active index, `.codex/maintain.json`, Project 기본값이나 대화 주제로 binding을 추론하지 않는다. Claude wrapper는 SessionStart가 전달한 session selector 또는 explicit `--session-id`만 사용한다.
- `.codex/maintain-runtime/`과 `.claude/maintain-runtime/`은 사용자와 Main 대화 원문을 포함할 수 있는 host별 민감 ignored local runtime이다. Workspace records나 source에 복제하거나 commit하지 않는다.
- Verify receipt는 구조 검증 명령의 실행 사실만 기록한다. 사람 acceptance, 제품 완료 또는 actual host event delivery를 뜻하지 않는다. 현재 Claude adapter의 semantic runner는 Codex implementation을 재사용하며 Claude-native semantic runner를 뜻하지 않는다.
- target branch, 제품 코드, 외부 시스템, existing runtime, target commit과 staging은 사용자의 별도 권한 없이는 바꾸지 않는다.
