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

본문 보완과 대표 읽기·소스 대조를 마쳤다. 기존 [Policy 본문](../../../../../../../.claude/context/policy-architecture.md)이 실제 관측·표시 강제값·unknown 재확인 수명, query/access/actions/view의 책임과 표시 우선순위, 홈의 부분 데이터, 연결 복귀와 실제 조회의 차이를 설명한다. [오류 가이드](../../../../../../../.claude/context/error-handling.md)는 최초 실패·갱신 실패를 구별하고 실제 `policy` prop과 작성 폼 보존 경계를 바로잡았다.

여행 목록의 remote/mixed/local·사본·취소/갱신 계약은 기존 본문을 재사용하고, 사라진 선택을 정리하는 실제 online·성공·갱신 완료 조건과 조회 표시 설명을 연결했다. Project README·client guide·Context 지도·API/Data·Policy UI에서 같은 현재 Owner에 도달한다. 별도 경쟁 본문이나 일반 FSD 예외를 만들지 않았다.

Main이 대표 질문으로 본문을 읽고 현재 코드·기존 검사와 대조했다. 관련 Jest 13개 suite·199개 test가 통과했다. 제품 코드·테스트 변경은 없으며 실제 인터넷 단절·백그라운드 Wi-Fi 전환을 검증한 결과는 아니다. 본문과 진입 문서 8개의 상대 링크 133개·참조 anchor·공백 검사를 통과했고, 기록 반영 전 명시적 005 Recover도 확인했다. 전체 harness 검사의 기존 002·003 끊어진 링크 8건은 남는다.

기록에서 선택 이유와 최소 사용자 발췌를 보존했고, 경비 상세의 특정 재시도·삭제 실패 이유와 복구 토스트 미추가 범위를 유지했다. [완료 기록](../../../records/2026-10-30-13-network-read-context.md)에 대조 질문과 검사 범위가 있다. 다음 06은 이 읽기 제한을 참조하되 작성 초안·장소·선택창·날짜 입력 수명을 별도로 설명한다.
