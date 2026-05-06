# Noline AI Harness

이 문서는 Noline의 AI/developer 지침이 어디에 있고 어떤 책임을 갖는지 정의한다. 새 규칙집이 아니라 지도이며, 기존 `.claude` 자료를 지우지 않고 읽는 경로를 정리하는 것이 목적이다.

## 목적

Noline에는 Selective Local-First, Policy Layer, sync, time, schema, UI 패턴을 다루는 상세 문서가 이미 많다. 하네스의 역할은 루트 가이드를 계속 비대하게 만드는 것이 아니라, 작업 시점에 필요한 맥락을 빠르게 고르게 하는 것이다.

## Claude/Codex Bridge

- `CLAUDE.md`는 사람이 읽는 로컬 프로젝트 가이드의 원천이다.
- `AGENTS.md`는 Codex가 같은 가이드를 읽기 위한 bridge다. 두 번째 원천이 아니다.
- 루트 `AGENTS.md`는 루트 `CLAUDE.md`를 가리킨다.
- 주요 workspace의 `AGENTS.md`도 같은 폴더의 `CLAUDE.md`를 가리킨다.
  - `apps/client/`
  - `apps/server/`
  - `packages/schema/`
  - `packages/ui/`
- 새 주요 workspace에 로컬 `CLAUDE.md`가 생기면, Codex도 그 지침을 계층 컨텍스트로 봐야 할 때만 `AGENTS.md -> CLAUDE.md` symlink를 추가한다.
- `.claude/commands/`는 Claude command reference다. Codex command나 rule로 자동 포팅하지 않는다.

## Layer Ownership

| Layer | Owner | Role |
| --- | --- | --- |
| Root guide | [../../CLAUDE.md](../../CLAUDE.md) | 프로젝트 정체성, 빠른 탐색, 핵심 불변식, 상세 문서 포인터 |
| Workspace guides | `apps/*/CLAUDE.md`, `packages/*/CLAUDE.md` | app/package별 구현 규칙 |
| Document map | [../README.md](../README.md) | `.claude` corpus의 역할과 읽는 순서 |
| Core docs | [../core/](../core/) | 오래 유지되는 아키텍처와 cross-cutting engineering policy |
| Feature docs | [../features/](../features/) | 기능별 동작, edge case, 구현 메모 |
| Guards | [../guards/](../guards/) | Router, transaction, schema-first, Client-Side ID, ISO time 같은 보호 정책 지도 |
| Workflows | [../workflows/](../workflows/) | 반복 작업별 시작 순서, 관련 guard와 source 문서 포인터 |
| Commands | [../commands/](../commands/) | Claude command reference와 문서 관리 workflow |
| Decisions | [../decisions/](../decisions/) | 정책, 용어, 하네스 구조가 왜 바뀌었는지 |
| Audits | [../audits/](../audits/) | 문서 품질 검증과 하네스 점검 evidence. active policy가 아님 |
| Implementation/sessions | [../implementation/](../implementation/), [../sessions/](../sessions/) | 작업 이력과 증거. 기본값은 active policy가 아님 |
| References/archive | [../references/](../references/), [../_archive/](../_archive/) | 원천 자료와 과거 맥락. 명시 요청 없이 현재 정책처럼 수정하지 않음 |

## 하네스 변경 규칙

1. 새 규칙은 담을 수 있는 가장 작은 owner에 둔다.
2. 루트 `CLAUDE.md`는 탐색용으로 유지한다. 모든 상세 패턴을 루트로 끌어올리지 않는다.
3. 한 번의 디버깅 세션에서 생긴 불편을 바로 일반 규칙으로 승격하지 않는다. 반복되거나 비용이 큰 실패일 때만 하네스화한다.
4. reference project에서 영향을 받았다면 표면 형식을 복사하지 말고 Noline의 역할 모델로 번역한다.
5. 로컬 agent나 skill을 만들더라도 얇게 둔다. 기준 본문은 owning docs가 소유하고, agent/skill은 어떤 문서를 읽고 어떤 report나 patch plan을 반환할지만 맡는다.
6. 이후 작업 방식에 영향을 주는 하네스 변경은 [../decisions/](../decisions/)에 기록한다.

## 현재 범위

이번 개편에서 하는 일:

- `.claude` document map 추가
- guard/workflow map 추가
- `AGENTS.md -> CLAUDE.md` bridge 추가
- active guide의 현재 코드와 충돌하는 표현 정리
- legacy-heavy active guide는 원문을 `_archive/`에 보존하고 현재 경로를 짧은 guide로 재작성
- 루트 `CLAUDE.md`는 destination layer가 준비된 뒤 마지막에 축약

이번 개편에서 하지 않는 일:

- 기존 문서 삭제
- history/session/archive의 오래된 용어 전면 정리
- Claude command를 Codex command로 자동 변환
- 로컬 agent/skill 즉시 생성
- runtime code 변경

## 향후 후보

아래는 아직 active tool이 아니라 후보 목록이다.

- `noline-context-collector`: feature/bug 단위로 관련 코드, 문서, decision, 최근 커밋을 모아 compact card를 반환하는 report-only collector.
- `noline-policy-checker`: Router, `withTransaction`, `generateId`, schema-first, ISO time, auth ownership, soft delete 정책 drift를 보는 report-only checker.
- `noline-harness-observer`: 큰 하네스 변경 뒤 구조 drift를 보는 report-only observer.

반복 사용으로 모양이 충분히 안정된 뒤에만 만든다. 그 전에는 이 하네스 지도와 기존 문서를 함께 사용한다.
