import { and, eq, isNull, sql } from 'drizzle-orm';
import type { z } from 'zod';

import type { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import type { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import {
  deletedMutationResponse,
  legacyScheduleConflictResponse,
  legacyExpenseConflictResponse,
} from '@repo/schema/responses/mutation-conflict';
import {
  compareEdits,
  expenseEditGroups,
  scheduleEditGroups,
  type FieldEdits,
  type EditStamp,
} from '@repo/schema/sync/field-edits';
import { hasStorableMutationText, hasStorableMutationDates } from '@repo/schema/sync/storage-input';

import { preserveLegacyUpdate } from './legacy-update-holds.js';
import { db, schedules, expenses, trips, legacyUpdateHolds } from '../db/index.js';
import { serializeExpense } from '../serializers/expense.js';
import { serializeSchedule } from '../serializers/schedule.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ChildEntityKind = 'schedule' | 'expense';
type MutationResult = { status: number; body: Record<string, unknown> };

export const createSchedule = async (
  input: z.infer<typeof createScheduleRequest>,
  userId: string,
): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    await validateScheduleStorageInput(tx, input);

    const parentError = await lockOwnedTrip(tx, input.tripId, userId, input.id);

    if (parentError) {
      return parentError;
    }

    const [created] = await tx
      .insert(schedules)
      .values({
        ...input,
        userId,
        scheduledAt: new Date(input.scheduledAt),
        latitude: input.latitude == null ? null : String(input.latitude),
        longitude: input.longitude == null ? null : String(input.longitude),
      })
      .onConflictDoNothing({ target: schedules.id })
      .returning();

    let row = created;

    if (!row) {
      [row] = await tx
        .select()
        .from(schedules)
        .where(and(eq(schedules.id, input.id), eq(schedules.userId, userId)));
    }

    if (!row || row.tripId !== input.tripId) {
      return idConflictResponse('Schedule');
    }

    return { status: created ? 201 : 200, body: { success: true, data: serializeSchedule(row) } };
  });
};

export const createExpense = async (
  input: z.infer<typeof createExpenseRequest>,
  userId: string,
): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    await validateExpenseStorageInput(tx, input);

    const parentError = await lockOwnedTrip(tx, input.tripId, userId, input.id);

    if (parentError) {
      return parentError;
    }

    const relation = await resolveExpenseSchedule(tx, input.scheduleId, input.tripId, userId);

    if (relation.error) {
      return relation.error;
    }

    const [created] = await tx
      .insert(expenses)
      .values({
        ...input,
        userId,
        scheduleId: relation.id,
        date: new Date(input.date),
        hasReceipt: input.hasReceipt ? 1 : 0,
      })
      .onConflictDoNothing({ target: expenses.id })
      .returning();

    let row = created;

    if (!row) {
      [row] = await tx
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, input.id), eq(expenses.userId, userId)));
    }

    if (!row || row.tripId !== input.tripId) {
      return idConflictResponse('Expense');
    }

    return { status: created ? 201 : 200, body: { success: true, data: serializeExpense(row) } };
  });
};

