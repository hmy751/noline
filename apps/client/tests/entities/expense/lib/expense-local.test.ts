/** @jest-environment node */
import { beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { QueryClient } from '@tanstack/react-query';
import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  trips,
  schedules,
  expenses,
  tripActivations,
  syncQueue,
  syncMetadata,
} from '@/shared/db';
import { useAuthStore } from '@/shared/store/auth';
import {
  getAllExpensesLocal,
  getExpensesByTripIdLocal,
  getExpensesByScheduleIdLocal,
  getExpenseByIdLocal,
  createExpenseLocal,
  updateExpenseLocal,
  deleteExpenseLocal,
} from '@/entities/expense/lib/expense-local';
import { useActivateTrip } from '@/entities/trip/data/useActivateTrip';
import { pullChanges } from '@/shared/services/sync/engine';
import apiClient from '@/shared/api/fetcher';
import syncApiClient from '@/shared/services/sync/api';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual<object>('@tanstack/react-query'),
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({}),
}));
jest.mock('@/shared/api/fetcher', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('@/shared/services/sync/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: async () => 0 }));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { cancelQueries: jest.fn(async () => undefined), invalidateQueries: jest.fn(async () => undefined) },
}));
jest.mock('@/shared/services/offline-map/download', () => ({ downloadOfflineMapInBackground: async () => undefined }));
jest.mock('@/shared/services/directions/route-downloader', () => ({
  downloadRoutesForSchedules: async () => undefined,
}));

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

const now = '2026-10-02T00:00:00Z';
const userId = '01ARZ3NDEKTSV4RRFFQ69G5FA0';
const tripId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const scheduleId = '01ARZ3NDEKTSV4RRFFQ69G5FAW';
const expenseId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
const trip = {
  id: tripId,
  userId,
  name: '여행',
  destination: '서울',
  startDate: now,
  endDate: now,
  createdAt: now,
  updatedAt: now,
};
const row = {
  id: expenseId,
  userId,
  tripId,
  scheduleId,
  title: '기존 경비',
  amount: '12',
  currency: 'USD',
  category: 'food',
  date: '2026-10-02T01:00:00+09:00',
  hasReceipt: false,
  receiptUrl: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  version: 1,
};

beforeEach(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await initializeDatabase();
  await resetDatabase();
  await useAuthStore.getState().saveAndApplySession({ userId, accessToken: 'access', refreshToken: 'refresh' });
  await getDatabase().insert(trips).values(trip);
  await getDatabase()
    .insert(tripActivations)
    .values({
      id: tripId,
      tripId,
      userId,
      isActivated: true,
      activatedAt: now,
      expiresAt: now,
      createdAt: now,
      updatedAt: now,
    });
  await getDatabase()
    .insert(schedules)
    .values({
      id: scheduleId,
      userId,
      tripId,
      title: '일정',
      location: '서울',
      scheduledAt: now,
      createdAt: now,
      updatedAt: now,
    });
  await getDatabase().insert(expenses).values(row);
});
afterEach(() => {
  jest.restoreAllMocks();
});

const rawExpense = () => getDatabase().select().from(expenses).where(eq(expenses.id, expenseId)).get();
const queued = () => getDatabase().select().from(syncQueue).all();

it('세 목록과 단건 읽기가 같은 UTC 날짜를 반환하고 기존 행·큐는 변경하지 않는다', async () => {
  expect((await getAllExpensesLocal())[0].date).toBe('2026-10-01');
  expect((await getExpensesByTripIdLocal(tripId))[0].date).toBe('2026-10-01');
  expect((await getExpensesByScheduleIdLocal(scheduleId))[0].date).toBe('2026-10-01');
  expect((await getExpenseByIdLocal(expenseId))?.date).toBe('2026-10-01');
  expect(rawExpense()?.date).toBe(row.date);
  expect(await queued()).toEqual([]);
});

it('신규 date-only 경비의 반환·DB·큐 날짜가 모두 같다', async () => {
  const input = { ...row, id: '01ARZ3NDEKTSV4RRFFQ69G5FAY', date: '2026-10-03' };
  expect((await createExpenseLocal(input)).date).toBe('2026-10-03');
  const saved = getDatabase().select().from(expenses).where(eq(expenses.id, input.id)).get();
  expect(saved?.date).toBe('2026-10-03');
  expect(JSON.parse((await queued())[0].payload).date).toBe('2026-10-03');
});

it('날짜 없는 부분 수정은 기존 datetime을 보존하고 반환만 날짜로 정리한다', async () => {
  const result = await updateExpenseLocal(expenseId, { title: '수정 경비' });
  expect(result).toMatchObject({ title: '수정 경비', date: '2026-10-01', version: 2 });
  expect(rawExpense()?.date).toBe(row.date);
  expect(JSON.parse((await queued())[0].payload)).toEqual({ title: '수정 경비' });
});

