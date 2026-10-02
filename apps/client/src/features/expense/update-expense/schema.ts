import { expenseDate } from '@repo/schema/entities/expense';
import { z } from 'zod';

export const expenseUpdateFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  amount: z.string().min(1, '금액을 입력해주세요'),
  currency: z.string().min(1, '통화를 선택해주세요'),
  category: z.string().min(1, '카테고리를 선택해주세요'),
  date: expenseDate,
  scheduleId: z.string().optional(),
});

export type ExpenseUpdateFormData = z.infer<typeof expenseUpdateFormSchema>;
