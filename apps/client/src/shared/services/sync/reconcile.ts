import { sql, and, eq } from 'drizzle-orm';

import {
  getDatabase,
  type ServerRow,
  type SyncQueueItem,
  type SyncTableName,
  runDatabaseTransaction,
  schedules,
  syncQueue,
  trips,
} from '@/shared/db';
import { editedMarks } from '@/shared/lib/edit-fields';
import { observeFieldEdits } from '@/shared/services/edit-stamp';
import { requireLocalUserId } from '@/shared/store/auth';

import { applyConfirmedDeletionInTransaction } from './confirmed-deletion';
import { readServerRecord, rememberServerRecordInTransaction } from './server-state';
import { SYNC_TABLES } from './sync-tables';

export class AuthoritativeRecordUnavailableError extends Error {
  constructor() {
    super('최신 여행 데이터를 다시 받아야 합니다. 활성화를 다시 시도해주세요.');
  }
}

const IMMUTABLE_OVERLAY_FIELDS = new Set([
  'id',
  'userId',
  'tripId',
  'createdAt',
  'updatedAt',
  'version',
  'fieldEdits',
  'edit',
]);
const PENDING_STATES = new Set(['PENDING', 'FAILED', 'IN_PROGRESS']);

type ReconciliationInput = {
  tableName: SyncTableName;
  server: ServerRow;
  completedTaskId?: string;
};

type LocalRecord = ServerRow & { userId: string };

type ServerAcceptance = { kind: 'preserve' } | { kind: 'accept' | 'reuse'; record: LocalRecord };

type LocalDecision =
  | { kind: 'preserve' }
  | { kind: 'write'; record: LocalRecord }
  | { kind: 'confirm-deletion'; record: LocalRecord; deletedAt: string };

type ReconciliationState = Awaited<ReturnType<typeof prepareReconciliationState>>;

/** 호출자는 이미 DB 실행 경계 안에 있어야 한다. 서버 확인본·Local 반영·요청 완료를 순서대로 확정한다. */
export const reconcileRecordInTransaction = async <Table extends SyncTableName>(
  tableName: Table,
  server: ServerRow<Table>,
  completedTaskId?: string,
): Promise<void> => {
  const state = await prepareReconciliationState({
    tableName,
    server,
    completedTaskId,
  });

  const acceptance = await decideServerAcceptance(state);

  await persistServerAcceptance(state, acceptance);

  const localDecision = await decideLocalRecord(state, acceptance);

  await applyLocalDecision(state, localDecision);

  // pull에는 완료 ID가 없다. 정상 보존도 여기까지 오며, 예외는 ACK 없이 호출자에게 전달한다.
  await acknowledgeCompletedTask(state);
};

const prepareReconciliationState = async (input: ReconciliationInput) => {
  const { tableName, server, completedTaskId } = input;
  const userId = requireLocalUserId();

  if (server.userId !== userId) {
    throw new Error('다른 계정의 동기화 응답입니다');
  }

  const tripId = 'tripId' in server ? server.tripId : server.id;

  await observeFieldEdits('fieldEdits' in server ? server.fieldEdits : undefined);

  if (requireLocalUserId() !== userId) {
    throw new Error('동기화 중 계정이 변경되었습니다');
  }

  const db = getDatabase();
  const table = SYNC_TABLES[tableName];
  const local = await db.select().from(table).where(eq(table.id, server.id)).get();

  if (local && local.userId !== userId) {
    throw new Error('다른 계정의 로컬 기록입니다');
  }

  if (tableName !== 'trips' && local && 'tripId' in local && local.tripId !== tripId) {
    throw new Error('동기화 기록의 여행이 일치하지 않습니다');
  }

  const tasks = await db
    .select()
    .from(syncQueue)
    .where(and(eq(syncQueue.tableName, tableName), eq(syncQueue.recordId, server.id)))
    .orderBy(sql`rowid`)
    .all();

  // 응답과 다른 요청을 ACK하지 않는다. task ID만으로 다른 큐 행을 지우지 않는다.
  if (completedTaskId) {
    const completed = await db.select().from(syncQueue).where(eq(syncQueue.id, completedTaskId)).get();

    if (completed && (completed.tableName !== tableName || completed.recordId !== server.id)) {
      throw new Error('완료할 동기화 요청의 기록이 일치하지 않습니다');
    }
  }

  return { ...input, userId, tripId, local, tasks };
};

