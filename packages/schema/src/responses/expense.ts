import { expenseEntity } from '../entities/expense';
import { okResponse, okListResponse, deleteResponse } from './_envelope';

// ========================================
// Expense Response Schemas (API 응답)
// ========================================

/**
 * 단일 경비 응답
 * POST /api/expenses, PATCH /api/expenses/:id
 */
export const expenseResponse = okResponse(expenseEntity);

/**
 * 경비 목록 응답
 * GET /api/expenses, GET /api/trips/:tripId/expenses
 */
export const expenseListResponse = okListResponse(expenseEntity);

/**
 * 경비 삭제 응답
 * DELETE /api/expenses/:id
 */
export const deleteExpenseResponse = deleteResponse;
