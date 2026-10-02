import { z } from 'zod';
import { combineDateTimeToISO } from '@/shared/lib/datetime';

/** 생성·수정 폼의 로컬 날짜·시간 입력. 저장용 시각을 폼 값에 덮어쓰지 않는다. */
export const scheduleDateTimeFormSchema = z
  .object({
    date: z.string().date('날짜를 다시 선택해주세요'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간을 다시 선택해주세요'),
  })
  .superRefine(({ date, time }, context) => {
    try {
      combineDateTimeToISO(date, time);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['time'],
        message: error instanceof Error ? error.message : '날짜와 시간을 다시 선택해주세요.',
      });
    }
  });