it('잘못된 Local 날짜는 Query 오류가 되고 행·큐는 그대로 둔다', async () => {
  await getDatabase().update(expenses).set({ date: 'invalid' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  try {
    const key = ['expense', 'trip', tripId];
    await expect(
      client.fetchQuery({ queryKey: key, queryFn: () => getExpensesByTripIdLocal(tripId) }),
    ).rejects.toMatchObject({ name: 'ZodError' });
    expect(client.getQueryState(key)?.status).toBe('error');
    expect(rawExpense()?.date).toBe('invalid');
    expect(await queued()).toEqual([]);
  } finally {
    client.clear();
  }
});

it('수정 결과의 날짜 검사가 실패하면 변경된 행·version·큐를 함께 롤백한다', async () => {
  await getDatabase().update(expenses).set({ date: 'invalid' });
  await expect(updateExpenseLocal(expenseId, { title: '실패할 수정' })).rejects.toMatchObject({ name: 'ZodError' });
  expect(rawExpense()).toMatchObject({ title: row.title, date: 'invalid', updatedAt: now, version: 1 });
  expect(await queued()).toEqual([]);
});

it('잘못된 날짜 행도 올바른 날짜로 교정할 수 있다', async () => {
  await getDatabase().update(expenses).set({ date: 'invalid' });
  expect((await updateExpenseLocal(expenseId, { date: '2026-10-03' })).date).toBe('2026-10-03');
  expect(rawExpense()?.date).toBe('2026-10-03');
  expect(JSON.parse((await queued())[0].payload)).toEqual({ date: '2026-10-03' });
});

it('잘못된 날짜 행도 날짜 검사 없이 soft delete와 큐 기록이 가능하다', async () => {
  await getDatabase().update(expenses).set({ date: 'invalid' });
  await expect(deleteExpenseLocal(expenseId)).resolves.toMatchObject({ id: expenseId });
  expect(rawExpense()?.deletedAt).toBeTruthy();
  expect(await getExpensesByTripIdLocal(tripId)).toEqual([]);
  expect((await queued())[0]).toMatchObject({ action: 'DELETE', recordId: expenseId });
});

it('생성 반환 날짜 검사 실패도 행과 큐를 함께 롤백한다', async () => {
  await expect(createExpenseLocal({ ...row, id: '01ARZ3NDEKTSV4RRFFQ69G5FAY', date: 'invalid' })).rejects.toMatchObject(
    { name: 'ZodError' },
  );
  expect(getDatabase().select().from(expenses).all()).toHaveLength(1);
  expect(await queued()).toEqual([]);
});

it.each(['2026-02-30', row.date])(
  'pull의 잘못된 경비 날짜 %s는 어떤 entity 저장과 기준 시각 갱신보다 먼저 거절한다',
  async (date) => {
    jest
      .mocked(syncApiClient.get)
      .mockResolvedValue({
        data: {
          data: {
            trips: [{ ...trip, name: '덮이면 안 됨' }],
            schedules: [],
            expenses: [{ ...row, date }],
            serverTime: now,
          },
        },
      } as never);
    await expect(pullChanges()).rejects.toMatchObject({ name: 'ZodError' });
    expect(getDatabase().select().from(trips).get()?.name).toBe(trip.name);
    expect(rawExpense()?.date).toBe(row.date);
    expect(getDatabase().select().from(syncMetadata).all()).toEqual([]);
  },
);

it('정상 date-only 경비 pull은 그대로 저장하고 다음 기준 시각을 기록한다', async () => {
  jest
    .mocked(syncApiClient.get)
    .mockResolvedValue({
      data: {
        data: { trips: [], schedules: [], expenses: [{ ...row, date: '2026-10-03', version: 2 }], serverTime: now },
      },
    } as never);
  await pullChanges();
  expect(rawExpense()).toMatchObject({ date: '2026-10-03', version: 2 });
  expect(getDatabase().select().from(syncMetadata).get()?.value).toBe(new Date(now).toISOString());
});

it('잘못된 activation 경비는 기존 활성 상태·행을 변경하기 전에 거절한다', async () => {
  const newTripId = '01ARZ3NDEKTSV4RRFFQ69G5FAZ';
  jest
    .mocked(apiClient.post)
    .mockResolvedValue({
      data: { trips: [{ ...trip, id: newTripId }], schedules: [], expenses: [{ ...row, date: 'invalid' }] },
    } as never);
  const mutation = useActivateTrip() as unknown as { mutationFn: (id: string) => Promise<unknown> };
  await expect(mutation.mutationFn(newTripId)).rejects.toMatchObject({ name: 'ZodError' });
  expect(getDatabase().select().from(tripActivations).all()).toEqual([
    expect.objectContaining({ tripId, isActivated: true }),
  ]);
  expect(getDatabase().select().from(trips).all()).toHaveLength(1);
});

it('정상 activation 경비는 date-only로 저장하고 앱에도 같은 날짜를 반환한다', async () => {
  const newTripId = '01ARZ3NDEKTSV4RRFFQ69G5FAZ';
  const newExpenseId = '01ARZ3NDEKTSV4RRFFQ69G5FB0';
  jest
    .mocked(apiClient.post)
    .mockResolvedValue({
      data: {
        trips: [{ ...trip, id: newTripId }],
        schedules: [],
        expenses: [{ ...row, id: newExpenseId, tripId: newTripId, scheduleId: null, date: '2026-10-03' }],
      },
    } as never);
  const mutation = useActivateTrip() as unknown as {
    mutationFn: (id: string) => Promise<{ expenses: (typeof row)[] }>;
  };
  const result = await mutation.mutationFn(newTripId);
  expect(result.expenses[0].date).toBe('2026-10-03');
  expect(getDatabase().select().from(expenses).where(eq(expenses.id, newExpenseId)).get()?.date).toBe('2026-10-03');
});
