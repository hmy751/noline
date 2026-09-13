import type { scheduleEntity } from '@repo/schema/entities/schedule';
import type { z } from 'zod';
import type { Schedule } from '../db/schema.js';

type SerializedSchedule = z.infer<typeof scheduleEntity>;

/** PostgreSQL Schedule row를 API Schedule entity의 시간 문자열 계약으로 변환한다. */
export function serializeSchedule(schedule: Schedule): SerializedSchedule {
  return {
    ...schedule,
    scheduledAt: schedule.scheduledAt.toISOString(),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    deletedAt: schedule.deletedAt?.toISOString() ?? null,
  };
}
