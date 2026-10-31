# 개발 수행 스킬과 옛 실행 경로의 전환

2026-10-30 사용자는 미설치 development와 옛 스킬의 정리 누락을 지적한 뒤,06-01·06-02 티켓을 보완하고 Maintain에서 분리 가능한 부분을 먼저 반영하도록 요청했다.

Reference의 development·improvement-loop를 설치하고 work-discussion의 충분성 판단·요청별 반환, create-context-workspace의 대상 확인·의미 구성·인수를 보완한다. Noline의 제품 불변식·경로별 지침과 더 엄격한 규약, 기존 agent의 report-only 권한은 유지한다. 신규 설치를 기존 agent의 구현 쓰기 권한으로 해석하지 않는다.

준비된 Work의 실제 갱신 담당과 생성·전환은 기존 Main·Maintain 계약을 따른다. 자동 Maintain·hook·설정·수집기·activation·Workspace schema·Recover 선택은 이번에 바꾸지 않는다. prototype의 Main 직접 기록·수동 demo 계약은 그대로 덮어쓰지 않고 현재 Owner로 적응한다.02에서 새 계약이 채택되면 해당 연결을 다시 대조한다.

read-project-context는 USAGE, update-project-context는 context-update, work-artifact-briefing·explanation-recovery는 explain으로 전환한다. 앞선 부분 반영의4개 호환 스킬·bridge는 현재 검사 목록과001의 evidence 경로, 관련 현재 진입·역사 링크를 정리한 뒤 제거한다. [이전 결정](2026-10-30-context-and-explanation-refresh.md)의 임시 호환 유지 판단에서 이 범위만 대체한다. [당시 원문 보존판](../_archive/skill-transition-2026-10-30/README.md)은 이전 commit `4fb309d2ba50afaca44019879d7161964b9b2328`를 보존한다. Decision의 역사 링크는 보존판으로 연결한다. append-only인 Workspace002 기록2개는 원문을 바꾸지 않고, 검사에서 정확한 원문·옛 target·보존판의 고정 해시를 대조한다. 일반 missing link 검사를 끄거나 당시 선택·검증 결과를 최신 사실로 고치지 않는다.

001 verify.json은 제거된 스킬 입력을 새 현재 입력으로 옮긴다. schema·claim·argv·실행 제한은 보존한다. 과거 receipt·status를 재작성하거나 fresh로 만들지 않는다. 이번 추가 목록은 전체 동적 링크 검사 입력의 closure를 완성했다는 보장이 아니며 durable Verify는 실행하지 않는다.

reconsider-work는 재판단 역할, start-app은 Noline 실행 역할을 유지한다. noline-work는 [2026-09-10 결정](2026-09-10-deprecate-noline-work.md)의 원본·bridge 보존을 유지하며 실행하지 않는다.

실제 적용·검증의 정본은 [Workspace001 결과](../../context/work/workspaces/001-noline-context-harness-application/records/2026-10-30-02-development-skill-transition.md)에서 찾는다. 설치·정적 확인과 실제 host 발견·호출·운영 효과를 구별하며 통합 테스트는02 후속이다.
