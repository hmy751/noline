import type { expenseEntity } from '@repo/schema/entities/expense';
import type { z } from 'zod';
import type { Expense } from '../db/schema.js';

type SerializedExpense = z.infer<typeof expenseEntity>;

/** PostgreSQL Expense row를 API Expense entity의 날짜·boolean·시간 문자열 계약으로 변환한다. */
export function serializeExpense(expense: Expense): SerializedExpense {
  return {
    ...expense,
    date: expense.date.toISOString().split('T')[0],
    hasReceipt: expense.hasReceipt === 1,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    deletedAt: expense.deletedAt?.toISOString() ?? null,
  };
}
