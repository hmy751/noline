# 통화와 금액의 제품 의미

경비의 통화 분리, 합계·대표 표시, 금액 정밀도와 반올림을 판단할 때 읽는다. 이 본문은 이 주제의 현재 Project 기준을 소유한다. 기존 [Currency context](../../../.claude/context/currency.md)는 이전 경로를 새 Owner로 연결하고 구현 위치를 찾는 호환 진입점으로 남는다.

## 서로 다른 통화는 서로 다른 금액이다

Trip의 `baseCurrency`는 새 Expense의 기본 통화를 제안하고 통화별 합계를 정렬할 때 우선순위를 줄 수 있다. 각 Expense는 자기 `currency`와 `amount`를 가지며 사용자는 기본값과 다른 통화를 선택할 수 있다. 네트워크가 없는 수동 입력에서도 이 관계는 유지한다.

환율과 환산 시점이 정해지지 않은 상태에서 서로 다른 통화를 하나의 금액으로 더하지 않는다. 경비 합계는 통화별로 따로 보여 주고, 환산 합계를 도입하려면 환율의 출처·기준 시각·오프라인 동작과 실패 시 표시를 먼저 결정해야 한다.

금액을 표시할 때에는 해당 currency code 또는 symbol을 함께 보여 사용자가 금액의 단위를 구별할 수 있게 한다.

## 현재 합계와 대표 표시를 해석하는 법

현재 경비 화면은 같은 통화의 `amount`를 숫자로 바꿔 더하고, 여행의 `baseCurrency`가 결과에 있으면 그 그룹을 먼저 둔다. 기본 통화가 결과에 없으면 금액이 큰 그룹이 먼저 오며 화면은 첫 그룹을 강조하고 `주 통화`라고 표시한다. 따라서 현재 코드의 “첫 그룹”과 “여행의 기본 통화”는 항상 같은 뜻이 아니다.

이 차이는 [경비 합계 구현](../../../apps/client/src/screens/ExpensesScreen.tsx)과 [통화 helper](../../../apps/client/src/shared/lib/currency.ts)에서 확인된다. 다음 작업은 강조나 라벨을 고칠 때 `첫 그룹`, `baseCurrency`, 가장 큰 합계 중 어떤 의미를 원하는지 구별해야 한다. 현재 구현이 어느 표현을 쓰는지는 확인됐지만, 기본 통화가 없는 합계에서 `주 통화`가 무엇을 뜻해야 하는지는 별도 제품 선택으로 남아 있다.

대표 금액 하나만 보여야 하는 위치에서는 통화별 결과 중 하나와 나머지 통화 개수를 함께 표시한다. 현재 `getPrimaryCurrency`는 `baseCurrency` 인자 없이 금액이 가장 큰 그룹을 고르지만 실제 consumer는 확인되지 않았다. 새 카드가 이 helper의 이름만 보고 여행의 기본 통화를 뜻한다고 가정하지 말고, 화면이 표현하려는 대표 기준을 먼저 정한다.

## 표시 자릿수는 금액 정밀도 계약이 아니다

현재 표시 helper는 KRW·JPY를 소수점 0자리, 그 밖의 통화를 2자리로 보여 준다. 이 규칙은 화면과 공용 formatter가 같이 사용할 표시 관례다. 저장할 수 있는 소수 자릿수, 합산 정밀도, 반올림 시점이나 회계 처리를 결정하지 않는다.

현재 경계에는 다음 차이가 있다.

- 공유 Expense schema와 client SQLite는 `amount`를 문자열로 다루며 소수 자릿수 제한을 선언하지 않는다.
- server PostgreSQL은 `decimal(10,2)`를 사용한다.
- 합계는 client에서 `Number`로 변환해 계산한다.
- 경비 합계 화면의 `toFixed`와 공용 `toLocaleString` formatter는 `1.005` 같은 값에서 서로 다른 반올림 결과를 낼 수 있다.

이 차이를 Ticket 01의 동작 보존 리팩터링에서 새 정책으로 해결하지 않았다. 입력 정밀도, 저장 경계, 합산 방식과 표시 반올림을 함께 정하기 전에는 현재 두 자리 표시를 Project-wide 금액 계약으로 확대하지 않는다. 관련 직접 근거는 [Expense entity schema](../../../packages/schema/src/entities/expense.ts), [client DB schema](../../../apps/client/src/shared/db/schema.ts), [server DB schema](../../../apps/server/src/db/schema.ts)에 있다.

## 변경할 때 확인할 관계

통화 합계·카드·폼을 바꿀 때에는 같은 통화를 분리하지 않는지, 다른 통화를 환율 없이 합치지 않는지, `baseCurrency`가 기본값인지 합계의 대표값인지 구별했는지 확인한다. 자릿수나 반올림을 바꿀 때에는 formatter 한 곳만 고치지 말고 입력 schema, client/server 저장, 합산과 모든 표시 consumer의 결과를 대조한다.

이 기준은 Workspace 002의 [Ticket 01](../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/01-expense-totals.md)과 현재 코드·schema를 2026-09-14에 대조해 통합했다. Ticket의 fixture 비교는 코드 수준 동작 보존 근거이며 실제 React Native 렌더나 장기 금액 정책의 결정은 아니다.
