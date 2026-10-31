# Ticket 11 — 공통 실행 기준과 host 연결 정리

2026-10-31. 스킬의 실제 수행·형성 자료와 소비 경로를 읽고, 내용을 유지하면서 공통 원본과 host 진입을 분리했다. 처음 남았던 실제 모델 명시호출은 후속 사용자 승인 뒤 실행해 양 host의 explain 본문 접근을 확인했다. 후속 독립 검증도 이 근거를 직접 대조해 이번 변경의 필수 호출 공백이 해소됐다고 판정했다. 실제 Work 상태 반영과는 구별한다.

## 실제 변경과 선택 이유

공통 스킬 8개와 references·형성 자료·공유 설명 기준·관리 정책의 96개 파일을 `.agents/skills` 실제 파일로 옮겼다. 기존 Codex의 개별 symlink 8개는 제거하고 Claude에는 `.claude/skills -> ../.agents/skills` 단일 연결을 뒀다. 새 공통 루트나 내용 사본을 만들지 않았다.

현재 배치는 공통 수행을 Claude 원본으로 설명하던 혼동과 개별 연결 관리 부담을 줄인다. `.agents` 역시 Codex의 발견 경로이므로 이름만으로 완전히 도구 중립이라고 주장하지 않는다. Claude의 디렉터리 symlink 지원에 의존하는 비용은 실제 설치 CLI의 격리 발견으로 확인했다.

[이동 대응·해시](ticket-11-source-migration.json)에서 93개는 바이트 동일하며, 차이가 있는 3개는 README의 원본 설명·보존 링크, 관리 정책의 적용 경로, PR 형성 기록의 archive 상대링크뿐이다. 실행 본문·호출 metadata·조건부 reference·work-discussion의 Main/Maintain 미완 전환 기록은 바꾸지 않았다. 공유 설명 기준의 consumer는 explain과 work-discussion 두 개로 유지한다.

현재 root·Project·Work/context 안내와 001 Verify evidence를 실제 canonical로 맞췄다. Verify의 입력은 모두 symlink component 없는 regular file이다. 새 receipt나 freshness는 생성하지 않았다. root AGENTS/CLAUDE bridge는 유지했다.

공통 Maintain 구현은 이미 Work에 있으므로 그대로 뒀다. 두 짧은 host wrapper는 host별 인자와 선택적 개인 collector 진입이 달라 이를 합치는 새 helper의 이득이 작다. host 설정·binding·guarded apply 의미와 개인 수집기 설치는 수정하지 않았다. harness의 불완전한 스킬 2개 목록은 실제 스킬 색인으로 통합했다.

구조 검사는 `.agents/skills` 정본·Claude 단일 연결, Codex의 7개 hook과 hooks 활성 설정·공통 role 경로까지 확인하도록 보완했다. 기존 Claude 핵심 연결 검사와 지원 호환 분기는 유지했다. 임시 fixture에서 hook 7개 누락·hook 비활성·role 오경로·정본 SKILL symlink가 실패하는지 확인했다.

## 확인 근거와 남은 필수 작업

[host 발견 발췌](ticket-11-host-discovery.json)는 설치된 Codex skills/list와 Claude SDK initialize가 격리 fixture의 스킬 8개를 모두 발견한 결과다. Claude의 현재 설정 형식으로 local stub의 SessionStart·SessionEnd도 관찰했다. stub 실행을 실제 Maintain 전체 수행으로 확대하지 않는다. 별도 검증자는 실제 저장소의 Codex read-only 목록에서도 8개 canonical 경로를 확인했지만 격리 사용자 설정을 쓴 결과이므로 기존 trust·설정 전체의 입증으로 취급하지 않았다.

[검사 원문](ticket-11-check.txt)에는 구조·구문·공백과 기존 Maintain adapter의45개 unittest 결과를 남겼다. 전체 Harness는 기존 역사 링크 등63건과 동일하게 실패했고 새 실패는 없다. 제품·실제 기기 테스트는 이번 연결 변경의 검증으로 수행하지 않았다.

독립 개선 검토는 현재 배치와 wrapper 유지가 타당하며 필수 구조 결함을 찾지 못했다. 별도 검증자는 원본 보존·발견·구조는 충족하나, Ticket의 핵심 호출 조건을 닫으려면 양 host 대표 명시호출로 실제 스킬 본문 로드를 확인해야 한다고 반환했다.

Main은 격리 fixture에서 읽기만 허용한 Codex/Claude 대표 explain 호출 시험을 준비했으나, 실행 전에 자동 승인 검토가 거절했다. 사유는 CLI의 스킬·지침이 외부 모델 서비스로 전달될 수 있고 사용량이 발생하는데 그 전송에 대한 구체적 사용자 승인이 없다는 것이다. 거절된 실행은 수행하지 않았으며 우회하지 않았다. 이후 외부 전송·사용량 안내를 받은 사용자가 “그래 된건가? 테스트 해봐”라고 요청해 같은 한정 시험을 재제출했고 자동 승인을 받아 실행했다.

후속 실행에서 Codex `$explain`과 Claude `/explain`은 모두 exit 0으로 끝났고 현재 원본의 name과 첫 H1을 정확히 반환했다. fixture와 실제 source 본문의 SHA가 같으며 Codex trace에는 agent_message와 turn 완료만 있고 명령 실행 항목은 없다. Claude는 Read만 허용했고 실제 반환은 오류가 아니다. [명시호출 근거 발췌](ticket-11-host-invocation.json)에 요청 범위·실제 반환·판본·한계를 보존했다.

별도 검증자는 fixture/source의 바이트·해시, 실제 모델 반환과 종료 결과를 직접 대조했다. H1은 발견 metadata에 없으므로 두 도구의 정확한 반환은 실제 본문 접근을 뒷받침하며, 기존 구조·보존 판정과 합쳐 이번 변경에 필요한 근거가 충분하다고 반환했다. Ticket 11의 이번 정리·검증 범위는 완료됐고 아직 커밋하지 않았다. 변경하지 않은 스킬 전체의 판단 효과, 실제 Noline의 Maintain 전체 host acceptance나 006 전체 완료까지 이 결과로 확대하지 않는다.
