/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  initializeDatabase,
  resetDatabase,
  runDatabaseOperation,
  withDatabaseTransactionsPaused,
  getDatabase,
  trips,
  schedules,
  expenses,
  tripActivations,
  syncQueue,
} from '@/shared/db';
import { inspectLocalAccount } from '@/shared/services/auth/local-account';
import { useAuthStore } from '@/shared/store/auth';
import { createScheduleLocal, deleteScheduleLocal } from '@/entities/schedule/lib/schedule-local';
import { createExpenseLocal, deleteExpenseLocal } from '@/entities/expense/lib/expense-local';

let mockFailSql: string | null = null;

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

// 실제 Drizzle SQL과 SQLite를 사용한다. 파일·기기 SecureStore는 사용하지 않는다.
jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/id/ulid', () => ({
  generateId: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (name: string) => TestDatabase }>('node:sqlite');
    const sqlite = new DatabaseSync(':memory:');
    return {
      execSync: (statement: string) => {
        if (mockFailSql && statement.includes(mockFailSql)) {
          mockFailSql = null;
          throw new Error('injected reset failure');
        }
        sqlite.exec(statement);
      },
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
const scheduleInput = {
  id: 'new-schedule',
  tripId: 'trip-a',
  title: '일정',
  address: null,
  location: '장소',
  scheduledAt: now,
};

beforeEach(async () => {
  jest.mocked(logoutApi).mockReset().mockResolvedValue(undefined);
  await initializeDatabase();
  await resetDatabase();
  await useAuthStore.getState().saveAndApplySession({ userId: 'a', accessToken: 'access', refreshToken: 'refresh' });
  for (const [id, userId, active] of [
    ['trip-a', 'a', true],
    ['trip-b', 'b', true],
    ['inactive', 'a', false],
  ] as const) {
    await getDatabase().insert(trips).values({
      id,
      userId,
      name: id,
      destination: '서울',
      startDate: now,
      endDate: now,
      createdAt: now,
      updatedAt: now,
    });
    await getDatabase().insert(tripActivations).values({
      id,
      tripId: id,
      userId,
      isActivated: active,
      activatedAt: now,
      expiresAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await getDatabase()
      .insert(schedules)
      .values({
        id: `schedule-${id}`,
        tripId: id,
        userId,
        title: id,
        location: '서울',
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    await getDatabase()
      .insert(expenses)
      .values({
        id: `expense-${id}`,
        tripId: id,
        userId,
        title: id,
        amount: '1',
        currency: 'USD',
        category: 'food',
        date: now,
        createdAt: now,
        updatedAt: now,
      });
  }
});

import { eq } from 'drizzle-orm';
import { vacuumDeletedRecords } from '@/shared/services/sync/cleanup-job';
import { performLogout } from '@/shared/services/auth/logout-service';
import { logout as logoutApi } from '@/shared/services/auth/auth-api';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';

jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: jest.fn() }));
jest.mock('@/shared/services/auth/auth-api', () => ({ logout: jest.fn(), deleteAccount: jest.fn() }));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(), clear: jest.fn() } }));

beforeEach(async () => {
  for (const table of [expenses, schedules, tripActivations, trips]) {
    await getDatabase().delete(table).where(eq(table.userId, 'b'));
  }
});

it('오래된 삭제 row도 미전송 큐가 참조하면 보존하여 계정 확인을 유지한다', async () => {
  await createScheduleLocal(scheduleInput);
  await deleteScheduleLocal(scheduleInput.id);
  await getDatabase()
    .update(schedules)
    .set({ deletedAt: '2000-01-01T00:00:00Z' })
    .where(eq(schedules.id, scheduleInput.id));
  expect(await inspectLocalAccount('a')).toBe('same');
  await vacuumDeletedRecords();
  const row = await getDatabase().select().from(schedules).where(eq(schedules.id, scheduleInput.id)).get();
  const tasks = await getDatabase().select().from(syncQueue).all();
  expect({ rowExists: Boolean(row), queueLength: tasks.length, account: await inspectLocalAccount('a') }).toEqual({
    rowExists: true,
    queueLength: 2,
    account: 'same',
  });
});