export const updateSchedule = async (
  id: string,
  userId: string,
  input: z.infer<typeof updateScheduleRequest>,
  originalPayload: Record<string, unknown> = input,
): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    await validateScheduleStorageInput(tx, input);

    const [ownedRecord] = await tx
      .select({ tripId: schedules.tripId })
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId)));

    if (!ownedRecord) {
      return missingRecordResponse();
    }

    const parentError = await lockOwnedTrip(tx, ownedRecord.tripId, userId, id);

    if (parentError) {
      return parentError;
    }

    const [row] = await tx
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId)))
      .for('update');

    if (!row) {
      return missingRecordResponse();
    }

    if (row.deletedAt) {
      return deletedRecordResponse('ENTITY_DELETED', id, row.tripId, row.deletedAt);
    }

    const current = serializeSchedule(row);
    const merged = mergeEdit(current, input, scheduleEditGroups);

    if (merged.conflict) {
      const hold = await preserveLegacyUpdate(tx, {
        userId,
        tripId: row.tripId,
        tableName: 'schedules',
        recordId: id,
        payload: originalPayload,
        current,
      });

      return {
        status: 409,
        body: legacyScheduleConflictResponse.parse({
          error: 'Conflict',
          code: 'LEGACY_UPDATE_CONFLICT',
          data: current,
          recoveryId: hold.id,
          hold,
        }),
      };
    }

    if (!merged.requiresWrite) {
      return { status: 200, body: { success: true, data: current } };
    }

    const { scheduledAt, latitude, longitude, ...rest } = merged.patch;

    const [updated] = await tx
      .update(schedules)
      .set({
        ...rest,
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(latitude !== undefined && { latitude: latitude == null ? null : String(latitude) }),
        ...(longitude !== undefined && { longitude: longitude == null ? null : String(longitude) }),
        fieldEdits: merged.fieldEdits,
        updatedAt: new Date(),
        version: row.version + 1,
      })
      .where(and(eq(schedules.id, id), eq(schedules.userId, userId)))
      .returning();

    return { status: 200, body: { success: true, data: serializeSchedule(updated) } };
  });
};

export const updateExpense = async (
  id: string,
  userId: string,
  input: z.infer<typeof updateExpenseRequest>,
  originalPayload: Record<string, unknown> = input,
): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    await validateExpenseStorageInput(tx, input);

    const [ownedRecord] = await tx
      .select({ tripId: expenses.tripId })
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));

    if (!ownedRecord) {
      return missingRecordResponse();
    }

    const parentError = await lockOwnedTrip(tx, ownedRecord.tripId, userId, id);

    if (parentError) {
      return parentError;
    }

    const [row] = await tx
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .for('update');

    if (!row) {
      return missingRecordResponse();
    }

    if (row.deletedAt) {
      return deletedRecordResponse('ENTITY_DELETED', id, row.tripId, row.deletedAt);
    }

    const patch = { ...input };

    if (input.scheduleId !== undefined) {
      const relation = await resolveExpenseSchedule(tx, input.scheduleId, row.tripId, userId);

      if (relation.error) {
        return relation.error;
      }

      patch.scheduleId = relation.id;
    }

    const current = serializeExpense(row);
    const merged = mergeEdit(current, patch, expenseEditGroups);

    if (merged.conflict) {
      const hold = await preserveLegacyUpdate(tx, {
        userId,
        tripId: row.tripId,
        tableName: 'expenses',
        recordId: id,
        payload: originalPayload,
        current,
      });

      return {
        status: 409,
        body: legacyExpenseConflictResponse.parse({
          error: 'Conflict',
          code: 'LEGACY_UPDATE_CONFLICT',
          data: current,
          recoveryId: hold.id,
          hold,
        }),
      };
    }

    if (!merged.requiresWrite) {
      return { status: 200, body: { success: true, data: current } };
    }

    const { date, hasReceipt, ...rest } = merged.patch;

    const [updated] = await tx
      .update(expenses)
      .set({
        ...rest,
        ...(date !== undefined && { date: new Date(date) }),
        ...(hasReceipt !== undefined && { hasReceipt: hasReceipt ? 1 : 0 }),
        fieldEdits: merged.fieldEdits,
        updatedAt: new Date(),
        version: row.version + 1,
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();

    return { status: 200, body: { success: true, data: serializeExpense(updated) } };
  });
};

