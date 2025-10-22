import { z } from 'zod';

// ========================================
// Trip Creation Form Schema
// ========================================

/**
 * 여행 생성 폼 스키마
 * 시작일과 종료일을 입력받으며, 종료일은 시작일 이후여야 함
 */
export const tripDateFormSchema = z
  .object({
    startDate: z.string().min(1, '시작일을 선택해주세요'),
    endDate: z.string().min(1, '종료일을 선택해주세요'),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: '종료일은 시작일 이후여야 합니다',
      path: ['endDate'],
    },
  );

// ========================================
// Types
// ========================================
export type TripDateFormData = z.infer<typeof tripDateFormSchema>;