it('로그아웃의 확인과 삭제 사이에는 새 Local 저장을 거절한다', async () => {
  let release!: () => void;
  let started!: () => void;
  const waiting = new Promise<void>((done) => {
    release = done;
  });
  const ready = new Promise<void>((done) => {
    started = done;
  });
  jest.mocked(logoutApi).mockImplementationOnce(async () => {
    started();
    await waiting;
  });
  const logout = performLogout();
  await ready;
  await expect(ScheduleRepository.create(scheduleInput)).rejects.toThrow('잠시 후 다시 저장');
  const before = (await getDatabase().select().from(syncQueue).all()).length;
  release();
  const result = await logout;
  const after = (await getDatabase().select().from(syncQueue).all()).length;
  expect({ success: result.success, before, after }).toEqual({ success: true, before: 0, after: 0 });
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('접수된 로컬 저장이 끝난 뒤 미전송 여부를 확인하고 일반 로그아웃을 보류한다', async () => {
  const blocked = deferred();
  const entered = deferred();
  const databaseWork = runDatabaseOperation(async () => {
    entered.resolve();
    await blocked.promise;
  });
  await entered.promise;
  const save = createScheduleLocal(scheduleInput);
  const logout = performLogout();
  blocked.resolve();
  await Promise.all([databaseWork, save]);
  await expect(logout).resolves.toMatchObject({ success: false, hasPendingSync: true, pendingCount: 1 });
  expect(logoutApi).not.toHaveBeenCalled();
  expect((await getDatabase().select().from(syncQueue).all()).length).toBe(1);
  // 보류 뒤 새 저장은 다시 허용한다.
  await expect(createScheduleLocal({ ...scheduleInput, id: 'after-cancel' })).resolves.toMatchObject({
    id: 'after-cancel',
  });
});

it('DB 재생성 실패는 이미 지운 큐와 테이블도 함께 복구한다', async () => {
  await createScheduleLocal(scheduleInput);
  mockFailSql = 'CREATE TABLE IF NOT EXISTS trips';
  await expect(resetDatabase()).rejects.toThrow('injected reset failure');
  await initializeDatabase();
  expect((await getDatabase().select().from(syncQueue).all()).length).toBe(1);
  expect(await getDatabase().select().from(schedules).where(eq(schedules.id, scheduleInput.id)).get()).toBeTruthy();
});

it.each(['PENDING', 'IN_PROGRESS', 'FAILED'] as const)(
  '%s 경비 큐가 남아 있으면 vacuum에서 원본을 보존한다',
  async (status) => {
    await createExpenseLocal({
      id: 'queued-expense',
      scheduleId: null,
      hasReceipt: false,
      receiptUrl: null,
      tripId: 'trip-a',
      title: '보존',
      amount: '1',
      currency: 'USD',
      category: 'food',
      date: now,
    });
    await deleteExpenseLocal('queued-expense');
    await getDatabase()
      .update(expenses)
      .set({ deletedAt: '2000-01-01T00:00:00Z' })
      .where(eq(expenses.id, 'queued-expense'));
    await getDatabase().update(syncQueue).set({ status });
    expect((await vacuumDeletedRecords()).expenses).toBe(0);
    expect(await inspectLocalAccount('a')).toBe('same');
    await getDatabase().delete(syncQueue);
    expect((await vacuumDeletedRecords()).expenses).toBe(1);
  },
);

it('세션 변경 절차가 실패해도 로컬 transaction 차단을 해제한다', async () => {
  await expect(
    withDatabaseTransactionsPaused(async () => {
      throw new Error('failed');
    }),
  ).rejects.toThrow('failed');
  await expect(createScheduleLocal(scheduleInput)).resolves.toMatchObject({ id: scheduleInput.id });
});
