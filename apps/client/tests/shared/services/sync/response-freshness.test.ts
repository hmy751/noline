/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { eq, sql } from 'drizzle-orm';

import { getExpensesByTripIdLocal } from '@/entities/expense/lib/expense-local';
import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { getSchedulesLocal } from '@/entities/schedule/lib/schedule-local';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { fetchAllTrips } from '@/entities/trip/api/trips';
import { useActivateTrip as getActivationOptions } from '@/entities/trip/data/useActivateTrip';
import { useDeactivateTrip as getDeactivationOptions } from '@/entities/trip/data/useDeactivateTrip';
import { refreshTripListLocal } from '@/entities/trip/lib/trip-local';
import { TripRepository } from '@/entities/trip/repository/trip-repository';
import apiClient from '@/shared/api/fetcher';
import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  expenses,
  schedules,
  trips,
  syncQueue,
  tripActivations,
  serverRecords,
  syncMetadata,
  runDatabaseTransaction,
} from '@/shared/db';
import { observeFieldEdits } from '@/shared/services/edit-stamp';
import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { withTripOperation } from '@/shared/services/offline-prep/trip-operation';
import syncApi from '@/shared/services/sync/api';
import { preserveLegacyHold, clearLegacyHold } from '@/shared/services/sync/legacy-holds';
import { processPendingCleanups, forceCleanupTrip, vacuumDeletedRecords } from '@/shared/services/sync/cleanup-job';
import { pullChanges } from '@/shared/services/sync/engine';
import { reconcileServerRecord } from '@/shared/services/sync/reconcile';
import { applyConfirmedDeletionInTransaction } from '@/shared/services/sync/confirmed-deletion';
import { getPullCursor, setPullCheckpointInTransaction } from '@/shared/services/sync/storage';
import { AuthRequiredError, useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('@/shared/services/sync/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/shared/services/sync/legacy-holds', () => ({
  ...jest.requireActual<object>('@/shared/services/sync/legacy-holds'),
  synchronizeLegacyHolds: async () => undefined,
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: (options: unknown) => options, useQueryClient: () => ({}) }));
jest.mock('@/shared/api/fetcher', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: jest.fn(async () => undefined) }));
jest.mock('@/shared/services/offline-map/download', () => ({
  downloadOfflineMapInBackground: jest.fn(async () => undefined),
}));
jest.mock('@/shared/services/directions/route-downloader', () => ({
  downloadRoutesForSchedules: jest.fn(async () => undefined),
}));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { cancelQueries: async () => undefined, invalidateQueries: async () => undefined },
}));
jest.mock('@/shared/services/edit-stamp', () => ({
  ...jest.requireActual<typeof import('@/shared/services/edit-stamp')>('@/shared/services/edit-stamp'),
  observeFieldEdits: jest.fn(async () => undefined),
  allocateEdit: async () => ({ time: '2026-11-10T00:00:00.000Z', sequence: 1, id: 'edit' }),
}));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'activation' }));
const FIXTURE_TIME = '2026-11-10T00:00:00.000Z';
const TRIP = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  name: '여행',
  destination: '서울',
  country: null,
  baseCurrency: 'USD',
  latitude: null,
  longitude: null,
  cityId: null,
  timeZone: 'Asia/Seoul',
  startDate: FIXTURE_TIME,
  endDate: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
};
const SCHEDULE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
  userId: TRIP.userId,
  tripId: TRIP.id,
  title: '기존 제목',
  location: '서울',
  address: null,
  latitude: null,
  longitude: null,
  scheduledAt: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
  fieldEdits: {},
};
const EXPENSE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
  userId: TRIP.userId,
  tripId: TRIP.id,
  scheduleId: SCHEDULE.id,
  title: '식사',
  amount: '25',
  currency: 'USD',
  category: 'food',
  date: '2026-11-10',
  hasReceipt: false,
  receiptUrl: null,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  version: 1,
  deletedAt: null,
  fieldEdits: {},
};
const EDIT_STAMP = { time: FIXTURE_TIME, sequence: 1, id: 'edit' };
const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const enqueueTestTask = async (id: string, patch: object) => {
  await getDatabase()
    .insert(syncQueue)
    .values({
      id,
      tableName: 'expenses',
      recordId: EXPENSE.id,
      action: 'UPDATE',
      payload: JSON.stringify(patch),
      createdAt: FIXTURE_TIME,
    });
};

const activateTripForTest = async () => {
  return (
    getActivationOptions() as unknown as {
      mutationFn: (id: string) => Promise<{ tripId: string; alreadyActivated: boolean }>;
    }
  ).mutationFn(TRIP.id);
};

const deactivateAndClearTripForTest = () =>
  (
    getDeactivationOptions() as unknown as {
      mutationFn: (input: { tripId: string; cleanupData: boolean }) => Promise<unknown>;
    }
  ).mutationFn({ tripId: TRIP.id, cleanupData: true });

