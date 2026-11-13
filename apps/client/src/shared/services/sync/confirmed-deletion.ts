import { and, eq } from 'drizzle-orm';

import { createExpenseRequest, updateExpenseRequest } from '@repo/schema/requests/expense';
import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { updateTripRequest } from '@repo/schema/requests/trip';
import { canConfirmMutationStorageLocally } from '@repo/schema/sync/storage-input';
import { deleteQueuePayloadSchema } from '@repo/schema/sync/sync-queue';

import {
  expenses,
  getDatabase,
  schedules,
  syncQueue,
  legacySyncHolds,
  tripActivations,
  type SyncTableName,
} from '@/shared/db';
import { requireLocalUserId } from '@/shared/store/auth';

import { clearLegacyHoldInTransaction } from './legacy-holds';
import { rememberConfirmedDeletionInTransaction, releaseServerRecordBodiesInTransaction } from './server-state';
import { SYNC_TABLES, isSyncTable } from './sync-tables';

const PENDING_STATES = new Set(['PENDING', 'FAILED', 'IN_PROGRESS']);
const ROW_METADATA_FIELDS = new Set([
  'id',
  'userId',
  'tripId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'version',
  'fieldEdits',
]);

const UPDATE_REQUESTS = { trips: updateTripRequest, schedules: updateScheduleRequest, expenses: updateExpenseRequest };
const CREATE_REQUESTS = { schedules: createScheduleRequest, expenses: createExpenseRequest };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

type DeletionTaskContext = {
  /** 이 요청이 받은 410은 해당 입력의 서버 검사 증거다. */
  confirmedTaskId?: string;
  /** 2xx 요청의 ACK는 호출자가 맡으므로 관련 요청 정리에서 제외한다. */
  completedTaskId?: string;
};

/** 서버의 자기 소유 삭제 증거를 반영한다. 로컬 원본의 귀속과 모순되면 false로 남긴다. */
export const applyConfirmedDeletionInTransaction = async (
  tableName: SyncTableName,
  recordId: string,
  tripId: string,
  deletedAt: string,
  { confirmedTaskId, completedTaskId }: DeletionTaskContext = {},
): Promise<boolean> => {
  if (tableName === 'trips' && tripId !== recordId) {
    throw new Error('삭제 확인 응답의 여행이 일치하지 않습니다');
  }

  const db = getDatabase();
  const userId = requireLocalUserId();
  const table = SYNC_TABLES[tableName];
  const local = await db.select().from(table).where(eq(table.id, recordId)).get();

  if (local && (local.userId !== userId || (tableName !== 'trips' && 'tripId' in local && local.tripId !== tripId))) {
    return false;
  }

  await rememberConfirmedDeletionInTransaction(tableName, recordId, tripId, deletedAt);

  const targets = new Set([`${tableName}:${recordId}`]);

  if (tableName === 'trips') {
    await releaseServerRecordBodiesInTransaction(tripId);

    for (const [name, child] of [
      ['schedules', schedules],
      ['expenses', expenses],
    ] as const) {
      const rows = await db
        .select()
        .from(child)
        .where(and(eq(child.tripId, tripId), eq(child.userId, userId)))
        .all();

      for (const row of rows) {
        targets.add(`${name}:${row.id}`);
      }

      await db
        .update(child)
        .set({ deletedAt })
        .where(and(eq(child.tripId, tripId), eq(child.userId, userId)));
    }

    await db.delete(tripActivations).where(and(eq(tripActivations.tripId, tripId), eq(tripActivations.userId, userId)));
  }

  await db
    .update(table)
    .set({ deletedAt })
    .where(and(eq(table.id, recordId), eq(table.userId, userId)));

  if (tableName === 'schedules') {
    await db
      .update(expenses)
      .set({ scheduleId: null })
      .where(and(eq(expenses.scheduleId, recordId), eq(expenses.userId, userId)));
  }

  await clearRelatedQueueTasksInTransaction(
    { tableName, tripId, userId, targets },
    { confirmedTaskId, completedTaskId },
  );

  const holds = await db.select().from(legacySyncHolds).where(eq(legacySyncHolds.userId, userId)).all();

  for (const hold of holds) {
    if (targets.has(`${hold.tableName}:${hold.recordId}`) || (tableName === 'trips' && hold.tripId === tripId)) {
      await clearLegacyHoldInTransaction(hold.id);
    }
  }

  return true;
};

