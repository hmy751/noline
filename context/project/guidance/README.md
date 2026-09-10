# Project guidance

이 폴더는 특정 종류의 Work에서만 반복해서 판단이나 행동을 바꾸는 Project-wide 지침을 소유한다. 각 지침은 적용 조건, 비적용 조건, 재검토 신호와 제거 조건을 밝혀야 한다.

## 현재 지침과 소비자

[설명과 근거 기준](explanation-and-evidence-criteria.md)은 사용자가 의미와 실제 근거의 관계를 이해하고 다음 판단을 만들 수 있게 하는 조건부 기준이다. 제품 의미·현재 구현·완료 판단의 정본을 대체하지 않는다. 적용 범위·재검토 신호·제거 조건은 그 본문이 소유한다.

- [work-discussion](../../../.agents/skills/work-discussion/SKILL.md): 명시 호출로 Work의 결과·선택을 구체화할 때 읽는다.
- [work-artifact-briefing](../../../.agents/skills/work-artifact-briefing/SKILL.md): 기존 작업물의 역할·연결·현재 상태·근거 범위를 조사해 설명할 때 읽는다.
- [explanation-recovery](../../../.agents/skills/explanation-recovery/SKILL.md): Project 사실·근거 범위·용어의 현재성이 앞선 설명의 뜻을 바꿀 때 읽는다. 대화만으로 충분하면 저장소를 먼저 읽지 않는다.

호출 조건과 실행·종료 방법은 각 스킬이 소유한다. [reconsider-work](../../../.agents/skills/reconsider-work/SKILL.md)는 이 기준의 consumer가 아니다. 모든 대화나 모든 Workspace의 Recover 입력에 이 지침을 자동으로 추가하지 않는다. 설명 스킬을 사용할 때 필요한 범위에서 읽는다.

## 추가·갱신·제거

새 guidance는 같은 조건에서 반복되는 판단 차이가 실제로 확인되고 `common/`의 제품 의미나 `current/`의 현재 사실만으로 해결되지 않을 때 추가한다. 적용 조건이 사라지거나 상위 canonical이 그 판단을 직접 소유하게 되면 제거하거나 해당 결정 기록으로 강등한다.

## 기존 Noline 실행 기준

[Rules](../../../.claude/rules/README.md), [Guards](../../../.claude/guards/README.md), [Runbooks](../../../.claude/runbooks/README.md)는 기존 작업·경로별 정책 Owner로 유지한다. 이 폴더의 설명 기준이 이들을 대체하거나 모든 작업의 필수 절차를 늘리지 않는다.
