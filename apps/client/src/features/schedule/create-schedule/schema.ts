import { z } from 'zod';

/**
 * 일정 생성 폼 스키마
 */
export const createScheduleFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  location: z.string().min(1, '장소를 입력해주세요'),
  address: z.string().optional(),
  date: z.string().min(1, '날짜를 선택해주세요'),
  time: z.string().min(1, '시간을 선택해주세요'),
});

export type CreateScheduleFormData = z.infer<typeof createScheduleFormSchema>;
