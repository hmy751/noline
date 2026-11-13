/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { sql } from 'drizzle-orm';

import { getDatabase, initializeDatabase, resetDatabase, runDatabaseTransaction, schedules, trips } from '@/shared/db';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { reconcileServerRecord } from '@/shared/services/sync/reconcile';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'queue-id' }));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    const { createExpoSQLiteDatabase } =
      jest.requireActual<typeof import('../../helpers/sqlite')>('../../helpers/sqlite');
    return createExpoSQLiteDatabase();
  },
}));

const now = '2026-01-01T00:00:00Z';
const schedule = {
  id: 'schedule-a',
  tripId: 'trip-a',
  userId: 'user-a',
  title: '일정',
  location: '서울',
  address: null,
  scheduledAt: now,
  latitude: null,
  longitude: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  version: 1,
};

beforeEach(async () => {
  useAuthStore.setState({ status: 'signed-in', userId: 'user-a' });
  await initializeDatabase();
  await resetDatabase();
  await getDatabase().insert(trips).values({
    id: 'trip-a',
    userId: 'user-a',
    name: '여행',
    destination: '서울',
    startDate: now,
    endDate: now,
    createdAt: now,
    updatedAt: now,
  });
  await getDatabase().insert(schedules).values(schedule);
});

it('실패한 local transaction의 rollback이 동시에 시작한 sync upsert를 지우지 않는다', async () => {
  let markTransactionStarted!: () => void;
  let releaseTransaction!: () => void;
  const transactionStarted = new Promise<void>((resolve) => {
    markTransactionStarted = resolve;
  });
  const transactionReleased = new Promise<void>((resolve) => {
    releaseTransaction = resolve;
  });
  const failedTransaction = runDatabaseTransaction(async () => {
    markTransactionStarted();
    await transactionReleased;
    throw new Error('local write failed');
  });

  await transactionStarted;
  const reconciliation = reconcileServerRecord('schedules', { ...schedule, id: 'independent', title: 'independent' });
  releaseTransaction();

  await expect(failedTransaction).rejects.toThrow('local write failed');

  await reconciliation;
  const ids = (await getDatabase().select().from(schedules).all()).map(({ id }) => id);
  expect(ids).toContain('independent');
});

it('sync_queue 저장이 실패하면 같은 transaction의 entity 생성도 롤백한다', async () => {
  getDatabase().run(
    sql.raw("CREATE TRIGGER fail_queue BEFORE INSERT ON sync_queue BEGIN SELECT RAISE(ABORT, 'queue failed'); END;"),
  );

  await expect(
    runDatabaseTransaction(async () => {
      await getDatabase()
        .insert(schedules)
        .values({ ...schedule, id: 'new-schedule' });
      await addToSyncQueue('schedules', 'new-schedule', 'CREATE', { ...schedule, id: 'new-schedule' });
    }),
  ).rejects.toThrow('queue failed');

  const ids = (await getDatabase().select().from(schedules).all()).map(({ id }) => id);
  expect(ids).not.toContain('new-schedule');
});
