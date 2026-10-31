# 통화와 금액의 제품 의미

경비 입력·합계·대표 표시와 정밀도를 판단할 때 읽는다. **서로 다른 통화는 환율 없이 합치지 않고, 표시 자릿수와 저장·계산 정밀도를 구별한다.** 현재 적용은 이 본문을, 환산 없는 기록과 열린 정밀도 판단의 이유는 [형성 자료](_background/currency/README.md)를 읽는다.

## 서로 다른 통화는 서로 다른 금액으로 다룬다

여행자는 여러 나라의 현금과 카드 결제를 한 여행에 기록할 수 있다. Expense는 자기 `currency`와 `amount`를 가지며 Trip의 `baseCurrency`와 다른 통화도 선택할 수 있다. 환율을 구하지 못해도 기록을 이어가도록 통화별 원금액을 보존하고, 같은 통화끼리 합계를 낸다. EUR 20과 USD 30을 출처 없는 `총 50 EUR`로 표시하면 실제 지출의 단위를 바꾸게 된다.

금액을 표시할 때 currency code 또는 symbol을 함께 보여 단위를 구별한다. 환산 합계를 도입하려면 환율 출처·기준 시각·오프라인 동작·실패 시 표시를 먼저 결정한다. 현재 통화 분리는 환산 총액이나 통화 간 구매력 비교를 제공하지 않는 비용을 받아들인 선택이다. 기록·조회 가능 여부는 별도의 [여행 접근 정책](../guidance/travel-access/INDEX.md)을 따른다. 환율 의존이 없다는 사실이 비활성 여행의 모든 오프라인 기능 허용을 뜻하지 않는다.

새 통화 표시는 공용 `formatCurrencyDisplay`, 경비의 통화별 묶음은 `groupExpensesByCurrency`를 사용한다. 두 함수는 [통화 helper](../../../apps/client/src/shared/lib/currency.ts)에 있다. 아래의 기존 화면 차이는 이 재사용 기준을 없애거나 저장·계산 정밀도를 확정하는 근거가 아니다.

## 기본 통화와 대표 표시를 구별한다

Trip의 `baseCurrency`는 새 경비의 기본 통화를 제안하고 합계 정렬에 우선순위를 준다. [여행 생성](../../../apps/client/src/features/trip/create-trip/TripDateForm.tsx)은 선택 도시의 국가 코드로 기본 통화를 정하며 [국가 매핑](../../../apps/client/src/shared/lib/country-currency.ts)에 없으면 USD를 사용한다. 기본 통화가 모든 경비의 통화를 강제하거나 다른 통화의 금액을 환산하지는 않는다.

[경비 생성 폼](../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts)은 처음 사용할 때 조회된 여행의 통화 또는 USD로 초기화한다. 여행 조회가 늦으면 날짜와 달리 통화 기본값을 나중에 보정하는 effect가 없어 USD가 남을 수 있다. 이 동작을 여행 통화를 항상 적용한다는 보장으로 설명하지 않는다. 사용자가 편집한 값과 늦은 기본값의 우선순위를 바꾸려면 [초안 수명](../guidance/writing-and-input/drafts.md)을 함께 판단한다. 수정 폼은 해당 경비의 통화를 초기값으로 삼는다.

합계와 대표 표시는 소비자가 무엇을 보여 주는지에 맞춰 읽는다.

| 소비자 | 현재 정렬·선택과 표현 |
| --- | --- |
| [경비 화면](../../../apps/client/src/screens/ExpensesScreen.tsx) | 같은 통화의 금액을 `Number`로 합산하고, baseCurrency 그룹이 있으면 먼저 둔다. 나머지는 숫자 합계 내림차순이다. 첫 그룹을 강조하고 `주 통화`라 표시한다. |
| [홈 여행 요약](../../../apps/client/src/screens/HomeScreen/MainTripSection.tsx) | baseCurrency 우선으로 만든 그룹 배열을 전달하고 TripSummary가 첫 항목과 나머지 통화 개수를 표시한다. 조회 제한·실패는 0원과 구별한다. |
| [일정 상세 합계](../../../apps/client/src/screens/ScheduleDetailScreen.tsx) | baseCurrency 인자 없이 그룹을 만들어 숫자 합계 내림차순으로 모두 표시한다. |

