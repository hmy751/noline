import { z } from 'zod';
import { combineDateTimeInTimeZoneToISO } from '@/shared/lib/datetime';

/** 도시 시간대의 날짜·시간을 검증한다. 수정하지 않은 기존 시각은 재해석하지 않는다. */
export function makeScheduleDateTimeFormSchema(timeZone?: string | null, original?: { date: string; time: string }) {
  return z
    .object({
      date: z.string().date('날짜를 다시 선택해주세요'),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간을 다시 선택해주세요'),
    })
    .superRefine(({ date, time }, context) => {
      if (original && date === original.date && time === original.time) return;
      try {
        if (!timeZone) throw new Error('여행 시간대를 먼저 확인해주세요.');
        combineDateTimeInTimeZoneToISO(date, time, timeZone);
      } catch (error) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['time'],
          message: error instanceof Error ? error.message : '날짜와 시간을 다시 선택해주세요.',
        });
      }
    });
}

// 시간대를 받지 않은 호출은 날짜·시간의 새 저장을 허용하지 않는다.
export const scheduleDateTimeFormSchema = makeScheduleDateTimeFormSchema();
