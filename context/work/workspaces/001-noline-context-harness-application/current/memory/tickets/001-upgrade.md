# 최신 Context Harness 보완

## 맡은 결과와 범위

기존 설치에서 최신 Project layer·Decision, Spec·Ticket, Recover·Maintain과 여섯 운영 skill을 사용할 수 있게 한다. 기존 사용자 작업·Noline 제품 및 도구별 연결을 유지한다. 범위와 보존 조건은 Spec을 따른다.

## 실행 맥락과 접근

Source `87d2102`와 target `b4ed41f6`에서 시작했다. 현재 detailed `.claude` Owner를 옮기지 않고 Project layer에 필요한 사실을 재서술한다. 최신 실행 계약은 원본 책임 파일을 가져오고 Noline 전용 Claude adapter와 기존 bridge를 보존한다. 이전 설치는 `f0bada9`를 사용했다. 이전 일회성 준비물은 사라져 fresh preflight를 다시 확보했다.

## 완료 조건과 확인 방법

관련·전체 Harness tests, bridge·링크·skill checks, explicit/default Recover, Verify 입력 범위와 후속 freshness, 보호 대상 hash를 대조한다. 이식 의미와 보존을 독립 reviewer가 확인한다. 실제 host discovery·activation과 제품 acceptance는 별도 확인이다.

## 현재 상태와 실제 결과

최신 파일과 문서 전환을 적용했다. 관련 63 tests·구조 검사·explicit/default Recover와 skill 정적 검사가 통과했다. 전체 122 tests는 첫 실행에서 timeout timing failure 1건, source snapshot 재실행에서 전부 pass였으며 두 결과를 보존했다. Main이 회수한 독립 reviewer는 target 내용·보존·Recover·최종 입력 closure의 actionable P1/P2가 없다고 보고했다. 보호 대상은 fresh preflight의 기존 untracked 18개 entry다. 최종 Verify 사건은 machine cursor에서 확인하며 사람 수락은 Main 검토를 따른다. 적용·실행 결과는 [2026-09-09 적용 기록](../../../records/2026-09-09-01-reference-upgrade.md)에 남긴다. 실제 host·제품 acceptance와 Workspace 완료를 뜻하지 않는다.
