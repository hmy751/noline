import { eq, ne } from 'drizzle-orm';

import { deleteQueuePayloadSchema, syncActionEnum } from '@repo/schema/sync/sync-queue';

import {
  expenses,
  getDatabase,
  runDatabaseOperation,
  schedules,
  syncQueue,
  type SyncQueueItem,
  tripActivations,
  trips,
} from '@/shared/db';

type LocalAccount = 'empty' | 'same' | 'different' | 'unresolved';
type QueueOwnership = { owner: string } | 'orphan' | 'invalid';

const OWNED_TABLES = { trips, schedules, expenses };

/** 메모리의 이전 사용자 유무와 무관하게 DB와 남아 있는 큐를 검사한다. */
export const inspectLocalAccount = async (userId: string): Promise<LocalAccount> => {
  return runDatabaseOperation(async () => {
    let hasLocalData = false;
    let hasDifferentOwner = false;

    for (const table of [...Object.values(OWNED_TABLES), tripActivations]) {
      const owners = await getDatabase().select({ userId: table.userId }).from(table).all();

      hasDifferentOwner ||= owners.some((owner) => owner.userId !== userId);
      hasLocalData ||= owners.length > 0;
    }

    const tasks = await getDatabase().select().from(syncQueue).all();

    for (const task of tasks) {
      const ownership = await inspectAndQuarantine(task);

      if (ownership === 'orphan') {
        continue;
      }

      if (ownership === 'invalid') {
        return 'unresolved';
      }

      hasDifferentOwner ||= ownership.owner !== userId;
      hasLocalData = true;
    }

    if (hasDifferentOwner) {
      return 'different';
    }

    return hasLocalData ? 'same' : 'empty';
  });
};

/** 원본이나 삭제할 때 저장한 소유자로 검증한다. 격리된 작업은 다시 전송하지 않는다. */
export const getQueueOwner = async (task: SyncQueueItem): Promise<string | null> => {
  return runDatabaseOperation(async () => {
    if (task.status === 'QUARANTINED') {
      return null;
    }

    const ownership = await inspectQueueOwnership(task);

    return typeof ownership === 'object' ? ownership.owner : null;
  });
};

/** 원본도 소유권 근거도 없는 작업을 격리한 뒤 나머지를 생성 순서대로 반환한다. */
export const quarantineOrphanedTasks = async (status?: 'IN_PROGRESS'): Promise<SyncQueueItem[]> => {
  return runDatabaseOperation(async () => {
    const tasks = await getDatabase()
      .select()
      .from(syncQueue)
      .where(status ? eq(syncQueue.status, status) : ne(syncQueue.status, 'QUARANTINED'))
      .orderBy(syncQueue.createdAt)
      .all();
    const unquarantinedTasks: SyncQueueItem[] = [];

    for (const task of tasks) {
      const ownership = await inspectAndQuarantine(task);

      if (ownership !== 'orphan') {
        unquarantinedTasks.push(task);
      }
    }

    return unquarantinedTasks;
  });
};

const inspectAndQuarantine = async (task: SyncQueueItem): Promise<QueueOwnership> => {
  if (task.status === 'QUARANTINED') {
    return 'orphan';
  }

  const ownership = await inspectQueueOwnership(task);

  if (ownership === 'orphan') {
    await getDatabase().update(syncQueue).set({ status: 'QUARANTINED' }).where(eq(syncQueue.id, task.id));
  }

  return ownership;
};

const inspectQueueOwnership = async (task: SyncQueueItem): Promise<QueueOwnership> => {
  if (!isOwnedTableName(task.tableName)) {
    return 'invalid';
  }

  const table = OWNED_TABLES[task.tableName];
  const row = await getDatabase().select({ userId: table.userId }).from(table).where(eq(table.id, task.recordId)).get();

  if (!row && task.action !== 'DELETE') {
    return syncActionEnum.safeParse(task.action).success ? 'orphan' : 'invalid';
  }

  let payload: unknown;

  try {
    payload = JSON.parse(task.payload);
  } catch {
    return row ? 'invalid' : 'orphan';
  }

  if (!row) {
    // DELETE만 삭제 권한을 확인한 시점에 소유자를 기록한다. 구버전 payload에는 이를 추정하지 않는다.
    const saved = deleteQueuePayloadSchema.safeParse(payload);

    return saved.success ? { owner: saved.data.userId } : 'orphan';
  }

  if (payload && typeof payload === 'object' && 'userId' in payload && payload.userId !== row.userId) {
    return 'invalid';
  }

  return { owner: row.userId };
};

const isOwnedTableName = (tableName: string): tableName is keyof typeof OWNED_TABLES => {
  return Object.prototype.hasOwnProperty.call(OWNED_TABLES, tableName);
};
