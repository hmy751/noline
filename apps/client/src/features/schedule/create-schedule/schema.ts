import { z } from 'zod';
import { scheduleDateTimeFormSchema } from '../schedule-form/schema';

/**
 * 일정 생성 폼 스키마
 */
export const createScheduleFormSchema = z
  .object({
    title: z.string().min(1, '제목을 입력해주세요'),
    location: z.string().min(1, '장소를 입력해주세요'),
    address: z.string().optional(),
  })
  .and(scheduleDateTimeFormSchema);

export type CreateScheduleFormData = z.infer<typeof createScheduleFormSchema>;
