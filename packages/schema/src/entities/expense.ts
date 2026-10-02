import { z } from 'zod';
import { isoDateTime } from '../primitives/datetime';

/** 경비가 속하는 달력 날짜. 기기 시간대로 변환하지 않는다. */
export const expenseDate = z.string().date();

// ========================================
// Expense Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Expense Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 금액: string (decimal 처리)
 * - 경비 날짜: YYYY-MM-DD, 생성·수정·삭제 시각: ISO datetime
 */
export const expenseEntity = z.object({
  // Client-Side ID 필드
  id: z.string().ulid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  deletedAt: isoDateTime.nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string().ulid(),
  scheduleId: z.string().ulid().nullable(),
  title: z.string(),
  amount: z.string(), // DB decimal → string
  currency: z.string(),
  category: z.string(),
  date: expenseDate,
  hasReceipt: z.boolean(),
  receiptUrl: z.string().nullable(),
});