beforeEach(async () => {
  jest.clearAllMocks();

  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  useAuthStore.setState({ status: 'signed-in', userId: TRIP.userId, sessionId: Symbol('session') });
  jest
    .spyOn(useAuthStore, 'isCurrentSession')
    .mockImplementation((id): id is symbol => id === useAuthStore.getState().sessionId);

  await initializeDatabase();
  await resetDatabase();
  await getDatabase().insert(trips).values(TRIP);
  await getDatabase().insert(schedules).values(SCHEDULE);
  await getDatabase().insert(expenses).values(EXPENSE);
});

it('낙관적 local version보다 서버에서 실제 수신한 판본끼리 비교한다', async () => {
  await getDatabase().update(expenses).set({ version: 90, amount: '35' });
  await enqueueTestTask('pending', { amount: '35', currency: 'USD', edit: EDIT_STAMP });
  await reconcileServerRecord('expenses', { ...EXPENSE, version: 2, category: 'transport' });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    version: 2,
    amount: '35',
    category: 'transport',
  });

  await reconcileServerRecord('expenses', { ...EXPENSE, version: 1, category: 'shopping' });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '35', category: 'transport' });
});

it('25 서버 원본 위의 pending35를 오래된 ACK 뒤 25로 수렴하고 독립 pending 제목을 남긴다', async () => {
  await enqueueTestTask('old', { amount: '30', currency: 'USD', edit: EDIT_STAMP });
  await enqueueTestTask('amount', { amount: '35', currency: 'USD', edit: { ...EDIT_STAMP, sequence: 2 } });
  await enqueueTestTask('title', { title: '다음 입력', edit: { ...EDIT_STAMP, sequence: 3 } });
  await reconcileServerRecord('expenses', { ...EXPENSE, version: 4, amount: '25', category: 'transport' });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '35', title: '다음 입력' });

  await reconcileServerRecord('expenses', { ...EXPENSE, version: 2, amount: '30' }, 'old');
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    amount: '35',
    category: 'transport',
    title: '다음 입력',
  });

  await reconcileServerRecord('expenses', { ...EXPENSE, version: 3, amount: '35' }, 'amount');
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    amount: '25',
    category: 'transport',
    title: '다음 입력',
  });
  expect((await getDatabase().select().from(syncQueue).all()).map((task) => task.id)).toEqual(['title']);
});

it('다른 기록의 task ID는 오래된 응답으로도 ACK하지 않는다', async () => {
  await enqueueTestTask('mine', { title: '보존', edit: EDIT_STAMP });
  await expect(reconcileServerRecord('expenses', { ...EXPENSE, id: 'other' }, 'mine')).rejects.toThrow();
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(1);
});

it.each(['expenses', 'schedules'] as const)(
  '버전 없는 %s 삭제는 vacuum 뒤에도 오래된 응답과 연결 부활을 막는다',
  async (name) => {
    const record = name === 'expenses' ? EXPENSE : SCHEDULE;
    await runDatabaseTransaction(() =>
      applyConfirmedDeletionInTransaction(name, record.id, TRIP.id, '2020-01-01T00:00:00.000Z'),
    );
    await vacuumDeletedRecords();
    await reconcileServerRecord(name, { ...record, version: 50 });
    const table = name === 'expenses' ? expenses : schedules;
    expect(await getDatabase().select().from(table).all()).toEqual([]);
    if (name === 'schedules') {
      await reconcileServerRecord('expenses', EXPENSE);
      expect(await getDatabase().select().from(expenses).get()).toMatchObject({ scheduleId: null });
    }
  },
);

it('일반 활성화 HTTP가 늦게 끝나도 최신 값·만료일을 저장하고 경로 준비를 요청한다', async () => {
  const response = createDeferred<unknown>();
  jest.mocked(apiClient.post<unknown, unknown>).mockReturnValueOnce(response.promise);
  const pending = activateTripForTest();
  await reconcileServerRecord('trips', { ...TRIP, version: 3, endDate: '2026-11-20T00:00:00.000Z' });
  await reconcileServerRecord('schedules', { ...SCHEDULE, version: 3, title: '새 서버 제목' });
  await reconcileServerRecord('expenses', { ...EXPENSE, version: 3, category: 'transport' });
  response.resolve({ success: true, data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] } });
  const result = await pending;
  expect(result).toEqual({ tripId: TRIP.id, alreadyActivated: false });
  expect(await getSchedulesLocal(TRIP.id)).toEqual([expect.objectContaining({ title: '새 서버 제목' })]);
  expect(await getExpensesByTripIdLocal(TRIP.id)).toEqual([expect.objectContaining({ category: 'transport' })]);
  expect(downloadRoutesForSchedules).toHaveBeenCalledWith({ tripId: TRIP.id });
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({
    expiresAt: '2026-11-27T15:00:00.000Z',
  });
});

it('일반 활성화 HTTP 도중 받은 여행 삭제를 보존하고 활성화·다운로드를 시작하지 않는다', async () => {
  const response = createDeferred<unknown>();
  jest.mocked(apiClient.post<unknown, unknown>).mockReturnValueOnce(response.promise);
  const pending = activateTripForTest();
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  response.resolve({ success: true, data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] } });
  await expect(pending).rejects.toThrow('삭제된 여행');
  expect(await getDatabase().select().from(tripActivations).all()).toEqual([]);
  expect(downloadOfflineMapInBackground).not.toHaveBeenCalled();
  expect(downloadRoutesForSchedules).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
});

