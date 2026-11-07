# Work context

Work는 작업별 Workspace의 목표·현재 상태·입력·선택한 산출물·과정 기록과 이를 읽고 관리하는 관계를 소유한다. Project 공통 의미와 제품 코드는 이 층에 복제하지 않는다.

| 구성 | 책임과 진입 |
| --- | --- |
| [Workspace collection](workspaces/README.md) | 작업 목록·기본 선택과 current·source·output·records의 보존 경계 |
| [Work 지침](AGENTS.md) | 요청에 맞는 재개와 `recover.md`의 구성·갱신 기준 |
| [Spec·Ticket](workspaces/spec-and-tickets/README.md) | 작업 정의·개별 실행·전체 상황과 작성·갱신 기준 |
| [record-work](../../.agents/skills/record-work/SKILL.md) | 필요할 때 같은 기록 담당자를 호출해 원문 판단·직접 갱신을 수행 |
| [생성·전환](workspaces/CREATE-AND-TRANSITION.md) | 독립 목표의 초기 구성·재진입 확인·작업 대상 전환 |

Main은 작업을 조율하고 기록 담당자는 지정 Work의 문서를 갱신한다. 기록 내용은 [문서 작성 기준](workspaces/DOCUMENT-WRITING.md)을 따른다. Workspace README에서 `recover.md`를 찾아 필요한 본문을 직접 읽고, 검증은 [제품 검사](../../CLAUDE.md#코드-영역과-경로별-가이드)와 development의 근거 판단으로 수행한다.

## Root 관계

- Project root: `../..` — 제품·Project 맥락·검증 실행의 기준.
- Work root: 이 디렉터리 — Workspace 목록·재개 안내·current·source·output·records의 기준.

상위 관계는 [context](../README.md), AI 작업 지침은 [AGENTS](AGENTS.md)에서 시작한다. 기존 Recover·Verify 실행기와 기계 계약은 활성 경로에서 내려갔으며 [전환 기록](workspaces/001-noline-context-harness-application/records/2026-11-07-work-record-and-resume.md)에서 보존 위치와 대체 관계를 찾는다. 기존 기록·receipt는 당시 근거로 남고 새로운 재개나 완료의 필수 조건이 되지 않는다.
