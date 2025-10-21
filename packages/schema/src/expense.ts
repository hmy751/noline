import { z } from 'zod';

// ========================================
// Expense Schemas
// ========================================

// Select Schema (DB에서 조회한 데이터)
export const expenseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  scheduleId: z.string().uuid().nullable(),
  title: z.string(),
  amount: z.string(), // Decimal을 문자열로 전송
  currency: z.string(),
  category: z.string(),
  date: z.string(),
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Phase 2: Local-First 필드 (선택적)
  deletedAt: z.date().nullable().optional(),
  version: z.number().optional(),
});

// Insert Schema (경비 생성)
export const insertExpenseSchema = z.object({
  userId: z.string().uuid(),
  tripId: z.string().uuid(),
  scheduleId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('WON'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  hasReceipt: z.boolean().default(false),
  receiptUrl: z.string().nullable().optional(),
});

// Update Schema (경비 수정)
export const updateExpenseSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.string().min(1).optional(),
  currency: z.string().optional(),
  category: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  hasReceipt: z.boolean().optional(),
  receiptUrl: z.string().nullable().optional(),
  scheduleId: z.string().uuid().nullable().optional(),
});

// ========================================
// Types
// ========================================
export type Expense = z.infer<typeof expenseSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;
