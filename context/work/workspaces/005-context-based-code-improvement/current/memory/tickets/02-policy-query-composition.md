# 02 — 일정·경비 조회 조합의 공통화 재검토

지위: 현재 실행 계획에서 대체됨. 아래는 이전 코드 검토 범위의 보존이며, 이번 Project Context 보완은 [새 Ticket](05-network-read-context.md)이 맡는다. 새로운 코드 리팩터링을 시작하는 지시로 사용하지 않는다.

## 맡은 결과와 범위

query/access/actions/view로 나눈 공통 조회 조합이 접근 제한·재시도·캐시 표시를 일관되게 제공하면서 실제 화면·폼의 차이를 표현하는지 판단한다. 채택한 개선은 소비자 연결과 검증까지 마친다. 공통화 양이나 옵션 수만으로 성공을 판단하지 않는다.

일정·경비 조회 feature, policy-query service, 실제 화면·폼 소비와 관련 검사가 범위다. Policy의 제품 허용 조건이나 전체 FSD 전환을 자동으로 바꾸지 않는다.

## 실행 맥락과 접근

첫 비교 전에 [세 화면 공통화 비교](../../../../002-code-readability-refactoring/records/2026-09-29-07-read-query-composition-trial.md), [명명·배치·교체 선택](../../../../002-code-readability-refactoring/records/2026-09-29-09-policy-query-ownership-and-migration.md), [후속 소비 범위](../../../../002-code-readability-refactoring/records/2026-09-29-10-read-query-follow-up-scope.md)를 읽는다. 당시 폼 재사용의 제한적 예외와 Project-wide 반영 보류를 현재 전역 규칙으로 승격하지 않는다.

[공통 조합](../../../../../../../apps/client/src/shared/services/policy-query/index.ts), [일정 조회](../../../../../../../apps/client/src/features/schedule/read-schedules/index.ts), [경비 조회](../../../../../../../apps/client/src/features/expense/read-expenses/index.ts)에서 실제 import 소비자를 찾아 연결한다. [조합 검사](../../../../../../../apps/client/tests/shared/services/policy-query/read-query.test.tsx)와 화면 복구 검사의 mock 경계를 확인한다. [Context](../project-context.md)의 공통 제공·사용처 선택, 계약·수명과 [제품 Policy 계약](../../../../../../../.claude/context/policy-architecture.md)을 대조한다.

## 완료 조건과 확인 방법

- 최초 조회 실패·정상 빈 결과·기존 캐시가 있는 재조회 실패·접근 차단·소비자 비활성 조건이 어떤 표시와 실행을 만드는지 확인한다.
- 공통 계약과 화면별 선택을 구별하고, 중복 조합·우회·숨은 상태를 줄일 대안의 이득과 비용을 실제 소비자에서 비교한다.
- refetch의 blocked/finished, 최근 입력 참조, raw Query와 공통 실행의 역할 및 오류 전달을 확인한다.
- 채택한 변경은 실제 소비자와 필요한 계약·화면 검사로 검증한다. 사용자 보류인 특정 경비 상세 재시도 문제를 발견만으로 재개하지 않는다.
- 유지 근거 또는 구현·검증된 개선과 남은 지원 한계를 반환한다. 후속 적용이 필수라면 남긴 채 완료하지 않는다.

## 현재 상태와 실제 결과

이전 코드 구조 재검토 계획은 Project Context 우선 재구성으로 대체했다. 관련 조사 근거는 재사용하고, 현재 실행과 완료 판단은 [Context 보완 Ticket](05-network-read-context.md)을 따른다. 이 Ticket을 독립적인 코드 수정 작업으로 재개하지 않는다.
