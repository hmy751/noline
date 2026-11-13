import { z } from 'zod';

import { expenseEntity } from '../entities/expense';
import { scheduleEntity } from '../entities/schedule';
import { isoDateTime } from '../primitives/datetime';

/** 인증 사용자의 요청 대상 ID와 서버가 확인한 부모 여행 ID를 함께 전달한다. */
export const deletedMutationResponse = z.object({
  error: z.literal('Gone'),
  code: z.enum(['ENTITY_DELETED', 'TRIP_DELETED']),
  message: z.string().optional(),
  data: z.object({ id: z.string().ulid(), tripId: z.string().ulid(), deletedAt: isoDateTime }),
});

/** 원래 요청은 서버가 승인한 필드로 해석하기 전 입력을 보존한다. */
export const legacyUpdateHold = z
  .object({
    id: z.string().ulid(),
    userId: z.string().ulid(),
    tableName: z.enum(['schedules', 'expenses']),
    recordId: z.string().ulid(),
    tripId: z.string().ulid(),
    payload: z.record(z.unknown()),
    current: z.union([scheduleEntity, expenseEntity]),
    createdAt: isoDateTime,
  })
  .superRefine((hold, ctx) => {
    if (
      hold.current.id !== hold.recordId ||
      hold.current.userId !== hold.userId ||
      hold.current.tripId !== hold.tripId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['current'],
        message: 'Hold current record must match its owner and entity',
      });
    }
  });

const LEGACY_RECOVERY_FIELDS = {
  recoveryId: z.string().ulid().optional(),
  hold: legacyUpdateHold.optional(),
};

export const legacyScheduleConflictResponse = z.object({
  error: z.literal('Conflict'),
  code: z.literal('LEGACY_UPDATE_CONFLICT'),
  data: scheduleEntity,
  ...LEGACY_RECOVERY_FIELDS,
});

export const legacyExpenseConflictResponse = z.object({
  error: z.literal('Conflict'),
  code: z.literal('LEGACY_UPDATE_CONFLICT'),
  data: expenseEntity,
  ...LEGACY_RECOVERY_FIELDS,
});
