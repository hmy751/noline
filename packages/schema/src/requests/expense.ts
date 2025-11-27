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
    hasReceipt: true, // TODO: 영수증 업로드 기능 구현 전까지 항상 false
    receiptUrl: true, // TODO: 영수증 업로드 기능 구현 전까지 항상 null
  })
  .extend({
    // 요청 시에는 userId를 optional로 (테스트용)
    userId: z.string().ulid().optional(),
    // 필수 필드 검증 추가
    title: z.string().min(1, 'Title is required'),
    amount: z.string().min(1, 'Amount is required'),
    currency: z.string().default('USD'),
    category: z.string().min(1, 'Category is required'),
    date: z.string().min(1, 'Date is required'),
    hasReceipt: z.boolean().default(false), // TODO: 영수증 업로드 기능 구현 시 활성화
    receiptUrl: z.string().nullable().default(null), // TODO: 영수증 업로드 기능 구현 시 활성화
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
