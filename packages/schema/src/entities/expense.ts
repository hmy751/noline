import { z } from 'zod';

// ========================================
// Expense Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Expense Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 금액: string (decimal 처리)
 * - 날짜: ISO 8601 datetime string
 */
export const expenseEntity = z.object({
  // Echo Protocol 필드
  id: z.string().ulid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string().ulid(),
  scheduleId: z.string().ulid().nullable(),
  title: z.string(),
  amount: z.string(), // DB decimal → string
  currency: z.string(),
  category: z.string(),
  date: z.string(), // ISO date string (e.g., "2024-03-15")
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),
});
