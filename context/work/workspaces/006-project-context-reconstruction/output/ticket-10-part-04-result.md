# Ticket 10 — 4번 옛 dispatcher와 agent 제거

2026-10-31 사용자는 `.claude/skills/noline-work`를 삭제하라고 했고, 이어 “.agent도 없애자”의 대상을 `.claude/agents`로 명확히 지정했다.

## 실제 결과와 책임

noline-work는 이미 deprecated였고 기능은 development·Project 기준과 경로별 guide에 있다. 원본과 agents/openai.yaml, Codex symlink를 제거하고 스킬 색인·루트·하네스·검사의 발견 기대값과 001 Verify 입력을 맞췄다. 기존 archive 원본은 manifest 해시와 일치하며, 삭제 직전 판본과의 차이는 1번에서 바꾼 현재 진입 설명 한 문장뿐이다. 삭제 직전 판본은 commit 528a5fb에서 복구할 수 있다.

`.claude/agents`의 context-collector·policy-checker·harness-observer 세 정의와 같은 역할의 `.codex/agents` 세 정의를 제거했다. 현재 설정은 이 3종을 등록하지 않고 Work의 workspace_context_maintainer만 등록하므로 해당 설정과 Maintain lifecycle은 유지했다. 현재 스킬 8종의 `.agents/skills` 연결도 유지했다.

제품 기준·위험 점검은 Project guidance, 맥락 선택과 구현·검토·검증 배정은 development가 맡는다. 옛 agent를 고정 실행자로 요구하는 안내를 제거하고 일반 역할의 권한 확인 책임은 보존했다. agent 정의는 [보존 manifest](../../../../../_archive/2026-10-31-project-context-reconstruction/ticket-10/retired-agents/manifest.json)와 6개 txt에 보존했으며 현재 읽기의 필수 경로로 연결하지 않는다. 006 조사 자료의 옛 observer 원문 링크만 보존본으로 교체했다.

## 확인과 다음 범위

원본·소비 경로를 대조했고 독립 개선 검토에서 중요한 누락을 찾지 못했다. 삭제 뒤 start-app 조건 설명의 어미가 잘못 남은 문장을 고쳤다. 별도 검증자는 실제 삭제, 6개 agent 보존본의 manifest·HEAD 원본 일치, noline-work 보존본과 528a5fb의 관계, 유지한 8개 skill bridge와 Codex 설정을 직접 확인해 불충족을 발견하지 않았다. 직접 재실행한 전체 검사도 기존 55건과 순서까지 같았다. 실행 중 host의 이미 로드된 역할·캐시 갱신 효과는 확인하지 않았다. 전체 검사에는 기존 역사 링크 실패 55건이 남아 있어 전체 Harness 통과나 제품·host 동작 완료를 주장하지 않는다. [검사 원본](ticket-10-part-04-check.txt)에서 기존 실패 목록·순서 동일, 새 실패 없음과 manifest 해시·경로 제거·구문·공백 검사를 확인했다.

Ticket 10의 정리 결과를 최종 기록하고 커밋한 뒤 다음은 Ticket 11 공유 실행 기준·도구 연결이다. 이 결과만으로 Ticket 11이나 006 전체 사용자 수락을 완료하지 않는다.
