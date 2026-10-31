# 결정 기록: 하네스 레이어 모델

> Date: 2026-05-06
> Status: Accepted
> 범위: Noline AI/developer 하네스 구조

> Follow-up: [Decision: Harness Execution Cleanup](2026-05-06-harness-execution-cleanup.md) archives stale implementation trackers and adds `pnpm harness:check`.
> Follow-up: [Decision: Harness Execution Layer](2026-05-06-harness-execution-layer.md) adds the explicit skill/agent execution layer after the missing repeated need became clear.

## 배경

이전 restructure는 root guide, document map, guard map, workflow map, archive hygiene, `AGENTS.md -> CLAUDE.md` bridge를 추가해 문서 corpus를 더 안전하게 만들었다.

그 다음에도 `core/`와 `features/`는 여전히 하네스의 중심처럼 보였다. 하지만 실제로는 많은 파일이 startup policy라기보다 깊은 맥락에 가까웠다. 이 상태에는 두 가지 위험이 있었다.

- 오래된 구현 가이드가 항상 적용되는 현재 정책처럼 읽힐 수 있다.
- Claude/Codex bridge 작업이 "모든 것을 `.claude/` 아래에 넣자" 또는 "tool-specific folder에 전부 mirror하자"로 오해될 수 있다.

최근 도구 패턴도 같은 방향을 가리킨다. 시작 지침은 작게 유지하고, 구체적인 동작은 작업/경로별 규칙으로 두며, 깊은 맥락은 필요할 때 열고, 도구 adapter 사이에 정책을 중복하지 않는다.

## 결정

Noline 하네스에 아래 레이어 모델을 적용한다.

- Root `CLAUDE.md` / `AGENTS.md`: 작은 탐색 허브와 project invariant.
- Workspace guides: `apps/*`와 `packages/*`의 owner rule.
- `.claude/rules/`: 중요한 engineering choice를 위한 짧은 작업/경로별 규칙.
- `.claude/guards/`: 고비용 실패 지도와 마무리 점검 표면.
- `.claude/runbooks/`: 반복 작업 진입점.
- `.claude/context/`: 깊은 아키텍처, cross-cutting engineering context, 기능별 설명을 보존하는 owner.
- `.claude/decisions/`, `.claude/audits/`, `.claude/_archive/`: 근거, 검증, 오래된 source, history.

이번 패스에서는 기존 링크를 보존하고 현재 local harness surface를 존중하기 위해 공통 하네스 문서를 `.claude/` 아래에 둔다. 이것이 Claude 전용 동작을 공통 source of truth로 삼겠다는 뜻은 아니다.

구체적인 반복 도구별 필요가 생기기 전에는 `.codex/`, `.agents/`, local agent, local skill을 만들지 않는다. 2026-05-06 실행층 follow-up 이후에는 `noline-work`와 `noline-*` report-only agents가 그 예외를 소유한다.

## 브릿지 규칙

도구별 파일은 공통 프로젝트 지침을 적응하거나 가리킬 수 있지만, 조용히 별도 정책 원천이 되어서는 안 된다. 나중에 Claude와 Codex 양쪽 버전이 생기면 같은 내용인지, adapter인지, 의도적으로 다른지 하네스에 기록한다.

## 영향

- 새 작업 지침은 보통 `rules/` 또는 `runbooks/`에서 시작하고, 깊은 설명은 `context/`에서 찾는다.
- 예전 `core/`와 `features/` 파일은 link migration과 함께 `.claude/context/`로 이동했다.
- 기존 `workflows/` 경로는 호환성 자료로 남기고, `runbooks/`가 active repeated-task surface를 맡는다.
- 향후 agent/skill은 얇게 두고 owning docs로 되돌아가게 한다.

## 하지 않는 일

- runtime code 변경 없음.
- 기존 문서 대량 삭제 없음.
- Claude command를 Codex rule/command로 자동 변환하지 않음.
- 이 layer-model 패스 자체에서는 local Noline agent나 skill을 만들지 않음. 후속 실행층 결정은 별도 decision이 소유한다.
