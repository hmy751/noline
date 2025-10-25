// ========================================
// Expense Types - Client-side types inferred from @repo/schema
// ========================================

import { z } from 'zod';
import {
  expenseSchema,
  expenseResponseSchema,
  createExpenseRequestSchema,
  updateExpenseRequestSchema,
  getAllExpensesResponseSchema,
  createExpenseResponseSchema,
  updateExpenseResponseSchema,
  deleteExpenseResponseSchema,
} from '@repo/schema';

// ========================================
// Entity Type (DB)
// ========================================
export type Expense = z.infer<typeof expenseSchema>;

// ========================================
// Request Types (클라이언트 → 서버)
// ========================================
export type CreateExpenseRequest = z.infer<typeof createExpenseRequestSchema>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequestSchema>;

// ========================================
// Response Types (서버 → 클라이언트)
// ========================================
export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
export type GetAllExpensesResponse = z.infer<typeof getAllExpensesResponseSchema>;
export type CreateExpenseResponse = z.infer<typeof createExpenseResponseSchema>;
export type UpdateExpenseResponse = z.infer<typeof updateExpenseResponseSchema>;
export type DeleteExpenseResponse = z.infer<typeof deleteExpenseResponseSchema>;

// ========================================
// Alias (backward compatibility)
// ========================================
export type ExpenseData = ExpenseResponse;

// ========================================
// UI Constants (클라이언트 전용)
// ========================================

/**
 * 카테고리 목록
 */
export const EXPENSE_CATEGORIES = ['관광', '교통', '식사', '쇼핑', '숙박', '체험', '기타'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * 통화 목록
 */
export const CURRENCIES = ['EUR', 'USD', 'KRW', 'JPY', 'GBP', 'CNY'] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * 통화 기호 매핑
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  KRW: '₩',
  JPY: '¥',
  GBP: '£',
  CNY: '¥',
};
