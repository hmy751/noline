# Reference에 재개 안내와 직접 검사 연결을 적용했다

2026-11-04. 사용자는 prototype 반영을 커밋한 뒤, 재개 안내를 Reference에 반영하고 기존 Recover·Verify를 아카이빙하는 다음 작업에 “그래 진행해줘”라고 요청했다. [재개 안내 선택](2026-11-04-recovery-guide.md)과 [검증 방식 대조](../../../development/_background/records/2026-11-04-recovery-and-direct-verification.md)는 당시 prototype 선택의 근거로 보존한다.

## 이번 스킬 전환

- record-work는 사람용 `recover.md`를 허용된 수정 범위로 포함한다. 방향·단계·중심 과제·자료 위치 변화로 안내의 의미가 달라졌을 때 갱신하며, 유효한 안내를 매 호출 다시 쓰지 않는다.
- create-context-workspace는 새 README·current를 구성하면서 `recover.md`를 만들고 그 진입에서 인수를 확인한다. 예전 identity·Recover·Verify JSON과 machine status를 생성 선행 조건으로 요구하지 않는다. 기본 Workspace 선택은 collection의 안내를 따르고, 생성·이번 대화 배정·기본 선택 변경을 구별한다.
- development는 Work의 안내에서 이번 요청에 필요한 자료를 고른다. 검증의 요구·충분성·재검증은 기존 역할이 맡고, 실행에는 Project의 직접 검사와 실제 도구를 쓴다. 필요한 결과는 record-work에 연결하며 별도 Verify receipt나 machine 상태 갱신을 완료 요건으로 추가하지 않는다.

공통 재개 기준·본문의 역할·생성/전환은 [Work 지침](../../../../../context/work/AGENTS.md)과 [생성·전환 계약](../../../../../context/work/workspaces/CREATE-AND-TRANSITION.md)이 소유한다. 스킬별 본문에 같은 기준을 다시 정의하지 않는다. 원문·과거 기록·기존 receipt와 제품 코드·검사에 대한 보존 경계는 유지한다.

2026-10-30의 부분 적용 기록에 남은 기존 기계 계약 보존은 당시 선택이다. 이번 스킬 본문 전환이 이전 기록을 소급 변경하지 않는다. 현재 실행 방법은 각 SKILL.md와 대상 Work의 정본에서 찾는다.

이 기록은 스킬 연결 변경의 이유와 범위를 남긴다. 런타임의 실제 아카이브 위치·보존 대조·새 재개의 실행 확인은 Reference 전환 작업의 검증 기록으로 확인하며, 본문 수정만으로 실제 host의 자동 발견·원문 접근·장기 사용 효과를 입증하지 않는다.
