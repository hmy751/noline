import { z } from 'zod';
import { makeScheduleDateTimeFormSchema } from '../schedule-form/schema';

export function makeCreateScheduleFormSchema(timeZone?: string | null, original?: { date: string; time: string }) {
  return z
    .object({
      title: z.string().min(1, '제목을 입력해주세요'),
      location: z.string().min(1, '장소를 입력해주세요'),
      address: z.string().optional(),
    })
    .and(makeScheduleDateTimeFormSchema(timeZone, original));
}

export const createScheduleFormSchema = makeCreateScheduleFormSchema();
export type CreateScheduleFormData = z.infer<typeof createScheduleFormSchema>;