it('계정 전체 목록도 판본·확정 삭제 증거를 따르고 기존 숨김은 되살릴 수 있다', async () => {
  const session = useAuthStore.getState().sessionId;
  await reconcileServerRecord('trips', { ...TRIP, version: 4, name: '새 서버 여행' });
  await refreshTripListLocal([TRIP], session);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ name: '새 서버 여행' });

  await refreshTripListLocal([], session);
  await refreshTripListLocal([{ ...TRIP, version: 4, name: '새 서버 여행' }], session);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ deletedAt: null });

  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  await refreshTripListLocal([{ ...TRIP, version: 99 }], session);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
});

it('기기 사본 정리는 서버 원문도 지우고 같은 서버 판본으로 재활성화할 수 있다', async () => {
  await reconcileServerRecord('schedules', SCHEDULE);
  await reconcileServerRecord('expenses', EXPENSE);
  await forceCleanupTrip(TRIP.id);
  expect((await getDatabase().select().from(serverRecords).all()).every((state) => state.record === null)).toBe(true);

  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
    success: true,
    data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] },
  });
  await activateTripForTest();
  expect(await getSchedulesLocal(TRIP.id)).toHaveLength(1);
  expect(await getExpensesByTripIdLocal(TRIP.id)).toHaveLength(1);
});

it('비활성 여행 직접 수정 응답이 최신 목록을 되돌리지 않고 직접 삭제 증거도 늦은 목록을 막는다', async () => {
  const response = createDeferred<unknown>();
  jest.mocked(apiClient.put<unknown, unknown>).mockReturnValueOnce(response.promise);
  const pending = TripRepository.update(TRIP.id, { name: '옛 수정' });
  await refreshTripListLocal([{ ...TRIP, version: 4, name: '새 서버 여행' }], useAuthStore.getState().sessionId);
  response.resolve({ success: true, data: { ...TRIP, version: 2, name: '옛 수정' } });
  expect(await pending).toMatchObject({ name: '새 서버 여행' });

  jest
    .mocked(apiClient.delete<unknown, unknown>)
    .mockResolvedValueOnce({ success: true, data: { id: TRIP.id, deletedAt: FIXTURE_TIME } });
  await TripRepository.delete(TRIP.id);
  await refreshTripListLocal([TRIP], useAuthStore.getState().sessionId);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
});

it('조회 시작 뒤 생성·확인한 여행은 늦은 빈 목록으로 숨기지 않고 다음 실제 누락은 숨긴다', async () => {
  const response = createDeferred<unknown>();
  const requested = createDeferred<void>();
  jest.mocked(apiClient.get<unknown, unknown>).mockImplementationOnce(async () => {
    requested.resolve();
    return await response.promise;
  });
  const pending = TripRepository.getAllWithSource();
  await requested.promise;
  await reconcileServerRecord('trips', { ...TRIP, version: 4, name: '조회 중 확인한 값' });
  const created = { ...TRIP, id: '01ARZ3NDEKTSV4RRFFQ69G5FB0', name: '방금 생성' };
  await getDatabase().insert(trips).values(created);
  response.resolve({ success: true, data: [] });
  expect((await pending).trips.map((row) => row.name)).toEqual(
    expect.arrayContaining(['조회 중 확인한 값', '방금 생성']),
  );

  jest.mocked(apiClient.get<unknown, unknown>).mockResolvedValueOnce({ success: true, data: [] });
  expect((await TripRepository.getAllWithSource()).trips).toEqual([]);
});

it('렌더링할 자식이 없는 확정 여행 삭제도 남은 서버 원문을 지운다', async () => {
  await reconcileServerRecord('expenses', EXPENSE);
  await getDatabase().delete(expenses).where(eq(expenses.id, EXPENSE.id));
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  expect((await getDatabase().select().from(serverRecords).all()).every((state) => state.record === null)).toBe(true);
});

it('일반 비활성화의 즉시 정리도 서버 원문을 같이 버린다', async () => {
  await reconcileServerRecord('schedules', SCHEDULE);
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
    success: true,
    data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] },
  });
  await activateTripForTest();
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({ success: true });
  await deactivateAndClearTripForTest();
  expect((await getDatabase().select().from(serverRecords).all()).every((state) => state.record === null)).toBe(true);
});

it('구버전의 판본 없는 여행 목록은 메타데이터 pull 판본과 삭제를 수신한다', async () => {
  const oldTrip = { ...TRIP, version: undefined };
  jest
    .mocked(apiClient.get<unknown, unknown>)
    .mockResolvedValueOnce({ success: true, data: [oldTrip] })
    .mockResolvedValueOnce({
      success: true,
      data: {
        trips: [{ ...TRIP, version: 8, name: '최근 서버 여행' }],
        schedules: [],
        expenses: [],
        serverTime: FIXTURE_TIME,
      },
    });
  expect((await fetchAllTrips()).data).toEqual([expect.objectContaining({ version: 8, name: '최근 서버 여행' })]);
  expect(apiClient.get).toHaveBeenLastCalledWith('/api/sync/pull');

  jest
    .mocked(apiClient.get<unknown, unknown>)
    .mockClear()
    .mockResolvedValueOnce({ success: true, data: [TRIP] });
  await fetchAllTrips();
  expect(apiClient.get).toHaveBeenCalledTimes(1);
});

