# 01 — 경비 합계의 강조·소수 자릿수 규칙

## 맡은 결과와 범위

경비 화면의 통화별 합계 표시에서 첫 항목 강조와 소수 자릿수 규칙을 반복 해석하던 부분을 정리한다. 제품 코드 범위는 `apps/client/src/shared/lib/currency.ts`의 자릿수 판단과 `apps/client/src/screens/ExpensesScreen.tsx`의 통화 합계 표시 구간이다. 공통 품질 기준은 [Spec 품질·완료 판단](../spec/04-quality-and-completion.md), 현재 접근은 [Spec 제약·설계·가정](../spec/05-constraints-design-assumptions.md)을 따른다.

`groupExpensesByCurrency`의 합산·정렬은 동작 보존 검사에는 포함하지만 구현은 바꾸지 않는다. 대표 통화의 제품 기준을 다시 정하는 일은 가독성 개선보다 큰 의미 변경이기 때문이다. 날짜 그룹, 경비 폼·카드, schema, DB, API, 환율 계산과 다른 통화 화면도 범위 밖이다.

## 실행 맥락과 접근

- 기본 통화가 합계 목록에 없을 수도 있으므로 강조 조건은 기본 통화 여부가 아니라 `첫 번째 통화 그룹인가`라는 의미로 다룬다.
- KRW·JPY는 소수점 0자리, 나머지는 2자리라는 규칙만 공용 helper로 모은다. 이번 변경은 화면의 `toFixed`와 공용 `formatCurrencyDisplay`의 기존 표시·반올림 방식을 건드리지 않는다.
- 사용자가 선택한 이름 `getCurrencyFractionDigits`를 유지한다.
- 화면 문구 ‘주 통화’, 합산·정렬·빈 상태 표시와 기존 계산 순서를 보존한다.

## 완료 조건과 확인 방법

동작 보존은 변경 전후 같은 fixture로 확인한다. 검사 범위는 빈 경비, 기본 통화 유무, 동일 통화 합산, 금액 정렬과 동률, KRW·JPY 및 EUR·USD의 자릿수, 0·소수·1,000 이상 금액이다. `1.005 USD`가 화면의 `toFixed(2)`에서는 `1.00`, 공용 formatter에서는 `USD 1.01`로 표시되는 차이는 리팩터링 전후 결과가 같은지 확인하는 기존 동작 기록(characterization)으로만 사용한다. 올바른 금액 처리와 영구 회귀 테스트의 기대값은 별도 버그 판단에서 정한다.

개선 효과는 다음 두 조건으로 판단한다.

- 첫 항목 여부를 한 번 계산해 글자 강조와 ‘주 통화’ 라벨이 함께 사용한다.
- 소수 자릿수 규칙을 한곳에서 관리하고 화면과 공용 formatter가 함께 사용한다.

`git diff --check`와 Prettier로 diff·형식을 확인하고 변경 파일 ESLint와 client typecheck 결과에서 기존 환경 오류와 새 오류를 구분한다. 검사 우회를 사용하면 제외한 규칙과 그에 따라 제한되는 검증 범위를 남긴다. 코드 연결과 표시식 실행은 실제 React Native 화면 렌더 검증과 구별한다.

## 현재 상태와 실제 결과

01번의 코드 구현과 코드 수준 검증은 완료됐다는 Main 보고다. Main은 현재 source와 diff에서 다음 변경을 확인했다고 밝혔다.

- `currency.ts`에 `getCurrencyFractionDigits`를 추가하고 `formatCurrencyDisplay`가 사용하도록 했다.
- `ExpensesScreen.tsx`에서 `isFirstCurrencyGroup`을 한 번 계산해 강조와 ‘주 통화’ 라벨에 공유하고, 화면 금액도 `getCurrencyFractionDigits`를 사용하도록 했다.
- `groupExpensesByCurrency`의 합산·정렬 구현과 다른 통화 화면은 수정하지 않았다.

worker 실행과 별도 verifier 검토에서 변경 전후 fixture의 합산·정렬, 기본 통화 우선순위, 동률, 빈 목록, 자릿수와 천 단위 표시가 같았다고 보고됐다. `1.005`의 두 표시 결과도 전후 동일해 이번 리팩터링이 반올림 차이를 새로 만들지는 않았다는 보고다. `git diff --check`와 Prettier는 통과했다. 정규 ESLint는 기존 `prettier.resolveConfig.sync is not a function` 호환 오류로 실행을 완료하지 못했으며, 해당 Prettier 규칙만 제외한 변경 파일 ESLint는 통과했다. Client typecheck는 변경 전후 같은 기존 오류 3건만 남았다.

Main의 후속 조사 보고에 따르면 금액 문자열을 `Number`로 변환해 합산하며 입력 schema는 숫자 형식과 소수 자릿수를 제한하지 않아 `1.005`가 들어올 수 있다. 금액 처리 문제는 입력 검증, 합산 방식, 반올림 시점, 로컬 `TEXT`와 서버 `decimal(10,2)` 계약을 함께 검토해야 하므로 Workspace 003의 별도 버그 Ticket에서 다룬다. 해당 Ticket의 생성·전달·착수는 이번 입력으로 확인되지 않았다. 이 조사와 Node 기준 표시 결과는 Main 보고이며 Maintain이 독립 확인하지 않았고, 실제 React Native/Hermes 기기 결과도 미확인이다.

이 Ticket에는 Node 기반 테스트를 추가하지 않는다. `1.005`는 기존 결함을 확인한 characterization으로만 남기며, 영구 회귀 테스트는 Workspace 003에서 버그 수정 범위와 기대 동작을 정한 뒤 필요성을 판단한다. 실제 React Native 화면 렌더는 실행하지 않아 시각 결과는 미확인이다.

사용자가 위 결과와 검증 한계를 확인하고 01번 Ticket을 수락했다. 이 Ticket은 완료됐으며, 완료 범위는 경비 합계의 코드 구현·코드 수준 검증에 한정된다. 전체 Work 완료를 뜻하지 않는다. 제품 코드 위치는 [output](../../../output/index.md)에 연결한다.
