# 현재 제품 산출물

완료된 01·02·04번 Ticket의 제품 코드 위치다. 코드는 Project의 canonical 위치에 유지한다.

- [currency.ts](../../../../../apps/client/src/shared/lib/currency.ts): `getCurrencyFractionDigits`로 통화별 소수 자릿수 규칙을 모았다.
- [ExpensesScreen.tsx](../../../../../apps/client/src/screens/ExpensesScreen.tsx): 자릿수 규칙을 사용하고 `isFirstCurrencyGroup` 판단을 강조와 ‘주 통화’ 라벨에서 공유한다.
- [geonames.api.ts](../../../../../apps/client/src/features/trip/create-trip/geonames.api.ts): 요청과 응답 필터가 허용 도시 코드 목록을 공유하고 도시 선별과 `City` 변환 책임을 드러낸다.

실제 변경과 검사 결과의 출처·미확인 범위는 [01번 Ticket](../current/memory/tickets/01-expense-totals.md)이 소유한다. 사용자는 fixture 비교와 제한된 정적 검사, 실제 React Native 화면 렌더 미실행이라는 한계를 확인하고 01번 결과를 수락했다. 별도 영구 테스트 산출물은 없다.

Main은 사용자 요청에 따라 커밋을 마무리하고 메시지를 `refactor(client): 경비 합계 표시 규칙 정리`로 수정했다고 보고했다. 최종 보고 커밋은 `a51b759`이며 기존 `1cc6696`을 amend로 대체했다. 보고 시점의 작업 트리는 clean이었다. Maintain은 커밋 내용이나 Git 상태를 독립 확인하지 않았다.

01번의 수락은 전체 Work 완료를 뜻하지 않는다. 작업 정의는 [현재 Spec](../current/memory/index.md)이 소유한다.

02번의 변경 전후 fixture·독립 verifier 결과와 미확인 범위는 [02번 Ticket](../current/memory/tickets/02-city-search.md)이 소유한다. 사용자는 실제 GeoNames 연결과 전체 앱 화면 미확인, 영구 테스트 부재를 포함한 결과를 확인하고 수락했다. 02번의 완료도 전체 Work 완료를 뜻하지 않는다.

## 04 — 경비 API 흐름

- [expenses.ts](../../../../../apps/client/src/entities/expense/api/expenses.ts): 재전파 catch·진단 출력·반복 주석을 없애고 요청 검증·HTTP·응답 검증·반환 순서를 직접 보여 준다.
- [expenses.test.ts](../../../../../apps/client/tests/entities/expense/api/expenses.test.ts): 다섯 remote export의 정상 흐름·검증 실패·오류 전달·HTTP 횟수를 고정한다.

변경 전후 동일한 8개 검사가 통과했다. 실제 네트워크·Axios interceptor·React Native 화면은 실행하지 않았으며, 정규 ESLint와 client 전체 타입 검사의 기존 실패를 새 회귀로 덮지 않았다. 상세 근거와 사용자 수락 범위는 [04번 Ticket](../current/memory/tickets/04-expense-api.md)이 소유한다.

Main이 보고한 커밋은 `dce576f refactor(client): 경비 API 흐름 정리`이며 Ticket 04 관련 파일 다섯 개만 포함했다. 보고 시점의 작업 트리에는 별도 Ticket 05와 `output/index.md`의 다른 미커밋 변경이 남아 있었다. 이 커밋 내용과 Git 상태는 Maintain이 독립 확인하지 않았다.