it.each(['schedules', 'expenses'] as const)(
  '비활성 %s PUT가 먼저 시작되면 확인 뒤 활성화 snapshot을 받으며 비활성 본문을 저장하지 않는다',
  async (tableName) => {
    const response = createDeferred<unknown>();
    const requested = createDeferred<void>();
    const row = tableName === 'schedules' ? SCHEDULE : EXPENSE;
    const repository = tableName === 'schedules' ? ScheduleRepository : ExpenseRepository;
    jest.mocked(apiClient.put<unknown, unknown>).mockImplementationOnce(async () => {
      requested.resolve();
      return await response.promise;
    });
    const mutation = repository.update(row.id, TRIP.id, { title: '최신 입력', edit: EDIT_STAMP });
    await requested.promise;
    jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
      success: true,
      data: {
        trips: [TRIP],
        schedules: [{ ...SCHEDULE, ...(tableName === 'schedules' ? { title: '최신 입력', version: 4 } : {}) }],
        expenses: [{ ...EXPENSE, ...(tableName === 'expenses' ? { title: '최신 입력', version: 4 } : {}) }],
      },
    });
    const activation = activateTripForTest();
    expect(apiClient.post).not.toHaveBeenCalled();

    response.resolve({ success: true, data: { ...row, title: '최신 입력', version: 4 } });
    await mutation;
    const table = tableName === 'schedules' ? schedules : expenses;
    // 본문 수신은 활성화 응답의 transaction만 맡는다.
    expect(await getDatabase().select().from(table).get()).toMatchObject({ title: row.title });

    await activation;
    const readRecords = tableName === 'schedules' ? getSchedulesLocal : getExpensesByTripIdLocal;
    expect(await readRecords(TRIP.id)).toEqual([expect.objectContaining({ title: '최신 입력' })]);
  },
);

it.each(['schedules', 'expenses'] as const)(
  '활성화가 먼저 시작되면 대기하던 %s 수정은 Local로 다시 라우팅한다',
  async (tableName) => {
    const response = createDeferred<unknown>();
    const requested = createDeferred<void>();
    jest.mocked(apiClient.post<unknown, unknown>).mockImplementationOnce(async () => {
      requested.resolve();
      return await response.promise;
    });
    const activation = activateTripForTest();
    await requested.promise;
    const row = tableName === 'schedules' ? SCHEDULE : EXPENSE;
    const repository = tableName === 'schedules' ? ScheduleRepository : ExpenseRepository;
    const mutation = repository.update(row.id, TRIP.id, { title: '활성화 중 저장', edit: EDIT_STAMP });
    response.resolve({ success: true, data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] } });
    await activation;
    await mutation;
    expect(apiClient.put).not.toHaveBeenCalled();
    const table = tableName === 'schedules' ? schedules : expenses;
    expect(await getDatabase().select().from(table).get()).toMatchObject({ title: '활성화 중 저장' });
    expect(await getDatabase().select().from(syncQueue).all()).toEqual([
      expect.objectContaining({ tableName, action: 'UPDATE' }),
    ]);
  },
);

it.each(['schedules', 'expenses'] as const)(
  '비활성 %s DELETE 뒤 활성화는 남은 기기 사본을 노출하지 않는다',
  async (tableName) => {
    const response = createDeferred<unknown>();
    const requested = createDeferred<void>();
    const row = tableName === 'schedules' ? SCHEDULE : EXPENSE;
    const repository = tableName === 'schedules' ? ScheduleRepository : ExpenseRepository;
    jest.mocked(apiClient.delete<unknown, unknown>).mockImplementationOnce(async () => {
      requested.resolve();
      return await response.promise;
    });
    const mutation = repository.delete(row.id, TRIP.id);
    await requested.promise;
    jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
      success: true,
      data: {
        trips: [TRIP],
        schedules: tableName === 'schedules' ? [] : [SCHEDULE],
        expenses: tableName === 'expenses' ? [] : [{ ...EXPENSE, scheduleId: null }],
      },
    });
    const activation = activateTripForTest();
    response.resolve({ success: true, data: { id: row.id, deletedAt: FIXTURE_TIME } });
    await mutation;
    await activation;
    const readRecords = tableName === 'schedules' ? getSchedulesLocal : getExpensesByTripIdLocal;
    expect(await readRecords(TRIP.id)).toEqual([]);
  },
);

it('사본 정리로 최신 원문이 없으면 오래된 활성화는 빈 데이터 성공 대신 재시도를 요구한다', async () => {
  await reconcileServerRecord('schedules', { ...SCHEDULE, version: 5, title: '정리 전 최신 값' });
  await forceCleanupTrip(TRIP.id);
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
    success: true,
    data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] },
  });
  await expect(activateTripForTest()).rejects.toThrow('최신 여행 데이터를 다시 받아야');
  expect(await getDatabase().select().from(tripActivations).all()).toEqual([]);
  expect(downloadOfflineMapInBackground).not.toHaveBeenCalled();
});

