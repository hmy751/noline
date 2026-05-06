# Noline AI Harness

이 문서는 Noline의 AI/developer 지침이 어디에 있고 어떤 책임을 갖는지 정의한다. 새 규칙집이 아니라 owner와 bridge 지도다.

## Purpose

Noline에는 Selective Local-First, Policy Layer, sync, time, schema, UI 패턴을 다루는 상세 문서가 이미 많다. 하네스의 역할은 루트나 tool-specific 폴더를 비대하게 만드는 것이 아니라, 작업 시점에 필요한 레이어를 빠르게 고르게 하는 것이다.

## Current Layer Model

| Layer | Owner | Role | Read mode |
| --- | --- | --- | --- |
| Root guide | [../../CLAUDE.md](../../CLAUDE.md) | 프로젝트 정체성, bridge, 빠른 탐색, 핵심 불변식 | Always-small |
| Workspace guides | `apps/*/CLAUDE.md`, `packages/*/CLAUDE.md` | app/package별 구현 규칙과 명령 | Scoped by path |
| Document map | [../README.md](../README.md) | `.claude` corpus의 역할과 읽는 순서 | Startup when touching docs |
| Rules | [../rules/](../rules/) | 짧고 검증 가능한 task/path 규칙 | Scoped by task/path |
| Guards | [../guards/](../guards/) | 데이터 손실, sync 누락, auth 누락 같은 고비용 실패 점검 | Before/after risky edits |
| Runbooks | [../runbooks/](../runbooks/) | 반복 작업의 시작 순서 | Task entry |
| Context | [../context/](../context/) | 깊은 아키텍처/기능 설명과 `core/`/`features/` 호환성 지도 | On demand |
| Commands | [../commands/](../commands/) | Claude command reference와 문서 관리 workflow | Claude reference only |
| Decisions | [../decisions/](../decisions/) | 정책, 용어, 하네스 구조가 왜 바뀌었는지 | Evidence |
| Audits | [../audits/](../audits/) | 문서 품질 검증과 하네스 점검 evidence | Evidence, not policy |
| Implementation/sessions | [../implementation/](../implementation/), [../sessions/](../sessions/) | 작업 이력과 증거 | History |
| References/archive | [../references/](../references/), [../_archive/](../_archive/) | 원천 자료와 과거 맥락 | Source/history |

`core/`와 `features/`는 이 패스에서 삭제하거나 대량 이동하지 않는다. 현재는 [context map](../context/README.md)이 깊은 맥락과 compatibility source로 연결한다.

## Claude/Codex Bridge

- `CLAUDE.md`는 사람이 읽는 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 Codex가 같은 가이드를 읽기 위한 bridge다. 두 번째 원천이 아니다.
- 루트 `AGENTS.md`는 루트 `CLAUDE.md`를 가리킨다.
- 주요 workspace의 `AGENTS.md`도 같은 폴더의 `CLAUDE.md`를 가리킨다.
  - `apps/client/`
  - `apps/server/`
  - `packages/schema/`
  - `packages/ui/`
- `.claude/commands/`는 Claude command reference다. Codex command나 rule로 자동 포팅하지 않는다.
- `.claude/rules/`의 Markdown은 현재 공통으로 읽을 수 있는 프로젝트 guidance지만 Claude-specific loader semantics를 뜻하지 않는다.
- `.codex/`, `.agents/`, `.claude/agents/`, `.claude/skills/`는 구체적인 반복 필요가 생길 때만 만든다.

## Bridge Rules

1. Tool-specific 파일은 common guidance를 가리키거나 얇게 적응한다.
2. Tool-specific 파일이 별도 정책 원천처럼 조용히 갈라지면 안 된다.
3. Claude/Codex 양쪽 버전이 생기면 equivalent, adapter, intentionally different 중 무엇인지 기록한다.
4. 새 agent/skill은 policy body를 복사하지 말고 어떤 문서를 읽고 어떤 산출물을 반환할지만 얇게 정의한다.
5. Bridge, agent, skill을 추가하거나 크게 바꾸면 최종 응답 전에 bridge drift 점검을 한다.

## Harness Change Rules

1. 새 규칙은 담을 수 있는 가장 작은 owner에 둔다.
2. 루트 `CLAUDE.md`는 탐색용으로 유지한다. 모든 상세 패턴을 루트로 끌어올리지 않는다.
3. 한 번의 디버깅 세션에서 생긴 불편을 바로 일반 규칙으로 승격하지 않는다. 반복되거나 비용이 큰 실패일 때만 하네스화한다.
4. Reference project에서 영향을 받았다면 표면 형식을 복사하지 말고 Noline의 역할 모델로 번역한다.
5. `rules/`는 짧고 검증 가능하게, `context/`는 깊은 설명을 보존하게, `runbooks/`는 실행 순서만 빠르게 유지한다.
6. 이후 작업 방식에 영향을 주는 하네스 변경은 [decisions/](../decisions/)에 기록한다.

## Current Pass

이번 개편에서 하는 일:

- `rules/`, `runbooks/`, `context/` 레이어 추가
- `core/`와 `features/`를 하네스 중심이 아니라 깊은 context/compatibility source로 재분류
- Claude/Codex bridge가 tool-specific 강제가 아니라 adapter 관계임을 명시
- root/document map/guard/runbook 링크를 새 레이어 중심으로 정리

이번 개편에서 하지 않는 일:

- 기존 문서 삭제
- runtime code 변경
- Claude command를 Codex command로 자동 변환
- `.agents/` 또는 `.codex/`를 모양상 생성
- 로컬 agent/skill 즉시 생성

## Future Candidates

아래는 아직 active tool이 아니라 후보 목록이다.

- `noline-context-collector`: feature/bug 단위로 관련 코드, 문서, decision, 최근 커밋을 모아 compact card를 반환하는 report-only collector.
- `noline-policy-checker`: Router, `withTransaction`, `generateId`, schema-first, ISO time, auth ownership, soft delete 정책 drift를 보는 report-only checker.
- `noline-harness-observer`: 큰 하네스 변경 뒤 구조 drift를 보는 report-only observer.

반복 사용으로 모양이 충분히 안정된 뒤에만 만든다. 그 전에는 이 하네스 지도와 기존 문서를 함께 사용한다.