export const deleteEntity = async (kind: ChildEntityKind, id: string, userId: string): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    const table = kind === 'schedule' ? schedules : expenses;

    const [ownedRecord] = await tx
      .select({ tripId: table.tripId })
      .from(table)
      .where(and(eq(table.id, id), eq(table.userId, userId)));

    if (!ownedRecord) {
      return missingRecordResponse();
    }

    const parentError = await lockOwnedTrip(tx, ownedRecord.tripId, userId, id);

    if (parentError) {
      return parentError;
    }

    const [row] = await tx
      .select()
      .from(table)
      .where(and(eq(table.id, id), eq(table.userId, userId)))
      .for('update');

    if (!row) {
      return missingRecordResponse();
    }

    let deletedAt = row.deletedAt ?? new Date();

    if (!row.deletedAt) {
      const [deleted] = await tx
        .update(table)
        .set({ deletedAt, updatedAt: deletedAt, version: row.version + 1 })
        .where(and(eq(table.id, id), eq(table.userId, userId)))
        .returning();
      deletedAt = deleted.deletedAt!;

      if (kind === 'schedule') {
        // 일정 삭제로 끊긴 연결에는 새 편집 표식을 발급하지 않는다.
        await tx
          .update(expenses)
          .set({ scheduleId: null, updatedAt: deletedAt, version: sql`${expenses.version} + 1` })
          .where(
            and(
              eq(expenses.scheduleId, id),
              eq(expenses.tripId, row.tripId),
              eq(expenses.userId, userId),
              isNull(expenses.deletedAt),
            ),
          );
      }
    }

    await tx
      .delete(legacyUpdateHolds)
      .where(
        and(
          eq(legacyUpdateHolds.userId, userId),
          eq(legacyUpdateHolds.tableName, kind === 'schedule' ? 'schedules' : 'expenses'),
          eq(legacyUpdateHolds.recordId, id),
        ),
      );

    return { status: 200, body: { success: true, data: { id, deletedAt: deletedAt.toISOString() } } };
  });
};

export const deleteTrip = async (id: string, userId: string): Promise<MutationResult> => {
  return db.transaction(async (tx) => {
    const [trip] = await tx
      .select()
      .from(trips)
      .where(and(eq(trips.id, id), eq(trips.userId, userId)))
      .for('update');

    if (!trip) {
      return missingRecordResponse();
    }

    let deletedAt = trip.deletedAt ?? new Date();

    if (!trip.deletedAt) {
      const [deleted] = await tx
        .update(trips)
        .set({ deletedAt, updatedAt: deletedAt, version: trip.version + 1 })
        .where(and(eq(trips.id, id), eq(trips.userId, userId)))
        .returning();
      deletedAt = deleted.deletedAt!;

      for (const table of [schedules, expenses]) {
        await tx
          .update(table)
          .set({ deletedAt, updatedAt: deletedAt, version: sql`${table.version} + 1` })
          .where(and(eq(table.tripId, id), eq(table.userId, userId), isNull(table.deletedAt)));
      }
    }

    await tx
      .delete(legacyUpdateHolds)
      .where(and(eq(legacyUpdateHolds.userId, userId), eq(legacyUpdateHolds.tripId, id)));

    return { status: 200, body: { success: true, data: { id, deletedAt: deletedAt.toISOString() } } };
  });
};

/** 수정한 항목의 값과 표식만 돌려준다. 구버전 입력이 한 항목에서라도 충돌하면 요청 전체를 보류한다. */
export const mergeEdit = <Input extends Record<string, unknown> & { edit?: EditStamp }>(
  current: Record<string, unknown> & { fieldEdits?: FieldEdits },
  input: Input,
  groups: Record<string, readonly (keyof Input & string)[]>,
): { conflict: boolean; patch: Partial<Input>; fieldEdits: FieldEdits; requiresWrite: boolean } => {
  const fieldEdits = { ...current.fieldEdits };
  const edit = input.edit;
  const patch: Partial<Input> = {};

  if (!edit) {
    for (const [group, fields] of Object.entries(groups)) {
      if (
        fieldEdits[group] &&
        fields.some((key) => input[key] !== undefined && !isSameFieldValue(key, input[key], current[key]))
      ) {
        return { conflict: true, patch: {}, fieldEdits, requiresWrite: false };
      }
    }
  }

  let requiresWrite = false;

  for (const [group, fields] of Object.entries(groups)) {
    const editedFields = fields.filter((key) => input[key] !== undefined);
    const currentEdit = fieldEdits[group];
    const hasSameOrNewerStoredEdit = edit && currentEdit && compareEdits(edit, currentEdit) <= 0;

    if (!editedFields.length || hasSameOrNewerStoredEdit) {
      continue;
    }

    for (const key of editedFields) {
      patch[key] = input[key];

      if (!isSameFieldValue(key, input[key], current[key])) {
        requiresWrite = true;
      }
    }

    if (edit) {
      // 값이 같아도 새 표식을 저장해야 뒤늦게 도착한 이전 편집이 값을 되돌리지 못한다.
      fieldEdits[group] = edit;
      requiresWrite = true;
    }
  }

  return { conflict: false, patch, fieldEdits, requiresWrite };
};

