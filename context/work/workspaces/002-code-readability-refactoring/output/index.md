# 현재 제품 산출물

완료된 01번 Ticket의 제품 코드 위치다. 코드는 Project의 canonical 위치에 유지한다.

- [currency.ts](../../../../../apps/client/src/shared/lib/currency.ts): `getCurrencyFractionDigits`로 통화별 소수 자릿수 규칙을 모았다.
- [ExpensesScreen.tsx](../../../../../apps/client/src/screens/ExpensesScreen.tsx): 자릿수 규칙을 사용하고 `isFirstCurrencyGroup` 판단을 강조와 ‘주 통화’ 라벨에서 공유한다.

실제 변경과 검사 결과의 출처·미확인 범위는 [01번 Ticket](../current/memory/tickets/01-expense-totals.md)이 소유한다. 사용자는 fixture 비교와 제한된 정적 검사, 실제 React Native 화면 렌더 미실행이라는 한계를 확인하고 01번 결과를 수락했다. 별도 영구 테스트 산출물은 없다.

01번의 수락은 전체 Work 완료를 뜻하지 않는다. 작업 정의는 [현재 Spec](../current/memory/index.md)이 소유한다.
