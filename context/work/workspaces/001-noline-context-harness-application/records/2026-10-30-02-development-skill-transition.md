# 개발 수행 스킬 반영과 옛 실행 경로 정리

2026-10-30 development·improvement-loop와 work-discussion·create의 비충돌 보완을 Reference에서 받아 Noline에 반영했다. 옛 읽기·갱신·설명4개의 실행 폴더와 bridge를 제거했다. **설치·정적/읽기 전용 확인의 결과이며 실제 host 호출·전체 workflow 효과 확인은 아니다.**

## 선택과 대상 적응

사용자는 미설치 development와 기존 제거 대상 누락을 지적한 뒤 “06-01, 06-02 티켓부터 실제 남은 작업에 맞게 보완하고, Maintain이랑 분리해서 지금 반영할 수 있는 것부터 진행해봐. 기존 합의 잘 지키고”라고 요청했다. 이전 부분 반영을 전체 전환으로 오해하지 않게 남은 범위를 먼저 바로잡았다.

[전환 Decision](../../../../../.claude/decisions/2026-10-30-development-skill-transition.md)에 역할별 적용·유지·제거의 이유를 남겼다. 개발 수행의 구현·검토·검증·수정·완료 기준과 개선 루프의 사용자 요청·선택·실제 반영·한정 시도 종료 강도는 유지했다. Work 기록은 현행 Main·Maintain 계약으로 적응하고 장치·hook·설정·수집기·generation/activation은 바꾸지 않았다. 기존 agent는 report-only로 유지한다.

Noline 생성 canonical의 관련 layer 선택 문장은 보존하고 USAGE를 통한 읽기 재사용·대상 확인·의미 구성·인수를 보완했다. Reference의 선택 순서를 그대로 덮어쓰지 않았다. 제품 불변식·path guide·rules·guards·runbooks, 더 엄격한 Noline 규약과 열린 제품 판단은 유지한다. reconsider-work·start-app을 유지하고 noline-work는 기존 명시 보존 결정대로 원본·bridge만 유지한다.

## 옛 실행 경로와 근거의 보존

읽기는 USAGE, 갱신은 context-update, 두 설명 역할은 explain으로 현재 참조를 옮겼다. 설치 파일64개, 삭제한 기존 파일/연결12개, 신규 bridge2개를 exact path로 대조했다. 옛4개 SKILL.md는 부분 반영 전 `4fb309d2`의 실제 Git blob을 [실행 목록 밖의 보존판](../../../../../.claude/_archive/skill-transition-2026-10-30/README.md)으로 남겼다. 이 판본이 모든 과거 기록 작성 시점의 파일과 같다고 보장하지 않는다.

004 current/output은 현재 접근 링크만 새 Owner로 옮겼다.002의 날짜별 기록2개는 원문을 보존하고 records 색인에 재접근 안내를 추가했다. 검사는 정확한 두 기록의 원문 해시·옛 target·보존판 고정 해시를 대조해 역사 참조라고 별도 표시하며, 현재 missing link는 그대로 실패시킨다. 과거 선택·검증 결과를 새 상태로 덮어쓰지 않았다.

001 verify.json의 변경은 evidence_paths뿐이다. 제거된 입력을 새 regular 입력으로 옮기고 직접 검사에서 읽는 보존판도 포함했다. schema·claim·argv·실행 제한·Recover 선택을 유지하고 기존 receipt·status를 재작성하지 않았다. 전체 동적 입력 closure 완성이나 freshness를 보장하는 변경은 아니며 durable Verify를 실행하지 않았다.

## 직접 확인

- 링크527개·앵커39개 누락 없음. 신규 bridge2개·기존 bridge drift와 실제 설치/삭제 경로를 확인했다. 두 대상의 스킬 frontmatter·호출 설정32개 parse 성공.
- checker의 역사 참조 처리: 정상2건 허용, 원문 변경·보존판 변경/누락·다른 현재 문서·다른 target의5건 거부.7개 assertion 통과. 독립 검증에서도 실제 함수를 읽기 전용으로 대조했다.
- `node scripts/check-harness.mjs`: 기존 깨진 링크8건이 변경 전과 동일하게 실패한다. 보존 역사 참조2건은 별도 출력하고 새 현재 링크 실패는 없다.
- 기본001·명시001 Recover는15개,002는20개,004는16개 context로 성공했다. Active index와 각 recover.json은 바꾸지 않았다.
- `python3 -B -m unittest discover -s context/work/harness -t . -p 'test_*.py' -q`:124개 중123개 통과. `test_timeout_covers_descendant_after_group_leader_exits`는 descendant.pid 생성 전 timeout으로1회 실패했다. 현재판 단독 실행과 동일 Git 기준판의 필요한 fixture를 갖춘 격리 실행은 각각 통과했다. 코드·테스트는 수정하지 않았으며 타이밍에 민감한 관찰로 남긴다. 전체124개 통과로 보고하지 않는다.
- 독립 검토가 실제 설치판과 prototype·기존 계약을 대조했다. 발견했던 검증 상세의 Maintain 배제 잔재, Noline 생성 계약 차이를 수정한 뒤 미해결 차단 결함은 찾지 못했다. 실제 host 통합 수행은 아니다.

## 보존·판본·남은 일

대상 기준은 `2839d467dfa999911385e1920fa482d0377dcbe5`다. Source는 ai-workspace `c23181d31bed4d32d54f59ff19933c9d93df58ff` 뒤 이번 Reference 변경이며 exact 파일 해시는 [적용 receipt](receipts/skill-transition/2026-10-30-application.json)에 있다. 적용 직후 범위 밖 기존34,618개 항목·artifacts1,055개가 기준선과 동일했다. 기존 `.gitignore`·`.pnpm-store/`, 제품·Maintain·수집기·receipt·status를 보존했다.

02가 채택할 기록·Work 생성/전환·Maintain 계약을 받아 해당 적응 부분을 다시 연결한다. 실제 skill discovery·호출·중복 표시·문서 기록·재개 통합은02에서 확인한다. 원문 접근·선택한 개선의 실제 사용·효과는 별도 미확인이다. 현재 구조 검사8개 링크 실패와 전체 검사에서의 시간 제한1회 실패를 숨기지 않는다. 이번 턴에는 stage·commit·push·제품 acceptance·Workspace 완료를 수행하지 않았다.

## 후속 커밋 요청

사용자가 이번 변경의 기록 정리와 Noline·ai-workspace 각각의 커밋을 요청했다. 위 적용·검증 결과와 이번 전환 파일만 같은 커밋으로 묶고, 기존 `.gitignore`·`.pnpm-store/`·artifacts와 범위 밖 변경은 제외한다. 적용 receipt는 검사 당시 파일 해시를 보존하며 이 커밋 요청 문단의 후속 추가와 구별한다. 실제 커밋 식별자는 이 문서를 포함한 Git 이력에서 확인한다. Push·제품 acceptance·Workspace 완료는 수행하지 않는다.
