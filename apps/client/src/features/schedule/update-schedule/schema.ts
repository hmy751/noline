import { z } from 'zod';

// ========================================
// Schedule Update Form Schema
// ========================================

/**
 * 일정 수정 폼 스키마
 * 제목, 날짜, 시간을 입력받음
 */
export const scheduleUpdateFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  date: z.string().min(1, '날짜를 선택해주세요'),
  time: z.string().min(1, '시간을 선택해주세요'),
});

// ========================================
// Types
// ========================================
export type ScheduleUpdateFormData = z.infer<typeof scheduleUpdateFormSchema>;
