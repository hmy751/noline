import { z } from 'zod';

/**
 * 경비 생성 폼 스키마
 */
export const createExpenseFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  amount: z.string().min(1, '금액을 입력해주세요'),
  currency: z.string().default('EUR'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  scheduleId: z.string().optional(), // 일정 연결 (선택)
});

export type CreateExpenseFormData = z.infer<typeof createExpenseFormSchema>;
