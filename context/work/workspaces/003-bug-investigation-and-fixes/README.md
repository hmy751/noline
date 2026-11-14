# 발견한 버그 확인·수정

기존 코드베이스 분석과 추가 조사에서 나온 동작 문제를 근거 수준에 맞게 확인하고 수정하는 독립 Work다. 실제 재현한 결함, 소스에서 확인한 불일치, 기대 동작이나 발생 조건이 더 필요한 후보를 구별한다.

- [Spec·전체 후보·Ticket](current/memory/index.md)
- [현재 상태와 다음 행동](current/state/index.md)
- [원자료와 재현 실험](source/index.md), [제품 산출물](output/index.md), [기록](records/README.md)

**003-04 재활성화 정리 예약과003-05 같은 도시 공유 지도 결함을 한정 수정·검증했고, 포함된 1.1.2(16)이 심사 대기 중이다.** 이 Work의 모든 후보·Ticket 완료를 뜻하지 않는다. [재개 안내](recover.md)에서 현재 상태·수정 기록과 필요한 Ticket을 고른다.

같은 분석에서 코드 가독성 리팩토링 Work `002-code-readability-refactoring`를 함께 만들었다. 그 Work의 current를 먼저 읽거나 자동 추종하지 않는다. `001-noline-context-harness-application`의 이식 결과·검증 성공은 이 Work의 제품 증거가 아니다.

[재개 안내](recover.md)에서 현재 요청에 필요한 자료와 읽을 이유를 고른다.
