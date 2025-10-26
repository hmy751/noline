import { z } from 'zod';

/**
 * 경비 수정 폼 스키마
 */
export const expenseUpdateFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  amount: z.string().min(1, '금액을 입력해주세요'),
  currency: z.string().min(1, '통화를 선택해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  date: z.string().min(1, '날짜를 선택해주세요'),
  scheduleId: z.string().optional(),
});

export type ExpenseUpdateFormData = z.infer<typeof expenseUpdateFormSchema>;