const decideServerAcceptance = async (state: ReconciliationState): Promise<ServerAcceptance> => {
  const { tableName, server, completedTaskId, userId, tripId, local } = state;
  const accepted = await readServerRecord(tableName, server.id);

  if (accepted && !(accepted.tripId === null && accepted.deletedAt) && accepted.tripId !== tripId) {
    throw new Error('서버 기록의 여행이 일치하지 않습니다');
  }

  if (accepted?.deletedAt) {
    return { kind: 'preserve' };
  }

  const parentProof = tableName === 'trips' ? undefined : await readServerRecord('trips', tripId);

  if (parentProof?.deletedAt) {
    return { kind: 'preserve' };
  }

  // local.version은 낙관적 저장마다 증가하므로 판정에 사용하지 않는다.
  const isStale = accepted?.version != null && (server.version ?? 1) < accepted.version;
  const canonical = isStale ? accepted.record : server;

  if (!canonical) {
    if (!completedTaskId && (!local || local.deletedAt)) {
      throw new AuthoritativeRecordUnavailableError();
    }

    return { kind: 'preserve' };
  }

  return {
    kind: isStale ? 'reuse' : 'accept',
    record: { ...canonical, userId },
  };
};

const persistServerAcceptance = async (state: ReconciliationState, acceptance: ServerAcceptance): Promise<void> => {
  if (acceptance.kind === 'accept') {
    await rememberServerRecordInTransaction(state.tableName, state.server, state.userId);
  }
};

const decideLocalRecord = async (state: ReconciliationState, acceptance: ServerAcceptance): Promise<LocalDecision> => {
  if (acceptance.kind === 'preserve') {
    return { kind: 'preserve' };
  }

  const { tableName, tripId, userId, local, tasks, completedTaskId } = state;
  const db = getDatabase();
  const baseRecord = acceptance.record;

  if (tableName !== 'trips') {
    const parent = await db.select().from(trips).where(eq(trips.id, tripId)).get();

    if (parent && parent.userId !== userId) {
      throw new Error('다른 계정의 부모 여행입니다');
    }

    // 로컬 숨김·미전송 삭제는 서버 삭제 증거가 아니다. 자식을 다시 노출하지 않되 큐는 보존한다.
    if (!baseRecord.deletedAt && parent?.userId === userId && parent.deletedAt) {
      return { kind: 'preserve' };
    }
  }

  if (baseRecord.deletedAt) {
    return {
      kind: 'confirm-deletion',
      record: baseRecord,
      deletedAt: baseRecord.deletedAt,
    };
  }

  const projection = projectPendingChanges(tableName, baseRecord, local, tasks, completedTaskId);

  if (projection.kind === 'keep-local') {
    return { kind: 'preserve' };
  }

  const merged = projection.record;

  if (tableName === 'expenses' && 'scheduleId' in merged && typeof merged.scheduleId === 'string') {
    const linked = await db.select().from(schedules).where(eq(schedules.id, merged.scheduleId)).get();
    const linkedProof = await readServerRecord('schedules', merged.scheduleId);

    if (
      (linked?.userId === userId && linked.tripId === merged.tripId && linked.deletedAt) ||
      (linkedProof?.deletedAt && (linkedProof.tripId === null || linkedProof.tripId === merged.tripId))
    ) {
      merged.scheduleId = null;
    }
  }

  // 이전 서버가 생략한 필드는 SQLite의 초기값으로 보완한다.
  merged.deletedAt ??= null;
  merged.version ??= 1;

  if ('tripId' in merged) {
    merged.fieldEdits ??= {};
  }

  return { kind: 'write', record: merged };
};

