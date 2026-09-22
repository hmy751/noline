import { eq } from 'drizzle-orm';
import {
  getDatabase,
  runDatabaseOperation,
  trips,
  schedules,
  expenses,
  tripActivations,
  syncQueue,
  type SyncQueueItem,
} from '@/shared/db';

const OWNED_TABLES = { trips, schedules, expenses };
type LocalAccount = 'empty' | 'same' | 'different' | 'unresolved';

/** 기존 큐도 원본 row의 소유자로 검증한다. 소유자를 알 수 없으면 전송하지 않는다. */
export async function getQueueOwner(task: SyncQueueItem): Promise<string | null> {
  return runDatabaseOperation(() => readQueueOwner(task));
}

async function readQueueOwner(task: SyncQueueItem): Promise<string | null> {
  const table = OWNED_TABLES[task.tableName as keyof typeof OWNED_TABLES];
  if (!table) {
    return null;
  }

  const row = await getDatabase().select({ userId: table.userId }).from(table).where(eq(table.id, task.recordId)).get();
  if (!row) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(task.payload);
    if (payload && typeof payload === 'object' && 'userId' in payload && payload.userId !== row.userId) {
      return null;
    }
  } catch {
    return null;
  }
  return row.userId;
}

/** 메모리의 이전 사용자 유무와 무관하게 DB와 남아 있는 큐를 검사한다. */
export async function inspectLocalAccount(userId: string): Promise<LocalAccount> {
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
      const owner = await readQueueOwner(task);
      if (!owner) {
        return 'unresolved';
      }
      hasDifferentOwner ||= owner !== userId;
    }

    if (hasDifferentOwner) {
      return 'different';
    }
    return hasLocalData || tasks.length > 0 ? 'same' : 'empty';
  });
}
