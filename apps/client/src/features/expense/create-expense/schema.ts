import { z } from 'zod';

/**
 * 경비 생성 폼 스키마
 *
 * ✅ TIME_ARCHITECTURE_GUIDE 준수:
 * - date: ISO 8601 datetime with timezone (Pattern 2: Date Only)
 * - "2024-03-15T00:00:00.000Z" 형식으로 저장
 */
export const createExpenseFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  amount: z.string().min(1, '금액을 입력해주세요'),
  currency: z.string().min(1, '통화를 선택해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  date: z.string().datetime({ offset: true }), // ✅ ISO 8601 datetime with timezone
  scheduleId: z.string().optional(), // 일정 연결 (선택)
});

export type CreateExpenseFormData = z.infer<typeof createExpenseFormSchema>;
