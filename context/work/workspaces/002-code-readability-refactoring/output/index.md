# 현재 산출물

이 Workspace에서 선택한 현재 산출물은 공통 Spec·Ticket 운영 기준과 완료된 01·02·04번 Ticket의 제품 코드다. 실제 파일은 Project의 canonical 위치에 유지한다. 산출물 연결은 전체 Work 완료나 제품 Verify 통과를 뜻하지 않으며 작업 정의와 현재 상황은 [현재 context](../current/memory/index.md)와 [state](../current/state/index.md)가 소유한다.

## 공통 Spec·Ticket 운영 기준

사용자 지시에 따라 검토된 실행 기준을 공통 운영 정본에 반영하고 기존 단일 문서를 책임별 디렉터리 구조로 나눴다. 이후 기준 변경에서 선택 배경과 방지하려던 실패를 잃지 않도록 같은 디렉터리에 변경 이력을 둔다.

- [운영 기준 진입](../../spec-and-tickets/README.md): Spec·Ticket·state의 관계, 상황별 읽기 순서와 기준 변경 전 이력 확인 규칙
- [목표를 실행 결과로 이어가는 기준](../../spec-and-tickets/EXECUTION-CRITERIA.md): 필요한 일의 발견, 범위·품질·분해·실행·완료 판단
- [Spec 작성](../../spec-and-tickets/SPEC.md): Work 목표와 공통 기준의 다섯 관점
- [Ticket 작성](../../spec-and-tickets/TICKET.md): 실행 결과·맥락·접근·완료 근거·실제 결과 작성
- [갱신과 작업의 연속성](../../spec-and-tickets/MAINTENANCE.md): Main·Maintain의 갱신 책임과 재판단 기준
- [선택 배경과 변경 이력](../../spec-and-tickets/HISTORY.md): Ticket 03에서 드러난 문제, 현재 판단을 선택한 이유, reviewer 과정, 문서 분리와 검증 한계 및 후속 변경 기록
- [프로젝트 결정 연결](../../../../../.claude/decisions/2026-09-12-spec-ticket-execution-criteria.md): 기존 프로젝트 결정 목록에서 현재 `HISTORY.md`와 운영 기준으로 이어지는 경로

기존 `context/work/workspaces/SPEC-AND-TICKETS.md`는 과거 링크를 새 진입점으로 연결하는 위치 안내로 남아 있다. `HISTORY.md`는 기준 자체를 변경할 때 읽는 배경 Owner이며 일반 Ticket 실행이나 Maintain의 매 판단 입력에 추가되지 않는다. 실제 구현·완료 행동의 후속 검증과 이 Workspace 전체의 사용자 acceptance는 아직 남아 있다.

## 01 — 경비 합계 표시

- [currency.ts](../../../../../apps/client/src/shared/lib/currency.ts): `getCurrencyFractionDigits`로 통화별 소수 자릿수 규칙을 모았다.
- [ExpensesScreen.tsx](../../../../../apps/client/src/screens/ExpensesScreen.tsx): 자릿수 규칙을 사용하고 `isFirstCurrencyGroup` 판단을 강조와 ‘주 통화’ 라벨에서 공유한다.

실제 변경과 검사 결과의 출처·미확인 범위는 [01번 Ticket](../current/memory/tickets/01-expense-totals.md)이 소유한다. 사용자는 fixture 비교와 제한된 정적 검사, 실제 React Native 화면 렌더 미실행이라는 한계를 확인하고 결과를 수락했다. 별도 영구 테스트 산출물은 없다.

Main이 보고한 최종 커밋은 `a51b759 refactor(client): 경비 합계 표시 규칙 정리`이며 기존 `1cc6696`을 amend로 대체했다. 당시 작업 트리는 clean이었다고 보고했다.

## 02 — 도시 검색 선별

- [geonames.api.ts](../../../../../apps/client/src/features/trip/create-trip/geonames.api.ts): 요청과 응답 필터가 허용 도시 코드 목록을 공유하고 도시 선별과 `City` 변환 책임을 드러낸다.

변경 전후 fixture·독립 verifier 결과와 미확인 범위는 [02번 Ticket](../current/memory/tickets/02-city-search.md)이 소유한다. 사용자는 실제 GeoNames 연결과 전체 앱 화면 미확인, 영구 테스트 부재를 포함한 결과를 확인하고 수락했다.

Main은 사용자 요청에 따라 기록과 커밋을 마무리했다고 보고했다. 보고 커밋은 `33348de refactor(client): 도시 검색 선별 조건 정리`이며 보고 시점의 작업 트리는 clean이었다.

위 커밋과 Git 상태는 Main 보고다. Maintain은 커밋 내용이나 작업 트리를 독립 확인하지 않았다.

## 04 — 경비 API 흐름

- [expenses.ts](../../../../../apps/client/src/entities/expense/api/expenses.ts): 재전파 catch·진단 출력·반복 주석을 없애고 요청 검증·HTTP·응답 검증·반환 순서를 직접 보여 준다.
- [expenses.test.ts](../../../../../apps/client/tests/entities/expense/api/expenses.test.ts): 다섯 remote export의 정상 흐름·검증 실패·오류 전달·HTTP 횟수를 고정한다.

변경 전후 동일한 8개 검사가 통과했다. 실제 네트워크·Axios interceptor·React Native 화면은 실행하지 않았으며, 정규 ESLint와 client 전체 타입 검사의 기존 실패를 새 회귀로 덮지 않았다. 상세 근거와 사용자 수락 범위는 [04번 Ticket](../current/memory/tickets/04-expense-api.md)이 소유한다.

Main이 보고한 커밋은 `dce576f refactor(client): 경비 API 흐름 정리`이며 Ticket 04 관련 파일 다섯 개만 포함했다. 보고 시점의 작업 트리에는 별도 Ticket 05와 `output/index.md`의 다른 미커밋 변경이 남아 있었다. 이 커밋 내용과 Git 상태는 Maintain이 독립 확인하지 않았다.
