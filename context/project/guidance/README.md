# Project guidance

이 폴더는 관련 작업에서 지킬 구체적인 계약과 그 이유, 판단·적용·검증 방법을 담는 작업 가이드를 소유한다. 새 기능뿐 아니라 수정·리팩터링·조사에서도 선택할 수 있다. 필요하면 실행 순서나 실패 대응을 포함하지만 조언이나 순서에 한정하지 않는다.

여러 API가 함께 지킬 개발 계약도 관련 가이드의 본문이 될 수 있다. 제품·데이터 의미 자체를 소유하는 [common](../common/README.md)과의 차이는 상세함이 아니라 주 책임이다. 본문은 적용할 작업, 중요한 예외와 다시 확인할 조건을 설명하고, 필요한 제품 전제는 짧게 이어 쓴다.

## 현재 지침과 소비자

[설명과 근거 기준](explanation-and-evidence-criteria.md)은 사용자가 의미와 실제 근거의 관계를 이해하고 다음 판단을 만들 수 있게 하는 조건부 기준이다. 제품 의미·현재 구현·완료 판단의 정본을 대체하지 않는다. 적용 범위·재검토 신호·제거 조건은 그 본문이 소유한다.

- [work-discussion](../../../.agents/skills/work-discussion/SKILL.md): 명시 호출로 Work의 결과·선택을 구체화할 때 읽는다.
- [work-artifact-briefing](../../../.agents/skills/work-artifact-briefing/SKILL.md): 기존 작업물의 역할·연결·현재 상태·근거 범위를 조사해 설명할 때 읽는다.
- [explanation-recovery](../../../.agents/skills/explanation-recovery/SKILL.md): Project 사실·근거 범위·용어의 현재성이 앞선 설명의 뜻을 바꿀 때 읽는다. 대화만으로 충분하면 저장소를 먼저 읽지 않는다.

호출 조건과 실행·종료 방법은 각 스킬이 소유한다. [reconsider-work](../../../.agents/skills/reconsider-work/SKILL.md)는 이 기준의 consumer가 아니다. 모든 대화나 모든 Workspace의 Recover 입력에 이 지침을 자동으로 추가하지 않는다. 설명 스킬을 사용할 때 필요한 범위에서 읽는다.

## 추가·갱신·제거

관련 작업에 계속 필요한 계약·판단·적용이 생기거나 유효한 기존 기준을 복원할 때 [구성 기준](../REFERENCE/composition.md)과 [관리 계약](../MAINTENANCE.md)을 따른다. 기존 본문에 통합할지 별도 가이드로 둘지는 읽는 상황과 갱신 책임으로 판단한다. 주제를 잘게 나누거나 같은 계약을 독립적으로 복제하지 않는다.

적용 조건이 사라지거나 다른 canonical이 그 책임을 맡게 되면 현재 소비 경로를 맞추며 통합·이동·제거한다. 중요한 선택 이유만 남길 필요가 있으면 결정 기록과 연결한다. 모든 가이드에 같은 제거 조건 목차를 요구하지 않는다.

## 기존 Noline 실행 기준

[Rules](../../../.claude/rules/README.md), [Guards](../../../.claude/guards/README.md), [Runbooks](../../../.claude/runbooks/README.md)는 기존 작업·경로별 정책 Owner로 유지한다. 이 폴더의 설명 기준이 이들을 대체하거나 모든 작업의 필수 절차를 늘리지 않는다.
