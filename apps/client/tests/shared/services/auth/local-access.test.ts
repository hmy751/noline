/** @jest-environment node */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  initializeDatabase,
  resetDatabase,
  getDatabase,
  trips,
  schedules,
  expenses,
  tripActivations,
  syncQueue,
} from '@/shared/db';
import { getQueueOwner, inspectLocalAccount } from '@/shared/services/auth/local-account';
import { useAuthStore } from '@/shared/store/auth';
import { getTripsLocal, getTripByIdLocal, updateTripLocal } from '@/entities/trip/lib/trip-local';
import {
  getSchedulesLocal,
  createScheduleLocal,
  updateScheduleLocal,
  deleteScheduleLocal,
} from '@/entities/schedule/lib/schedule-local';
import { getExpensesByTripIdLocal, createExpenseLocal } from '@/entities/expense/lib/expense-local';
import { getTripActivationStatus } from '@/shared/services/offline-prep/metadata';

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
      execSync: (statement: string) => sqlite.exec(statement),
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

describe.each(['signed-in', 'reauth-required'] as const)('%s의 활성 여행 접근', (status) => {
  beforeEach(() => useAuthStore.setState({ status }));

  it('조회는 자기 계정으로 제한하고 재인증 중에는 활성 여행만 보인다', async () => {
    const list = await getTripsLocal();
    expect(list.map((trip) => trip.id)).toEqual(expect.not.arrayContaining(['trip-b']));
    if (status === 'reauth-required') {
      expect(list.map((trip) => trip.id)).toEqual(['trip-a']);
    }
    expect(await getTripByIdLocal('trip-b')).toBeUndefined();
    expect(await getSchedulesLocal('trip-b')).toEqual([]);
    expect(await getExpensesByTripIdLocal('trip-b')).toEqual([]);
    expect(await getTripActivationStatus('trip-b')).toBe(false);
  });

  it('기존 활성 여행에서 만료일과 무관하게 생성·수정·삭제와 큐 기록을 허용한다', async () => {
    await createScheduleLocal(scheduleInput);
    await updateScheduleLocal('new-schedule', { title: '수정' });
    await deleteScheduleLocal('new-schedule');
    expect(await getSchedulesLocal('trip-a')).toHaveLength(1);
    expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(3);
  });

  it('다른 계정 데이터와 활성화하지 않은 여행의 로컬 수정을 거절하며 큐도 만들지 않는다', async () => {
    await expect(updateTripLocal('trip-b', { name: '침범' })).rejects.toThrow();
    await expect(updateScheduleLocal('schedule-trip-b', { title: '침범' })).rejects.toThrow();
    await expect(createScheduleLocal({ ...scheduleInput, tripId: 'inactive' })).rejects.toThrow();
    await expect(createScheduleLocal({ ...scheduleInput, userId: 'b' })).rejects.toThrow();
    await expect(
      createExpenseLocal({
        id: 'new-expense',
        scheduleId: null,
        hasReceipt: false,
        receiptUrl: null,
        tripId: 'trip-b',
        title: '침범',
        amount: '1',
        currency: 'USD',
        category: 'food',
        date: now,
      }),
    ).rejects.toThrow();
    expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  });
});

it('큐 소유자는 원본 row와 payload 계정을 함께 확인한다', async () => {
  const task = {
    id: 'queue',
    tableName: 'schedules',
    recordId: 'schedule-trip-a',
    action: 'UPDATE',
    payload: '{}',
    status: 'PENDING',
    retryCount: 0,
    createdAt: now,
    updatedAt: null,
  };
  expect(await getQueueOwner(task)).toBe('a');
  expect(await getQueueOwner({ ...task, payload: '{"userId":"b"}' })).toBeNull();
  expect(await getQueueOwner({ ...task, recordId: 'missing' })).toBeNull();
  expect(await inspectLocalAccount('a')).toBe('different');
});
