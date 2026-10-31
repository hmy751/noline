# Project guidance

이 폴더는 관련 작업에서 지킬 구체적인 계약과 그 이유, 판단·적용·검증 방법을 담는 작업 가이드를 소유한다. 새 기능뿐 아니라 수정·리팩터링·조사에서도 선택할 수 있다. 필요하면 실행 순서나 실패 대응을 포함하지만 조언이나 순서에 한정하지 않는다.

여러 API가 함께 지킬 개발 계약도 관련 가이드의 본문이 될 수 있다. 제품·데이터 의미 자체를 소유하는 [common](../common/README.md)과의 차이는 상세함이 아니라 주 책임이다. 본문은 적용할 작업, 중요한 예외와 다시 확인할 조건을 설명하고, 필요한 제품 전제는 짧게 이어 쓴다.

## 현재 지침과 소비자

[작성·입력](writing-and-input/INDEX.md)은 초안·검색 후보·picker 임시값·저장 요청의 수명을 구별한다. 생성/수정과 부모의 닫기·재열기를 함께 보며 정책 제한·실패·복구에서 보존할 입력과 현재 차이를 설명한다.

[구조·UI·schema 개발 기준](development-boundaries/INDEX.md)은 계층 배치, 제한적 조회 재사용, UI 상태·간격·부작용과 공유 타입·런타임 검증을 구별한다. 현재 예외를 새 기본 규칙으로 넓히지 않으면서 관련 코드를 바꿀 때 읽는다.

[여행 접근과 화면 복구](travel-access/INDEX.md)는 네트워크 관측·Policy·조회 실행·캐시 표시·작성 중 입력 보존을 연결한다. 화면이나 조회를 바꿀 때 실제 조건·사용자 장면·실패 후 남는 값을 확인한다.

[데이터 저장·동기화·정리](data-lifecycle/INDEX.md)는 Local mutation·queue·push/pull·활성화·cleanup을 바꿀 때 읽는다. 보존 계약과 실제 상태 판정·완료 범위의 차이, 계정 종료와의 관계를 설명한다.

[오프라인 지도·경로](offline-maps-and-routes/INDEX.md)는 준비 결과·native pack과 metadata·일정 변경 뒤 경로의 관계를 설명한다. 다운로드·재사용·정리·표시를 바꿀 때 실제 자원과 완료 근거를 확인한다.

[동작을 보존하는 코드 리팩터링](behavior-preserving-refactoring.md)은 기존 동작을 유지하며 표현·흐름·책임과 여러 소비 지점의 수정 부담을 줄일 때 읽는다. 변경 전후의 동작 보존과 개선 효과를 따로 판단하고, mock·native·DB 등 검증 경계의 상한을 구별한다.

[API 계약과 변경 가이드](api-contracts.md)는 client API, server route, 공유 schema, serializer와 user scope를 추가·수정·리팩터링할 때 읽는다. Schedule·Expense·Trip의 실제 적용 차이, repository·query 경계와 인증 전송, 일반 조회와 sync의 soft-delete 차이를 설명한다.

[오류 전달과 공개 응답](error-handling.md)은 서버 처리·client 변환·React Query·Policy UI의 책임, 민감정보 미공개 기준과 현재 공백을 설명한다. 공개 형식·중앙화 선택을 바꿀 때 API 가이드와 함께 읽는다.

[공통 설명과 근거 기준](../../../.claude/skills/shared/explanation-and-evidence-criteria.md)은 사용자가 의미와 실제 근거의 관계를 이해하고 다음 판단을 만들 수 있게 하는 조건부 기준이다. 제품 의미·현재 구현·완료 판단의 정본을 대체하지 않는다. 적용 범위·재검토 신호·제거 조건은 그 본문이 소유한다.

- [work-discussion](../../../.agents/skills/work-discussion/SKILL.md): 명시 호출로 Work의 결과·선택을 구체화할 때 읽는다.
- [explain](../../../.claude/skills/explain/SKILL.md): 개념·코드·작업 결과·앞선 말의 의미와 선택 이유를 설명할 때, 현재성·실행 여부·근거 범위가 답을 바꾸면 읽는다.

호출 조건과 실행·종료 방법은 각 스킬이 소유한다. [reconsider-work](../../../.agents/skills/reconsider-work/SKILL.md)는 이 기준의 consumer가 아니다. 모든 대화나 모든 Workspace의 Recover 입력에 이 지침을 자동으로 추가하지 않는다. 설명 스킬을 사용할 때 필요한 범위에서 읽는다.

## 추가·갱신·제거

관련 작업에 계속 필요한 계약·판단·적용이 생기거나 유효한 기존 기준을 복원할 때 [구성 기준](../REFERENCE/composition.md)과 [관리 계약](../MAINTENANCE.md)을 따른다. 기존 본문에 통합할지 별도 가이드로 둘지는 읽는 상황과 갱신 책임으로 판단한다. 주제를 잘게 나누거나 같은 계약을 독립적으로 복제하지 않는다.

적용 조건이 사라지거나 다른 canonical이 그 책임을 맡게 되면 현재 소비 경로를 맞추며 통합·이동·제거한다. 중요한 선택 이유만 남길 필요가 있으면 결정 기록과 연결한다. 모든 가이드에 같은 제거 조건 목차를 요구하지 않는다.

## 기존 Noline 실행 기준

[Rules](../../../.claude/rules/README.md), [Guards](../../../.claude/guards/README.md), [Runbooks](../../../.claude/runbooks/README.md)는 compact guard와 반복 작업 진입을 유지한다. 이번에 편입한 통화·날짜·API·동작 보존 리팩터링의 충분한 현재 의미와 적용 계약은 위 Project 본문이 소유하고, 기존 경로는 해당 본문으로 이어져야 한다. 아직 옮기지 않은 정책은 기존 Owner가 계속 소유한다.