const applyLocalDecision = async (state: ReconciliationState, decision: LocalDecision): Promise<void> => {
  const table = SYNC_TABLES[state.tableName];

  switch (decision.kind) {
    case 'preserve':
      return;

    case 'write':
      await writeLocalRecord(table, decision.record);
      return;

    case 'confirm-deletion':
      // 삭제 본문을 먼저 저장해 아직 기기에 없던 일정 연결도 다시 살아나지 않게 한다.
      await writeLocalRecord(table, decision.record, state.server.version ?? 1);

      await applyConfirmedDeletionInTransaction(state.tableName, state.server.id, state.tripId, decision.deletedAt, {
        completedTaskId: state.completedTaskId,
      });
      return;
  }
};

const acknowledgeCompletedTask = async ({ tableName, server, completedTaskId }: ReconciliationInput): Promise<void> => {
  if (!completedTaskId) {
    return;
  }

  await getDatabase()
    .delete(syncQueue)
    .where(
      and(eq(syncQueue.id, completedTaskId), eq(syncQueue.tableName, tableName), eq(syncQueue.recordId, server.id)),
    );
};

type ProjectionResult = { kind: 'write'; record: LocalRecord } | { kind: 'keep-local' };

/** FIFO 입력을 표시값에 겹친다. 해석할 수 없는 입력은 버리지 않고 기존 Local 표시를 보존한다. */
const projectPendingChanges = (
  tableName: SyncTableName,
  baseRecord: LocalRecord,
  local: { deletedAt: string | null } | undefined,
  tasks: readonly SyncQueueItem[],
  completedTaskId?: string,
): ProjectionResult => {
  const record = { ...baseRecord };

  // 서버 본문은 공유 응답 타입이지만 큐의 표시값은 원시 입력이다. 여기서 검증·정규화하지 않는다.
  const overlay: Record<string, unknown> = record;

  for (const task of tasks) {
    if (task.id === completedTaskId || !PENDING_STATES.has(task.status) || !local) {
      continue;
    }

    if (task.action === 'DELETE') {
      record.deletedAt = local.deletedAt;
      continue;
    }

    let patch: unknown;

    try {
      patch = JSON.parse(task.payload);
    } catch {
      return { kind: 'keep-local' };
    }

    if (
      task.action === 'UPDATE' &&
      (!patch || typeof patch !== 'object' || !Object.keys(patch).some((key) => !IMMUTABLE_OVERLAY_FIELDS.has(key)))
    ) {
      return { kind: 'keep-local' };
    }

    if (
      !patch ||
      typeof patch !== 'object' ||
      ('userId' in patch && patch.userId && patch.userId !== baseRecord.userId)
    ) {
      continue;
    }

    // 같은 ID의 살아 있는 서버 행은 CREATE 재전송의 현재 결과다. 후속 UPDATE만 겹친다.
    if (task.action === 'UPDATE') {
      for (const [field, value] of Object.entries(patch)) {
        if (!IMMUTABLE_OVERLAY_FIELDS.has(field)) {
          overlay[field] = value;
        }
      }

      if (tableName !== 'trips' && 'tripId' in record && 'edit' in patch && patch.edit) {
        overlay.fieldEdits = editedMarks(tableName, patch, patch.edit, record.fieldEdits);
      }
    }
  }

  return { kind: 'write', record };
};

const writeLocalRecord = async (
  table: (typeof SYNC_TABLES)[SyncTableName],
  record: LocalRecord,
  insertVersion: number | undefined = record.version,
): Promise<void> => {
  await getDatabase()
    .insert(table)
    .values({ ...record, version: insertVersion })
    .onConflictDoUpdate({ target: table.id, set: record });
};

export const reconcileServerRecord = async <Table extends SyncTableName>(
  tableName: Table,
  server: ServerRow<Table>,
  completedTaskId?: string,
): Promise<void> => {
  await runDatabaseTransaction(() => reconcileRecordInTransaction(tableName, server, completedTaskId));
};
