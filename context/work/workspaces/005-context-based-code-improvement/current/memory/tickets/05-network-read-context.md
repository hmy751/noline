# 05 — 네트워크·조회·화면 복구 Context

## 맡은 결과와 범위

실제 연결의 관측부터 정책·Query 실행·화면 표시까지 역할을 이해하고, 연결 변화에서도 기존 데이터와 선택을 어떻게 유지하는지 판단할 수 있게 한다. Network Store 수명·foreground·unknown·override, 일정/경비 조회 조합, 홈 요약과 여행 목록의 서로 다른 계약을 함께 다룬다.

04가 소유하는 인증 상태·sync 실행 조건은 참조한다. 이번 본문 정리로 새로운 FSD 예외나 복구 토스트, 보류된 경비 재시도 UX를 채택하지 않는다.

## 실행 맥락과 접근

policy-architecture, selective-activation, 오류/구조 가이드의 관련 설명을 현재 network/policy-query 코드와 화면 소비자에 대조한다. 관측 결과·표시 강제값·요청 가능·내용 공개를 혼합하지 않고, 최초 실패/갱신 실패와 정상 빈 결과·부분 cache를 이해할 수 있게 보완한다.

공통 Query 상태를 홈에서 다시 포장하지 않은 이유와 표시 책임을 제품 구조의 설명으로 남긴다. 여행 목록의 remote/mixed/local·보존·취소/갱신은 기존 충분한 본문을 재사용한다. 좁은 feature 재사용 예외의 규범화와 현재 구현 사실 설명을 구별한다.

- [조회 소유권과 보류](../../../../002-code-readability-refactoring/records/2026-09-29-09-policy-query-ownership-and-migration.md)
- [홈 요약과 부분 데이터](../../../../002-code-readability-refactoring/records/2026-10-04-01-home-summary-policy-and-ux-review.md)
- [foreground와 기존 감지 수명](../../../../002-code-readability-refactoring/records/2026-10-04-02-foreground-network-refresh.md)
- [현재 Policy](../../../../../../../.claude/context/policy-architecture.md)
- [목록·Router 계약](../../../../../../../.claude/context/selective-activation-architecture.md)
- [조회 상태·실행·표시](../../../../../../../apps/client/src/shared/services/policy-query/usePolicyReadQuery.ts)

## 완료 조건과 확인 방법

- 실제 offline/unknown과 Debug 표시의 차이, 재확인 요청 공유·늦은 응답·해제 책임을 설명한다.
- 초기 오류·갱신 오류·성공한 빈 결과·한쪽 cache만 있는 홈에서 표시와 실행이 어떻게 갈리는지 현재 코드와 대조한다.
- 여행 목록과 일정·경비 내용 공개의 차이 및 복구 뒤 cancel/invalidate·추가 조회 관계를 기존 본문에 연결한다.
- 네트워크·Query·화면 수정의 대표 진입에서 같은 현재 Owner로 도달하며 권위 보류·제품 보류를 보존한다.

## 현재 상태와 실제 결과

실행 범위를 구성했다. 앞선 전체 대응 조사에서 관련 기록·Context·코드 일부를 확보했다. 본문 보완과 대표 읽기 확인은 아직 수행하지 않았다. 실제 편집 시 현재판과 후속 결정을 확인하고 결과를 이 본문에 갱신한다.