it.each(['schedules', 'expenses'] as const)(
  '비활성 %s CREATE가 먼저 시작되면 본문은 활성화가 입수할 때만 저장한다',
  async (tableName) => {
    const createResponse = createDeferred<unknown>();
    const activationResponse = createDeferred<unknown>();
    const createRequested = createDeferred<void>();
    const activationRequested = createDeferred<void>();
    const created = { ...(tableName === 'schedules' ? SCHEDULE : EXPENSE), id: '01ARZ3NDEKTSV4RRFFQ69G5FB9' };
    jest
      .mocked(apiClient.post<unknown, unknown>)
      .mockImplementationOnce(async () => {
        createRequested.resolve();
        return await createResponse.promise;
      })
      .mockImplementationOnce(async () => {
        activationRequested.resolve();
        return await activationResponse.promise;
      });
    const mutation =
      tableName === 'schedules'
        ? ScheduleRepository.create({ ...SCHEDULE, id: created.id })
        : ExpenseRepository.create({ ...EXPENSE, id: created.id });
    await createRequested.promise;
    const activation = activateTripForTest();
    createResponse.resolve({ success: true, data: created });
    await mutation;
    await activationRequested.promise;
    const table = tableName === 'schedules' ? schedules : expenses;
    expect(await getDatabase().select().from(table).where(eq(table.id, created.id)).get()).toBeUndefined();

    activationResponse.resolve({
      success: true,
      data: {
        trips: [TRIP],
        schedules: tableName === 'schedules' ? [SCHEDULE, created] : [SCHEDULE],
        expenses: tableName === 'expenses' ? [EXPENSE, created] : [EXPENSE],
      },
    });
    await activation;
    const readRecords = tableName === 'schedules' ? getSchedulesLocal : getExpensesByTripIdLocal;
    expect(await readRecords(TRIP.id)).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id })]));
  },
);

const prepareActiveTripForPull = async () => {
  await getDatabase().insert(tripActivations).values({
    id: 'old-preparation',
    tripId: TRIP.id,
    userId: TRIP.userId,
    isActivated: true,
    activatedAt: FIXTURE_TIME,
    expiresAt: FIXTURE_TIME,
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  });
  await runDatabaseTransaction(() =>
    setPullCheckpointInTransaction(TRIP.userId, [TRIP.id], '5', new Date(FIXTURE_TIME)),
  );
  const response = createDeferred<unknown>();
  const requested = createDeferred<void>();
  jest.mocked(syncApi.get<unknown, unknown>).mockImplementationOnce(async () => {
    requested.resolve();
    return await response.promise;
  });
  const pending = pullChanges();
  await requested.promise;
  return {
    pending,
    respond: (data = {}) =>
      response.resolve({
        data: {
          success: true,
          data: {
            trips: [{ ...TRIP, version: 2, name: '수신한 메타데이터' }],
            schedules: [SCHEDULE],
            expenses: [EXPENSE],
            serverTime: '2026-11-11T00:00:00.000Z',
            nextCursor: '9',
            ...data,
          },
        },
      }),
  };
};

it('명시적 비활성화와 정리 뒤 늦은 pull은 메타데이터만 받고 사본·cursor를 보존한다', async () => {
  await reconcileServerRecord('schedules', SCHEDULE);
  await reconcileServerRecord('expenses', EXPENSE);
  const pull = await prepareActiveTripForPull();
  const metadata = await getDatabase().select().from(syncMetadata).all();
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({ success: true });
  await deactivateAndClearTripForTest();
  pull.respond();
  await pull.pending;
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ isActivated: false });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: expect.any(String) });
  expect(
    (await getDatabase().select().from(serverRecords).all())
      .filter((row) => row.tableName !== 'trips')
      .every((row) => row.record === null),
  ).toBe(true);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ name: '수신한 메타데이터' });
  expect(await getDatabase().select().from(syncMetadata).all()).toEqual(metadata);
});

it('같은 시각에 재활성화해도 새 준비 ID가 옛 pull을 거절하고 다음 cursor는 전진하지 않는다', async () => {
  const pull = await prepareActiveTripForPull();
  await getDatabase().update(tripActivations).set({ isActivated: false });
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({
    success: true,
    data: {
      trips: [TRIP],
      schedules: [{ ...SCHEDULE, version: 4, title: '새 사본' }],
      expenses: [EXPENSE],
    },
  });
  await activateTripForTest();
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ id: 'activation' });

  pull.respond({ schedules: [{ ...SCHEDULE, version: 9, title: '옛 준비의 늦은 응답' }] });
  await pull.pending;
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ title: '새 사본', version: 4 });
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it.each(['foreign', 'unrequested'] as const)(
  '%s 자식 응답은 메타데이터와 checkpoint도 쓰기 전에 거절한다',
  async (kind) => {
    const pull = await prepareActiveTripForPull();
    const rejected = expect(pull.pending).rejects.toThrow();
    pull.respond({
      expenses: [
        {
          ...EXPENSE,
          ...(kind === 'foreign' ? { userId: '01ARZ3NDEKTSV4RRFFQ69G5FB9' } : { tripId: '01ARZ3NDEKTSV4RRFFQ69G5FB9' }),
        },
      ],
    });
    await rejected;
    expect(await getDatabase().select().from(trips).get()).toMatchObject({ version: 1, name: TRIP.name });
    expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
  },
);

