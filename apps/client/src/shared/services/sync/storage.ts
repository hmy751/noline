import { eq } from 'drizzle-orm';

import { syncPullQuerySchema } from '@repo/schema/sync/sync-status';

import { getDatabase, runDatabaseOperation } from '@/shared/db';
import { syncMetadata } from '@/shared/db/schema';
import { getCurrentISOString } from '@/shared/db/utils';
import { requireLocalUserId } from '@/shared/store/auth';

const LAST_SYNCED_KEY = 'lastSyncedAt';

// 한 계정에서 활성 여행 집합이 바뀌면 새 범위의 전체 데이터를 먼저 읽는다.
const serializePullScope = (tripIds: readonly string[]): string => {
  return JSON.stringify([...new Set(tripIds)].sort());
};

export const getPullCursor = async (userId: string, tripIds: readonly string[]): Promise<string | undefined> => {
  const row = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(syncMetadata)
      .where(eq(syncMetadata.key, `pullCursor:${userId}`))
      .get(),
  );

  if (!row) {
    return undefined;
  }

  try {
    const { scope, cursor } = JSON.parse(row.value);

    if (scope !== serializePullScope(tripIds)) {
      return undefined;
    }

    const parsed = syncPullQuerySchema.shape.cursor.safeParse(cursor);

    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

/** Pull의 본문 반영과 같은 transaction에서만 호출한다. */
export const setPullCheckpointInTransaction = async (
  userId: string,
  tripIds: readonly string[],
  cursor: string | undefined,
  serverTime: Date,
): Promise<void> => {
  requireLocalUserId(userId);

  const updatedAt = getCurrentISOString();
  const value = JSON.stringify({ scope: serializePullScope(tripIds), cursor });

  for (const entry of [
    { key: `pullCursor:${userId}`, value },
    { key: LAST_SYNCED_KEY, value: serverTime.toISOString() },
  ]) {
    await getDatabase()
      .insert(syncMetadata)
      .values({ ...entry, updatedAt })
      .onConflictDoUpdate({ target: syncMetadata.key, set: { value: entry.value, updatedAt } });
  }

  requireLocalUserId(userId);
};
