import { describe, expect, it } from 'vitest';
import { serializeExpense } from '../../src/serializers/expense.js';
import { EXPENSE_DATE, expenseRow } from '../fixtures/data-rows.js';

describe('serializeExpense', () => {
  it('Expense DB row를 API 날짜·boolean·시간 문자열 표현으로 변환한다', () => {
    const deletedAt = new Date('2026-09-13T04:00:00.000Z');

    const result = serializeExpense({ ...expenseRow, deletedAt });

    expect(result).toEqual({
      ...expenseRow,
      date: EXPENSE_DATE,
      hasReceipt: true,
      createdAt: expenseRow.createdAt.toISOString(),
      updatedAt: expenseRow.updatedAt.toISOString(),
      deletedAt: deletedAt.toISOString(),
    });
  });

  it('영수증과 삭제 시각이 없는 Expense를 false와 null로 유지한다', () => {
    const result = serializeExpense({ ...expenseRow, hasReceipt: 0, deletedAt: null });

    expect(result.hasReceipt).toBe(false);
    expect(result.deletedAt).toBeNull();
  });
});
