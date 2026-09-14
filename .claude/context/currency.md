# Currency 구현 경로와 호환 진입

> 현재 통화·금액의 제품 의미와 열린 정밀도 판단은 [Project 통화와 금액](../../context/project/common/currency.md)이 소유한다.
> 통화 정책의 긴 설명과 web markup 예시는 [_archive/currency-policy-legacy-examples.md](../_archive/currency-policy-legacy-examples.md)에 보존되어 있다.

이 문서는 기존 링크를 보존하고 현재 구현 Owner를 찾는 역할만 맡는다. 통화 분리, `baseCurrency`와 첫 합계의 차이, 표시 자릿수와 저장 정밀도의 관계는 Project 본문에서 판단한다.

## 현재 코드 경로

| 책임 | 현재 위치 |
| --- | --- |
| Trip schema | `packages/schema/src/entities/trip.ts` |
| Expense schema | `packages/schema/src/entities/expense.ts` |
| client DB schema | `apps/client/src/shared/db/schema.ts` |
| server DB schema | `apps/server/src/db/schema.ts` |
| 합계·표시 helper | `apps/client/src/shared/lib/currency.ts` |
| 경비 합계 consumer | `apps/client/src/screens/ExpensesScreen.tsx` |
| expense create hook | `apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts` |

합계·정렬·표시를 바꿀 때에는 Project 본문에서 제품 의미와 열린 선택을 먼저 정하고, 위 schema·저장·consumer를 함께 대조한다.
