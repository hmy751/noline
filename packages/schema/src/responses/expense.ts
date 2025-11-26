import { z } from 'zod';
import { expenseEntity } from '../entities/expense';

// ========================================
// Expense Response Schemas (API 응답)
// ========================================

/**
 * 단일 경비 응답
 * POST /api/expenses, PATCH /api/expenses/:id
 */
export const expenseResponse = z.object({
  success: z.literal(true),
  data: expenseEntity,
});

/**
 * 경비 목록 응답
 * GET /api/expenses, GET /api/trips/:tripId/expenses
 */
export const expenseListResponse = z.object({
  success: z.literal(true),
  data: z.array(expenseEntity),
});

/**
 * 경비 삭제 응답
 * DELETE /api/expenses/:id
 *
 * 정책: 모든 API 응답은 { success, data } 구조를 따른다
 */
export const deleteExpenseResponse = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().ulid(),
    deletedAt: z.string().datetime({ offset: true }),
  }),
});
