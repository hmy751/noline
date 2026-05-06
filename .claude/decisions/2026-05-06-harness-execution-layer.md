# 결정 기록: 하네스 실행층 추가

> Date: 2026-05-06
> Status: Accepted
> 범위: Noline AI/developer execution harness

## 배경

`rules/`, `guards/`, `runbooks/`, `context/` 레이어는 읽는 경로를 정리했지만, 실제 작업자가 반복 작업을 시작할 때 어떤 자료를 고르고 어떤 report-only 점검을 붙일지 실행층이 부족했다. 이전 정리 커밋의 `pnpm harness:check`는 deterministic 구조 검증에는 유용하지만, 작업 유형별 context 수집과 policy drift 점검을 대신하지 않는다.

`blog` repo는 skill을 dispatcher로 두고 agent를 report-only 실행자로 분리한다. `dev-hub`도 프로젝트 특화 skill/agent는 얇게 유지하고, 공통 골격은 글로벌로 승격한 뒤 로컬 프로필만 남긴다.

2026-05-06 기준 공식 문서도 같은 방향을 가리킨다.

- OpenAI Codex: `AGENTS.md`는 계층적으로 읽히고, skill은 재사용 workflow 형식이며, subagent/custom agent는 병렬·전문화 작업에 적합하다.
- Anthropic Claude Code: project command/skill/agent/hook은 역할이 다르며, hook은 LLM 선택에 맡기면 안 되는 deterministic enforcement에 적합하다.

참고한 현재 문서:

- [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills)
- [OpenAI Codex Subagents](https://developers.openai.com/codex/subagents)
- [Anthropic Claude Code Skills](https://code.claude.com/docs/en/slash-commands)
- [Anthropic Claude Code Hooks](https://code.claude.com/docs/en/hooks-guide)

## 결정

- `.claude/skills/noline-work/`를 Noline 작업 dispatcher로 추가한다.
- `.agents/skills/noline-work`는 `.claude/skills/noline-work` 원천을 가리키는 Codex bridge로 둔다.
- 아래 report-only agent를 Claude/Codex 양쪽 형식으로 추가한다.
  - `noline-context-collector`: 작업 단위의 관련 자료 context card.
  - `noline-policy-checker`: 구현 변경 뒤 high-cost policy drift 점검.
  - `noline-harness-observer`: 하네스/bridge 변경 뒤 layer placement와 parity 점검.
- `pnpm harness:check`가 실행층 파일과 bridge parity를 검증하게 한다.

## 비목표

- runtime code 변경 없음.
- Claude command를 Codex command로 자동 변환하지 않는다.
- hook/config enforcement는 아직 추가하지 않는다. 지금 필요한 deterministic 검증은 `scripts/check-harness.mjs`가 맡는다.
- agent에 정책 본문을 축적하지 않는다. 정책 본문은 rules/guards/runbooks/context가 계속 소유한다.

## 후속 점검

- 실행층이 커지면 먼저 owning doc으로 내용을 돌려보내고, agent는 읽을 자료와 출력 형식만 남긴다.
- 실제 반복 사용 없이 새 agent를 늘리지 않는다.
- 하네스 변경 뒤에는 `pnpm harness:check`로 bridge와 parity를 확인한다.