it('같은 계정의 새 session에는 옛 pull을 적용하지 않는다', async () => {
  const pull = await prepareActiveTripForPull();
  useAuthStore.setState({ sessionId: Symbol('new session') });
  const rejected = expect(pull.pending).rejects.toThrow();
  pull.respond();
  await rejected;
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ version: 1 });
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it('현재 준비의 pull은 pending을 겹치고 본문과 cursor를 함께 확정한다', async () => {
  await enqueueTestTask('next-edit', { amount: '35', currency: 'USD', edit: EDIT_STAMP });
  const pull = await prepareActiveTripForPull();
  pull.respond({ expenses: [{ ...EXPENSE, version: 2, category: 'transport' }] });
  await pull.pending;
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '35', category: 'transport' });
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(1);
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('9');
});

it('현재 활성 사본을 명시적으로 정리한 뒤 늦은 pull도 본문을 다시 쓰지 않는다', async () => {
  await reconcileServerRecord('schedules', SCHEDULE);
  await reconcileServerRecord('expenses', EXPENSE);
  const pull = await prepareActiveTripForPull();
  await forceCleanupTrip(TRIP.id);
  pull.respond();
  await pull.pending;
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: expect.any(String) });
  expect(
    (await getDatabase().select().from(serverRecords).all())
      .filter((row) => row.tableName !== 'trips')
      .every((row) => row.record === null),
  ).toBe(true);
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it('늦은 pull의 확정 자식 삭제는 본문 없이 삭제 증거를 남긴다', async () => {
  const pull = await prepareActiveTripForPull();
  await getDatabase().update(tripActivations).set({ isActivated: false });
  pull.respond({ expenses: [{ ...EXPENSE, deletedAt: FIXTURE_TIME, version: 3 }] });
  await pull.pending;
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(
    await getDatabase().select().from(serverRecords).where(eq(serverRecords.recordId, EXPENSE.id)).get(),
  ).toMatchObject({ deletedAt: FIXTURE_TIME, record: null });
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it('늦은 pull의 여행 삭제는 현재 준비도 종료하고 자식 부활을 막는다', async () => {
  const pull = await prepareActiveTripForPull();
  await getDatabase().update(tripActivations).set({ id: 'new-preparation' });
  pull.respond({ trips: [{ ...TRIP, deletedAt: FIXTURE_TIME, version: 3 }] });
  await pull.pending;
  expect(await getDatabase().select().from(tripActivations).all()).toEqual([]);
  expect(await getDatabase().select().from(trips).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it('checkpoint 후반 실패는 본문·서버 판본·cursor와 수신 시각을 함께 되돌린다', async () => {
  const pull = await prepareActiveTripForPull();
  const metadata = await getDatabase().select().from(syncMetadata).all();
  getDatabase().run(
    sql.raw(`CREATE TRIGGER fail_pull_checkpoint BEFORE INSERT ON sync_metadata
    WHEN NEW.key = 'lastSyncedAt' BEGIN SELECT RAISE(ABORT, 'checkpoint failed'); END`),
  );
  try {
    const rejected = expect(pull.pending).rejects.toThrow('checkpoint failed');
    pull.respond({ expenses: [{ ...EXPENSE, version: 2, category: 'transport' }] });
    await rejected;
    expect(await getDatabase().select().from(trips).get()).toMatchObject({ name: TRIP.name, version: 1 });
    expect(await getDatabase().select().from(expenses).get()).toMatchObject({ category: EXPENSE.category, version: 1 });
    expect(await getDatabase().select().from(serverRecords).all()).toEqual([]);
    expect(await getDatabase().select().from(syncMetadata).all()).toEqual(metadata);
  } finally {
    getDatabase().run(sql.raw('DROP TRIGGER fail_pull_checkpoint'));
  }
});

it('응답이 쓰기 대기 중이면 앞선 transaction의 비활성화를 반영한 뒤 판정한다', async () => {
  const pull = await prepareActiveTripForPull();
  const entered = createDeferred<void>();
  const release = createDeferred<void>();
  const deactivate = runDatabaseTransaction(async () => {
    await getDatabase().update(tripActivations).set({ isActivated: false });
    entered.resolve();
    await release.promise;
  });
  await entered.promise;
  pull.respond({ expenses: [{ ...EXPENSE, version: 3, title: '쓰면 안 되는 본문' }] });
  release.resolve();
  await deactivate;
  await pull.pending;
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ title: EXPENSE.title, version: 1 });
  expect(await getPullCursor(TRIP.userId, [TRIP.id])).toBe('5');
});

it.each(['live', 'deleted'] as const)('활성화 반영 중 세션이 바뀌면 %s 응답의 저장도 함께 되돌린다', async (kind) => {
  const beforeTrips = await getDatabase().select().from(trips).all();
  const beforeExpenses = await getDatabase().select().from(expenses).all();
  jest.mocked(apiClient.post).mockResolvedValueOnce({
    success: true,
    data: {
      trips: [{ ...TRIP, version: 2, name: '이전 세션 응답', deletedAt: kind === 'deleted' ? FIXTURE_TIME : null }],
      schedules: [{ ...SCHEDULE, version: 2 }],
      expenses: [{ ...EXPENSE, version: 2, amount: '99' }],
    },
  });
  const entered = createDeferred<void>();
  const release = createDeferred<void>();
  jest.mocked(observeFieldEdits).mockImplementationOnce(async () => {
    entered.resolve();
    await release.promise;
  });
  const activation = activateTripForTest();
  const rejected = activation.catch((error: unknown) => error);
  await entered.promise;
  useAuthStore.setState({ status: 'reauth-required', sessionId: Symbol('reauth-required') });
  release.resolve();
  expect(await rejected).toBeInstanceOf(AuthRequiredError);
  expect(await getDatabase().select().from(trips).all()).toEqual(beforeTrips);
  expect(await getDatabase().select().from(expenses).all()).toEqual(beforeExpenses);
  expect(await getDatabase().select().from(tripActivations).all()).toEqual([]);
  expect(await getDatabase().select().from(serverRecords).all()).toEqual([]);
  expect(downloadOfflineMapInBackground).not.toHaveBeenCalled();
  expect(downloadRoutesForSchedules).not.toHaveBeenCalled();
});

it.each(['PENDING', 'FAILED', 'IN_PROGRESS'] as const)(
  '사본 정리는 tripId 없는 부분 수정이 %s이면 원본과 요청을 보존한다',
  async (status) => {
    await getDatabase().insert(tripActivations).values({
      id: 'cleanup-protection', tripId: TRIP.id, userId: TRIP.userId,
      isActivated: true, activatedAt: FIXTURE_TIME, expiresAt: FIXTURE_TIME, createdAt: FIXTURE_TIME, updatedAt: FIXTURE_TIME,
    });
    await enqueueTestTask('partial-update', { title: '아직 보내지 못한 제목' });
    await getDatabase().update(syncQueue).set({ status }).where(eq(syncQueue.id, 'partial-update'));
    const before = await getDatabase().select().from(syncQueue).all();
    jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({ success: true });
    await deactivateAndClearTripForTest();

    expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({
      isActivated: false, cleanupPending: true,
    });
    expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: null });
    expect(await getDatabase().select().from(syncQueue).all()).toEqual(before);
  },
);

it('보류 입력은 비활성화 후 사본 정리를 미루고 사용자 확인 뒤 다음 정리가 진행된다', async () => {
  await getDatabase().insert(tripActivations).values({
    id: 'cleanup-protection', tripId: TRIP.id, userId: TRIP.userId,
    isActivated: true, activatedAt: FIXTURE_TIME, expiresAt: FIXTURE_TIME, createdAt: FIXTURE_TIME, updatedAt: FIXTURE_TIME,
  });
  await preserveLegacyHold('expenses', EXPENSE.id, TRIP.id, { amount: '30' }, EXPENSE, 'held-input');
  jest.mocked(apiClient.post<unknown, unknown>).mockResolvedValueOnce({ success: true });
  await deactivateAndClearTripForTest();
  await processPendingCleanups();
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: null });
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ cleanupPending: true });

  await clearLegacyHold('held-input');
  await processPendingCleanups();
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: expect.any(String) });
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ cleanupPending: false });
});

