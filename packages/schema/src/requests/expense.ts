import { z } from 'zod';
import { expenseEntity } from '../entities/expense';

// ========================================
// Expense Request Schemas (API 요청)
// ========================================

/**
 * 경비 생성 요청 스키마
 * - 클라이언트 → 서버
 * - ✨ Echo Protocol: 클라이언트가 ID 생성
 */
export const createExpenseRequest = expenseEntity
  .pick({
    id: true, // ✨ 클라이언트가 생성한 ULID
    userId: true,
    tripId: true,
    scheduleId: true,
    title: true,
    amount: true,
    currency: true,
    category: true,
    date: true,
    hasReceipt: true,
    receiptUrl: true,
  })
  .extend({
    // 요청 시에는 userId를 optional로 (테스트용)
    userId: z.string().ulid().optional(),
    // 필수 필드 검증 추가
    title: z.string().min(1, 'Title is required'),
    amount: z.string().min(1, 'Amount is required'),
    currency: z.string().default('EUR'),
    category: z.string().min(1, 'Category is required'),
    date: z.string().min(1, 'Date is required'),
    hasReceipt: z.boolean().default(false),
  });

/**
 * 경비 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 */
export const updateExpenseRequest = expenseEntity
  .pick({
    title: true,
    amount: true,
    currency: true,
    category: true,
    date: true,
    scheduleId: true,
    hasReceipt: true,
    receiptUrl: true,
  })
  .partial();

// 타입 추출
export type CreateExpenseRequest = z.infer<typeof createExpenseRequest>;
export type UpdateExpenseRequest = z.infer<typeof updateExpenseRequest>;