기본 통화가 합계에 없으면 첫 그룹은 숫자가 가장 큰 통화다. 이 순서는 환산 가치나 사용 횟수를 비교한 결과가 아니다. `주 통화` 라벨을 바꿀 때는 첫 그룹·여행 기본 통화·대표 통화 중 어느 뜻을 원하는지 정해야 하며, 기본 통화가 없는 경우의 라벨 의미는 아직 열린 제품 선택이다.

[통화 helper](../../../apps/client/src/shared/lib/currency.ts)의 `getPrimaryCurrency`는 baseCurrency 인자 없이 첫 그룹을 고르고 `getAdditionalCurrencyCount`는 그룹 수에서 하나를 뺀다. 현재 앱 소비자는 두 helper 대신 이미 만든 그룹에서 직접 대표·개수를 구한다. 새 표시에서 helper 이름만 보고 기본 통화나 사용 빈도를 뜻한다고 가정하지 말고 대표 기준과 일치하는 함수를 선택한다. 빈 currency를 USD로 묶는 helper의 fallback도 입력의 통화 유효성을 검증하는 규칙은 아니다.

## 표시 자릿수를 저장·계산 계약으로 확대하지 않는다

공용 `getCurrencyFractionDigits`는 KRW·JPY를 0자리, 나머지를 2자리로 정한다. `formatCurrencyDisplay`는 이 자릿수와 `en-US` 천 단위 구분을 사용한다. 표시 변경 때는 공용 helper뿐 아니라 다음 차이를 함께 확인한다.

| 표시 위치 | 현재 방식 |
| --- | --- |
| 경비 화면 합계 | 통화별 자릿수로 `toFixed`, 빈 결과는 baseCurrency 또는 USD의 formatter 결과 |
| [홈 TripSummary](../../../apps/client/src/entities/trip/ui/TripSummary.tsx) | 값이 있으면 통화와 `toFixed(2)`를 사용해 KRW·JPY도 두 자리. 빈 결과는 baseCurrency의 formatter 결과 |
| 일정 상세 합계 | 각 그룹은 공용 formatter, 빈 결과는 고정 `USD 0.00` |
| [개별 ExpenseCard](../../../apps/client/src/entities/expense/ui/ExpenseCard.tsx) | 통화와 저장된 amount 문자열을 그대로 표시 |

공용 formatter와 `toFixed`는 Node에서 `1.005 USD`를 각각 `USD 1.01`과 `1.00`으로 표시한다. 이를 옳은 반올림 정책이나 실제 기기 결과로 채택하지 않는다. 모든 표시가 이미 공용 규칙을 따른다는 설명도 현재 코드와 다르다.

저장·입력 경계는 표시와 별도로 판단한다.

- [공유 Expense entity](../../../packages/schema/src/entities/expense.ts)는 amount·currency를 문자열로 선언한다. [생성 request](../../../packages/schema/src/requests/expense.ts)는 amount의 비어 있지 않음만 검사하고 currency는 생략 시 USD다. 수정 request는 두 문자열의 빈 값도 허용한다. 숫자 형식·범위·소수 자릿수나 통화 코드 목록을 검증하지 않는다.
- [생성](../../../apps/client/src/features/expense/create-expense/schema.ts)·[수정 폼](../../../apps/client/src/features/expense/update-expense/schema.ts)은 amount·currency가 비어 있지 않은지 검사한다. `decimal-pad`와 통화 선택 목록은 입력 UI이며 공유 전송 계약의 숫자·통화 검증을 대신하지 않는다.
- [SQLite](../../../apps/client/src/shared/db/schema.ts)는 amount를 TEXT로, [PostgreSQL](../../../apps/server/src/db/schema.ts)은 `decimal(10,2)`로 저장한다. Server currency는 길이 3의 varchar이고 client는 TEXT여서 저장 수용 범위도 같지 않다.
- 합계는 문자열을 JavaScript `Number`로 바꿔 계산한다. 비숫자 입력은 NaN으로, `0.1 + 0.2`는 부동소수 오차가 있는 값으로 나타날 수 있다. 문자열 저장만으로 정밀한 계산이나 Local/Server 일치가 보장되지 않는다.

금액 처리를 바꿀 때는 입력 허용값·저장 범위·합산 방식·반올림 시점과 모든 표시 소비자를 함께 정한다. 현재 두 자리 표시는 장기 금액 계약이 아니며, 숫자 검증 부족이나 화면 차이를 이 문서 이관으로 해결한 것으로 보지 않는다. 원금액을 보존하는 저장 방식과 서버 정밀도의 조정, 대표 라벨·환산 도입은 서로 다른 선택이다.