const seedCleanupActivation = (state: { isActivated: boolean; cleanupPending: boolean }) =>
  getDatabase()
    .insert(tripActivations)
    .values({
      id: 'old-preparation',
      tripId: TRIP.id,
      userId: TRIP.userId,
      ...state,
      activatedAt: FIXTURE_TIME,
      expiresAt: FIXTURE_TIME,
      createdAt: FIXTURE_TIME,
      updatedAt: FIXTURE_TIME,
    });

const activationResponse = {
  success: true,
  data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] },
};

it('미전송 경비 때문에 미룬 정리는 재활성화 때 취소되고 전송 완료 후에도 새 사본을 보존한다', async () => {
  await seedCleanupActivation({ isActivated: true, cleanupPending: false });
  const title = '서버에 보낼 경비 제목';
  await enqueueTestTask('pending-expense', { title, edit: EDIT_STAMP });
  jest
    .mocked(apiClient.post<unknown, unknown>)
    .mockResolvedValueOnce({ success: true })
    .mockResolvedValueOnce(activationResponse);

  await deactivateAndClearTripForTest();
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({
    isActivated: false,
    cleanupPending: true,
  });
  await activateTripForTest();
  const reactivated = await getDatabase().select().from(tripActivations).get();
  expect(await getExpensesByTripIdLocal(TRIP.id)).toEqual([expect.objectContaining({ id: EXPENSE.id, title })]);
  expect(await getDatabase().select().from(syncQueue).get()).toMatchObject({ id: 'pending-expense' });

  await reconcileServerRecord('expenses', { ...EXPENSE, title, version: 2 }, 'pending-expense');
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  await processPendingCleanups();
  expect(await getSchedulesLocal(TRIP.id)).toEqual([expect.objectContaining({ id: SCHEDULE.id })]);
  expect(await getExpensesByTripIdLocal(TRIP.id)).toEqual([expect.objectContaining({ id: EXPENSE.id, title })]);
  expect(reactivated).toMatchObject({ isActivated: true, cleanupPending: false });
  expect(downloadOfflineMapInBackground).toHaveBeenCalledWith(TRIP.id);
  expect(cleanupOfflineMapForTrip).not.toHaveBeenCalled();
});

