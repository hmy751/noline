# 통화 기준의 발췌와 구현 관찰

[본문](../../currency.md)과 [형성 맥락](context.md)의 근거다. 역사 원문은 현재 규칙을 대신하지 않으며 아래 발췌만으로 당시 제안 전체가 채택됐다고 보지 않는다.

- 2025-10-26 통화 정책 보존판은 “환율 API에 의존하지 않고, 각 통화를 독립적으로 관리하며 통화별 그룹으로 총액을 표시합니다”라고 목적을 설명했다. “주 통화 강조: 가장 많이 사용된 통화를 우선 표시”, “ISO 4217 통화 코드만 허용”도 적었지만 현재 정렬·schema는 그 설명을 그대로 구현하지 않는다. 초기 문서의 식별자는 `currency-policy-legacy-examples.md`이며 명시적 역사 조사용 보존물이다.
- 002 [합계 Ticket](../../../../work/workspaces/002-code-readability-refactoring/current/memory/tickets/01-expense-totals.md)은 “화면 문구 ‘주 통화’, 합산·정렬·빈 상태 표시와 기존 계산 순서를 보존한다”고 범위를 정했다. `1.005`의 두 표시 결과는 characterization이며 장기 정책의 기대값이 아니라고 구별했다.
- 2026-10-31 source 관찰: [currency helper](../../../../../apps/client/src/shared/lib/currency.ts)는 `Number(amount)` 합산, baseCurrency 우선, 나머지 숫자 내림차순이다. [홈 요약](../../../../../apps/client/src/entities/trip/ui/TripSummary.tsx)은 `toFixed(2)`, [경비 카드](../../../../../apps/client/src/entities/expense/ui/ExpenseCard.tsx)는 문자열 원문을 표시한다.
- [공유 request](../../../../../packages/schema/src/requests/expense.ts), [생성 폼](../../../../../apps/client/src/features/expense/create-expense/schema.ts), [수정 폼](../../../../../apps/client/src/features/expense/update-expense/schema.ts)은 숫자 형식과 통화 코드의 유효성을 보장하지 않는다. 입력 키보드·목록과 전송 검증의 책임은 다르다.

구체적인 테스트 실행과 이관 대조는 006의 결과 기록에 남긴다. Node의 숫자 표시 관찰은 실제 기기 렌더나 PostgreSQL 정밀도 시험이 아니다.
