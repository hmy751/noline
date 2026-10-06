/** @jest-environment node */
import { sql } from 'drizzle-orm';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { getDatabase, initializeDatabase, resetDatabase, runDatabaseTransaction, schedules, trips } from '@/shared/db';
import { upsertSchedules } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';

interface TestDatabase {
  exec: (sql: string) => void;
  prepare: (sql: string) => TestStatement;
}

interface TestStatement {
  setReturnArrays?: (enabled: boolean) => void;
  columns: () => Array<{ name: string }>;
  all: (...params: unknown[]) => unknown[];
  run: (...params: unknown[]) => { changes: number; lastInsertRowId: number };
}

function mockReadRows(statement: TestStatement, params: unknown[]): unknown[][] {
  const columns = statement.columns();
  if (statement.setReturnArrays) {
    statement.setReturnArrays(true);
    return statement.all(...params) as unknown[][];
  }

  return (statement.all(...params) as Array<Record<string, unknown>>).map((row) =>
    columns.map(({ name }) => row[name]),
  );
}

jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'queue-id' }));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (name: string) => TestDatabase }>('node:sqlite');
    const sqlite = new DatabaseSync(':memory:');

    return {
      execSync: (statement: string) => sqlite.exec(statement),
      getAllSync: (query: string) => sqlite.prepare(query).all(),
      prepareSync: (query: string) => ({
        executeForRawResultSync: (params: unknown[]) => {
          const statement = sqlite.prepare(query);
          const rows = mockReadRows(statement, params);
          return { getAllSync: () => rows };
        },
        executeSync: (params: unknown[]) => {
          const statement = sqlite.prepare(query);
          if (statement.columns().length) {
            const rows = mockReadRows(statement, params);
            return { getAllSync: () => rows, getFirstSync: () => rows[0] ?? null };
          }
          return statement.run(...params);
        },
      }),
    };
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
  const upsert = upsertSchedules([{ ...schedule, id: 'independent', title: 'independent' }]);
  releaseTransaction();

  await expect(failedTransaction).rejects.toThrow('local write failed');
  await upsert;
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