it('구버전에서 활성 여행에 남긴 정리 예약은 현재 준비 ID·일정·경비·지도를 보존하며 해제한다', async () => {
  await seedCleanupActivation({ isActivated: true, cleanupPending: true });
  await processPendingCleanups();

  expect(await getSchedulesLocal(TRIP.id)).toEqual([expect.objectContaining({ id: SCHEDULE.id })]);
  expect(await getExpensesByTripIdLocal(TRIP.id)).toEqual([expect.objectContaining({ id: EXPENSE.id })]);
  expect(cleanupOfflineMapForTrip).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({
    id: 'old-preparation',
    isActivated: true,
    cleanupPending: false,
  });
});

it('정리 대기 중 다른 준비 ID로 바뀐 비활성 예약은 그 예약을 다시 읽은 정리만 실행한다', async () => {
  await seedCleanupActivation({ isActivated: false, cleanupPending: true });
  const replaceReservation = createDeferred<void>();
  const transition = withTripOperation(TRIP.id, async () => {
    await replaceReservation.promise;
    await getDatabase()
      .update(tripActivations)
      .set({ id: 'new-preparation' })
      .where(eq(tripActivations.tripId, TRIP.id));
  });
  const oldCleanup = processPendingCleanups();
  // 이전 예약을 조회한 정리가 같은 여행의 전환을 기다리는 동안 준비 ID가 바뀐다.
  await new Promise<void>((resolve) => setImmediate(resolve));
  replaceReservation.resolve();
  await Promise.all([transition, oldCleanup]);

  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({
    id: 'new-preparation',
    isActivated: false,
    cleanupPending: true,
  });
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ id: SCHEDULE.id, deletedAt: null });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ id: EXPENSE.id, deletedAt: null });
  expect(cleanupOfflineMapForTrip).not.toHaveBeenCalled();

  await processPendingCleanups();
  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ cleanupPending: false });
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ deletedAt: expect.any(String) });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: expect.any(String) });
  expect(cleanupOfflineMapForTrip).toHaveBeenCalledWith(TRIP.id);
});

it.each(['즉시', '예약'] as const)('%s 지도 정리가 끝난 뒤 같은 여행의 새 오프라인 준비가 진행된다', async (kind) => {
  await seedCleanupActivation({ isActivated: kind === '즉시', cleanupPending: kind === '예약' });
  const mapCleanupStarted = createDeferred<void>();
  const finishMapCleanup = createDeferred<void>();
  jest.mocked(cleanupOfflineMapForTrip).mockImplementationOnce(async () => {
    mapCleanupStarted.resolve();
    await finishMapCleanup.promise;
  });
  const post = jest.mocked(apiClient.post<unknown, unknown>);
  if (kind === '즉시') {
    post.mockResolvedValueOnce(activationResponse);
  }
  post.mockResolvedValueOnce(activationResponse);
  const cleanup = kind === '즉시' ? deactivateAndClearTripForTest() : processPendingCleanups();
  await mapCleanupStarted.promise;
  const activation = activateTripForTest();
  try {
    // 동기 SQLite와 이미 완료된 서버 응답을 사용하는 활성화가 실행될 기회를 준다.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ isActivated: false });
    expect(downloadOfflineMapInBackground).not.toHaveBeenCalled();
  } finally {
    finishMapCleanup.resolve();
    await Promise.all([cleanup, activation]);
  }

  expect(await getDatabase().select().from(tripActivations).get()).toMatchObject({ isActivated: true });
  expect(await getSchedulesLocal(TRIP.id)).toEqual([expect.objectContaining({ id: SCHEDULE.id })]);
  expect(await getExpensesByTripIdLocal(TRIP.id)).toEqual([expect.objectContaining({ id: EXPENSE.id })]);
  expect(downloadOfflineMapInBackground).toHaveBeenCalledWith(TRIP.id);
});

it('vacuum은 보류가 참조하는 원본을 남기고 해제 뒤 삭제할 때 서버 확인본의 본문도 비운다', async () => {
  await reconcileServerRecord('expenses', EXPENSE);
  await preserveLegacyHold('expenses', EXPENSE.id, TRIP.id, { amount: '30' }, EXPENSE, 'held-input');
  await getDatabase().update(expenses).set({ deletedAt: '2020-01-01T00:00:00.000Z' });

  await vacuumDeletedRecords();
  expect(await getDatabase().select().from(expenses).get()).toBeDefined();
  expect(await getDatabase().select().from(serverRecords).where(eq(serverRecords.recordId, EXPENSE.id)).get())
    .toMatchObject({ record: expect.any(Object) });

  await clearLegacyHold('held-input');
  await vacuumDeletedRecords();
  expect(await getDatabase().select().from(expenses).get()).toBeUndefined();
  expect(await getDatabase().select().from(serverRecords).where(eq(serverRecords.recordId, EXPENSE.id)).get())
    .toMatchObject({ record: null });
});
