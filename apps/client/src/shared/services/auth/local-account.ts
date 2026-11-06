import { eq, ne } from 'drizzle-orm';

import { syncActionEnum } from '@repo/schema/sync/sync-queue';

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
    }

    if (hasDifferentOwner) {
      return 'different';
    }

    return hasLocalData ? 'same' : 'empty';
  });
};

/** 기존 큐도 원본 row의 소유자로 검증한다. 소유자를 알 수 없으면 전송하지 않는다. */
export const getQueueOwner = async (task: SyncQueueItem): Promise<string | null> => {
  return runDatabaseOperation(async () => {
    if (task.status === 'QUARANTINED') {
      return null;
    }

    const ownership = await inspectQueueOwnership(task);

    return typeof ownership === 'object' ? ownership.owner : null;
  });
};

/** 원본 없는 작업은 내용·이력을 그대로 격리하고, 격리되지 않은 FIFO를 반환한다. 계정을 추정하지 않는다. */
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

  if (!row) {
    return syncActionEnum.safeParse(task.action).success ? 'orphan' : 'invalid';
  }

  let payload: unknown;

  try {
    payload = JSON.parse(task.payload);
  } catch {
    return 'invalid';
  }

  if (payload && typeof payload === 'object' && 'userId' in payload && payload.userId !== row.userId) {
    return 'invalid';
  }

  return { owner: row.userId };
};

const isOwnedTableName = (tableName: string): tableName is keyof typeof OWNED_TABLES => {
  return Object.prototype.hasOwnProperty.call(OWNED_TABLES, tableName);
};