const missingRecordResponse = (): MutationResult => ({
  status: 404,
  body: { error: 'Not found', message: 'Record not found' },
});
const idConflictResponse = (entity: 'Schedule' | 'Expense'): MutationResult => ({
  status: 409,
  body: { error: 'Conflict', message: `${entity} ID is already in use` },
});
const deletedRecordResponse = (
  code: 'TRIP_DELETED' | 'ENTITY_DELETED',
  id: string,
  tripId: string,
  deletedAt: Date,
): MutationResult => {
  return {
    status: 410,
    body: deletedMutationResponse.parse({
      error: 'Gone',
      code,
      message: 'Record has been deleted',
      data: { id, tripId, deletedAt: deletedAt.toISOString() },
    }),
  };
};

/** PostgreSQL 수용 여부를 승패·삭제 판정 전에 확인한다. 손상 입력은 종결하지 않는다.
 * numeric의 기존 표기·정밀도 수용과 반올림은 DB 자체의 cast를 그대로 따른다. */
const validateExpenseStorageInput = async (tx: Transaction, input: z.infer<typeof updateExpenseRequest>) => {
  if (!hasStorableMutationText('expenses', input)) {
    throw new Error('Expense input cannot be stored as text');
  }

  if (!hasStorableMutationDates(input)) {
    throw new Error('Expense date cannot be stored');
  }

  if (input.amount !== undefined) {
    await tx.execute(sql`SELECT ${input.amount}::numeric(10,2)`);
  }
};

const validateScheduleStorageInput = async (tx: Transaction, input: z.infer<typeof updateScheduleRequest>) => {
  if (!hasStorableMutationText('schedules', input)) {
    throw new Error('Schedule input cannot be stored as text');
  }

  if (!hasStorableMutationDates(input)) {
    throw new Error('Schedule date cannot be stored');
  }

  if (input.latitude != null || input.longitude != null) {
    await tx.execute(sql`SELECT ${input.latitude ?? null}::numeric(10,7), ${input.longitude ?? null}::numeric(10,7)`);
  }
};

/** 자식 쓰기와 삭제가 부모 여행부터 같은 순서로 잠가야 일정 삭제와 경비 등록이 엇갈리지 않는다. */
const lockOwnedTrip = async (
  tx: Transaction,
  tripId: string,
  userId: string,
  entityId: string,
): Promise<MutationResult | undefined> => {
  const [trip] = await tx
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .for('update');

  if (!trip) {
    return missingRecordResponse();
  }

  if (trip.deletedAt) {
    return deletedRecordResponse('TRIP_DELETED', entityId, tripId, trip.deletedAt);
  }
};

const resolveExpenseSchedule = async (
  tx: Transaction,
  id: string | null | undefined,
  tripId: string,
  userId: string,
) => {
  if (!id) {
    return { id: null };
  }

  const [schedule] = await tx
    .select()
    .from(schedules)
    .where(and(eq(schedules.id, id), eq(schedules.userId, userId), eq(schedules.tripId, tripId)));

  if (!schedule) {
    return { error: missingRecordResponse() };
  }

  return { id: schedule.deletedAt ? null : id };
};

/** 구버전 요청의 소수 표기와 시간대가 달라도 같은 금액·좌표·시각이면 충돌시키지 않는다. */
const isSameFieldValue = (key: string, incoming: unknown, current: unknown) => {
  if (['amount', 'latitude', 'longitude'].includes(key) && incoming != null && current != null) {
    return Number(incoming) === Number(current);
  }

  if (key === 'scheduledAt' && typeof incoming === 'string' && typeof current === 'string') {
    return Date.parse(incoming) === Date.parse(current);
  }

  return incoming === current;
};
