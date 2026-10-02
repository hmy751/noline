import { z } from 'zod';
import { scheduleDateTimeFormSchema } from '../schedule-form/schema';

// ========================================
// Schedule Update Form Schema
// ========================================

/**
 * 일정 수정 폼 스키마
 * 제목, 날짜, 시간을 입력받음
 */
export const scheduleUpdateFormSchema = z
  .object({
    title: z.string().min(1, '제목을 입력해주세요'),
  })
  .and(scheduleDateTimeFormSchema);

// ========================================
// Types
// ========================================
export type ScheduleUpdateFormData = z.infer<typeof scheduleUpdateFormSchema>;
