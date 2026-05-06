# Currency Policy Guide

> 문서 상태: active source.
> 통화 정책의 긴 설명과 web markup 예시는 [_archive/currency-policy-legacy-examples.md](../_archive/currency-policy-legacy-examples.md)에 보존되어 있다.

Noline은 여행 중 여러 통화를 그대로 기록한다. 환율 API에 의존해 하나의 기준 통화로 강제 환산하지 않는다.

## Current Model

- Trip에는 `baseCurrency`가 있다.
- Expense에는 개별 `currency`가 있다.
- 경비 총액은 통화별로 그룹핑해 보여준다.
- 서로 다른 통화 금액을 임의로 합산하지 않는다.
- 새 Expense의 기본 통화는 선택된 Trip의 `baseCurrency`를 우선한다.

## Current Code Paths

| 책임 | 현재 위치 |
| --- | --- |
| Trip schema | `packages/schema/src/entities/trip.ts` |
| Expense schema | `packages/schema/src/entities/expense.ts` |
| client DB schema | `apps/client/src/shared/db/schema.ts` |
| expense create hook | `apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts` |
| expense UI constants | `apps/client/src/entities/expense/model/constants.ts` |

## Display Rules

- 통화별 합계를 별도 줄로 표시한다.
- 대표 금액을 하나만 보여야 하는 카드에서는 가장 중요한 통화 하나와 나머지 개수를 함께 표시한다.
- 환산 총액이 필요한 기능을 만들기 전에는 exchange rate source와 offline behavior를 먼저 결정한다.

## Form Rules

- Expense 생성 폼의 기본 통화는 Trip `baseCurrency`다.
- 사용자는 Expense별 currency를 바꿀 수 있어야 한다.
- 오프라인 manual input에서도 currency는 필수 입력으로 유지한다.

## 체크리스트

- [ ] 서로 다른 currency를 합산하지 않았는가?
- [ ] 새 Expense 기본값이 Trip `baseCurrency`를 우선하는가?
- [ ] UI가 금액과 currency code/symbol을 함께 보여주는가?
- [ ] 환율/환산 기능을 추가한다면 offline 정책과 source decision을 먼저 남겼는가?
