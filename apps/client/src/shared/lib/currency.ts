/**
 * 통화 관련 유틸리티 함수
 *
 * CURRENCY_POLICY.md 정책에 따라 구현:
 * - 통화별 독립 관리
 * - 환율 API 불필요
 * - 통화별 그룹핑 및 정렬
 */

import type { Expense } from '@/entities/expense';

/**
 * 통화별 경비 그룹
 */
export interface CurrencyGroup {
  currency: string;
  amount: number;
}

/**
 * 경비 목록을 통화별로 그룹핑
 *
 * @param expenses - 경비 목록
 * @param baseCurrency - 여행 기본 통화 (주 통화로 맨 위에 표시)
 * @returns 통화별 그룹 (baseCurrency 우선, 나머지는 금액 기준 내림차순)
 *
 * @example
 * ```ts
 * const expenses = [
 *   { currency: 'EUR', amount: '100.50' },
 *   { currency: 'KRW', amount: '50000' },
 *   { currency: 'EUR', amount: '200.00' },
 * ];
 *
 * const grouped = groupExpensesByCurrency(expenses, 'EUR');
 * // [
 * //   { currency: 'EUR', amount: 300.50 },  // baseCurrency 우선
 * //   { currency: 'KRW', amount: 50000 }
 * // ]
 * ```
 */
export function groupExpensesByCurrency(expenses: Expense[], baseCurrency?: string): CurrencyGroup[] {
  if (!expenses || expenses.length === 0) return [];

  // 통화별로 그룹핑
  const grouped = expenses.reduce(
    (acc, expense) => {
      const currency = expense.currency || 'USD';
      acc[currency] = (acc[currency] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  // 배열로 변환
  const result = Object.entries(grouped).map(([currency, amount]) => ({ currency, amount }));

  // baseCurrency가 있으면 해당 통화를 맨 위로, 나머지는 금액 기준 내림차순
  return result.sort((a, b) => {
    if (baseCurrency) {
      if (a.currency === baseCurrency) return -1;
      if (b.currency === baseCurrency) return 1;
    }
    return b.amount - a.amount;
  });
}

/**
 * 주 통화 가져오기 (가장 많이 사용된 통화)
 *
 * @param expenses - 경비 목록
 * @returns 주 통화 그룹 또는 null
 *
 * @example
 * ```ts
 * const primary = getPrimaryCurrency(expenses);
 * // { currency: 'EUR', amount: 300.50 }
 * ```
 */
export function getPrimaryCurrency(expenses: Expense[]): CurrencyGroup | null {
  const grouped = groupExpensesByCurrency(expenses);
  return grouped.length > 0 ? grouped[0] : null;
}

/**
 * 추가 통화 개수 계산
 *
 * @param expenses - 경비 목록
 * @returns 주 통화 제외한 추가 통화 개수
 *
 * @example
 * ```ts
 * const count = getAdditionalCurrencyCount(expenses);
 * // 2 (EUR 제외 USD, KRW 2개)
 * ```
 */
export function getAdditionalCurrencyCount(expenses: Expense[]): number {
  const grouped = groupExpensesByCurrency(expenses);
  return Math.max(0, grouped.length - 1);
}

/**
 * 통화 표시 포맷 (금액 + 통화 코드)
 *
 * @param amount - 금액
 * @param currency - 통화 코드
 * @returns 포맷된 문자열
 *
 * @example
 * ```ts
 * formatCurrencyDisplay(123.456, 'EUR') // "EUR 123.46"
 * formatCurrencyDisplay(1234567, 'KRW') // "KRW 1,234,567"
 * ```
 */
export function formatCurrencyDisplay(amount: number, currency: string): string {
  // KRW, JPY는 소수점 없음
  const decimals = ['KRW', 'JPY'].includes(currency) ? 0 : 2;

  // 천 단위 구분자 추가
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${currency} ${formatted}`;
}
