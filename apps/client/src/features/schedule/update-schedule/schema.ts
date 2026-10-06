import { z } from 'zod';
import { makeScheduleDateTimeFormSchema } from '../schedule-form/schema';

export function makeScheduleUpdateFormSchema(timeZone?: string | null, original?: { date: string; time: string }) {
  return z
    .object({
      title: z.string().min(1, '제목을 입력해주세요'),
    })
    .and(makeScheduleDateTimeFormSchema(timeZone, original));
}

export const scheduleUpdateFormSchema = makeScheduleUpdateFormSchema();
export type ScheduleUpdateFormData = z.infer<typeof scheduleUpdateFormSchema>;
