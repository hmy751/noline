# 제품 context의 Owner와 하네스 읽기 경로 전환

2026-10-31. 채택된 Workspace 006 범위에 따른 문서 책임 전환 기록이다. 제품 정책을 새로 채택하거나 실행 역할을 개편한 결정은 아니다.

## 바꾼 책임

깊은 제품 의미·현재 구조·개발 기준과 필요한 선택 이유는 [Project](../../context/project/README.md)가 소유한다. 옛 `.claude/context`와 제품 결정에 필요한 뜻을 남겨 두고 링크만 갈아 끼우면 다음 작업이 다시 두 체계를 읽어야 한다. 따라서 유효한 이유·조건·비용을 새 본문과 형성 자료에 선별하고 옛 원본은 일반 읽기에서 제외했다. 호환 stub도 남기지 않았다.

`.claude`의 rules·guards·runbooks·skills·agents와 tool bridge는 실행 진입과 scoped 점검을 계속 맡는다. 이 디렉터리의 나머지 결정은 하네스 변경 이력이다. 이전 하네스 결정에 적힌 `.claude/context` 소유 관계는 당시 구조이며 현재 Owner를 되살리는 근거가 아니다.

개발 시작은 루트 START_GUIDE, 서버와 SQL 도구는 해당 README에서 실행 절차를 설명한다. 소개·실행 안내의 역할을 보존하고 같은 본문을 Project에 복제하지 않는다. Project 입구에서 이 Owner를 찾을 수 있게 했다.

## 보존과 확인 경계

현재 root·경로별 guide·rules·guards·runbooks·agent와 live Workspace consumer를 Project로 맞췄다. Claude/Codex agent는 읽을 자료의 경로만 함께 바꾸고 report-only 역할은 유지했다. 제품 시점과 달력 날짜의 구분도 두 policy checker가 같은 기준을 읽도록 맞췄다.

과거 Work 기록과 당시 source를 현재 정책처럼 재작성하지 않는다. 역사 링크의 누락과 현재 읽기 경로의 누락은 별개로 점검하며, 구조 검사 통과를 만들기 위해 옛 정본을 복원하거나 검사 범위를 완화하지 않는다. 세부 검증·원본 대응·남은 검사 한계는 [006 산출물](../../context/work/workspaces/006-project-context-reconstruction/output/index.md)에 남긴다.

새 제품 영역을 추가하거나 Owner를 다시 옮길 때는 Project 관리 계약에 따라 현재 본문·선택 이유·consumer와 실제 근거를 함께 대조한다.