/** 삭제 범위에 속하고 귀속·저장 가능성이 확인된 요청만 정리한다. */
const clearRelatedQueueTasksInTransaction = async (
  {
    tableName,
    tripId,
    userId,
    targets,
  }: {
    tableName: SyncTableName;
    tripId: string;
    userId: string;
    targets: Set<string>;
  },
  { confirmedTaskId, completedTaskId }: DeletionTaskContext,
): Promise<void> => {
  const db = getDatabase();
  const tasks = await db.select().from(syncQueue).all();

  for (const task of tasks) {
    // 성공 응답의 해당 요청은 호출자가 ACK한다. 여기서는 삭제 증거로 정리할 나머지만 판단한다.
    if (task.id === completedTaskId) {
      continue;
    }

    if (!PENDING_STATES.has(task.status) || !isSyncTable(task.tableName)) {
      continue;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(task.payload);
    } catch {
      continue;
    }

    const savedDelete = task.action === 'DELETE' ? deleteQueuePayloadSchema.safeParse(payload) : undefined;
    const isOwnedDelete = !!savedDelete?.success && savedDelete.data.userId === userId;
    const isOwnedTripDelete =
      tableName === 'trips' && isOwnedDelete && savedDelete?.success && savedDelete.data.tripId === tripId;

    if (
      !targets.has(`${task.tableName}:${task.recordId}`) &&
      !isOwnedTripDelete &&
      !(isOwnedDelete && task.id === confirmedTaskId)
    ) {
      continue;
    }
    // 개별 CREATE는 POST 재전송의 같은 ID·여행 검증과 200 현재 행을 받은 뒤 종결한다.

    if (tableName !== 'trips' && task.action === 'CREATE') {
      continue;
    }

    const originalTable = SYNC_TABLES[task.tableName];
    const original = await db.select().from(originalTable).where(eq(originalTable.id, task.recordId)).get();
    const hasOwnedOriginal =
      original?.userId === userId &&
      (task.tableName === 'trips' ? original.id === tripId : 'tripId' in original && original.tripId === tripId);

    // 저장된 삭제 귀속은 원본이 없을 때의 증거다. 존재하는 원본과 모순되면 정리하지 않는다.
    if (original && !hasOwnedOriginal) {
      continue;
    }

    if (isRecord(payload)) {
      if (
        (payload.userId != null && payload.userId !== userId) ||
        (payload.tripId != null && payload.tripId !== tripId) ||
        (task.action === 'CREATE' && payload.id !== task.recordId)
      ) {
        continue;
      }
    }

    if (task.action === 'DELETE') {
      const isLegacyDelete =
        payload === null ||
        (payload &&
          typeof payload === 'object' &&
          !Array.isArray(payload) &&
          Object.keys(payload).every((key) => key === 'tripId') &&
          (!('tripId' in payload) || payload.tripId === tripId));

      if (!isOwnedDelete && !(hasOwnedOriginal && isLegacyDelete)) {
        continue;
      }
    } else {
      if (!hasOwnedOriginal || !isRecord(payload)) {
        continue;
      }

      if (!isValidDiscardedMutation(task.tableName, task.action, payload, task.id === confirmedTaskId)) {
        continue;
      }
    }

    await db.delete(syncQueue).where(eq(syncQueue.id, task.id));
  }
};

/** 일괄 삭제는 다른 요청의 저장 가능성을 증명하지 않는다. 해당 요청이 받은 410만 서버 검사를 대신한다. */
const isValidDiscardedMutation = (
  tableName: SyncTableName,
  action: string,
  payload: Record<string, unknown>,
  hasServerConfirmation: boolean,
): boolean => {
  if (action === 'UPDATE') {
    const parsed = UPDATE_REQUESTS[tableName].safeParse(payload);

    if (!parsed.success || !Object.keys(parsed.data).some((key) => key !== 'edit')) {
      return false;
    }

    const hasUnsupportedField = Object.keys(payload).some(
      (key) => !ROW_METADATA_FIELDS.has(key) && !Object.hasOwn(parsed.data, key),
    );
    return !hasUnsupportedField && (hasServerConfirmation || canConfirmMutationStorageLocally(tableName, parsed.data));
  }

  if (action === 'CREATE' && tableName !== 'trips') {
    const parsed = CREATE_REQUESTS[tableName].safeParse(payload);
    return parsed.success && (hasServerConfirmation || canConfirmMutationStorageLocally(tableName, parsed.data));
  }

  return false;
};
