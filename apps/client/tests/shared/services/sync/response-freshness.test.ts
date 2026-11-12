/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { useActivateTrip as getActivationOptions } from '@/entities/trip/data/useActivateTrip';
import { refreshTripListLocal } from '@/entities/trip/lib/trip-local';
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
  runDatabaseTransaction,
} from '@/shared/db';
import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { vacuumDeletedRecords } from '@/shared/services/sync/cleanup-job';
import { reconcileServerRecord } from '@/shared/services/sync/reconcile';
import { applyConfirmedDeletionInTransaction } from '@/shared/services/sync/confirmed-deletion';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('@/shared/services/sync/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: (options: unknown) => options, useQueryClient: () => ({}) }));
jest.mock('@/shared/api/fetcher', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: async () => undefined }));
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
      mutationFn: (id: string) => Promise<{ schedules: unknown[]; expenses: unknown[] }>;
    }
  ).mutationFn(TRIP.id);
};

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
it('일반 활성화 HTTP가 늦게 끝나도 최신 값·반환·만료일을 사용하고 저장 후 경로 준비를 요청한다', async () => {
  const response = createDeferred<unknown>();
  jest.mocked(apiClient.post<unknown, unknown>).mockReturnValueOnce(response.promise);
  const pending = activateTripForTest();
  await reconcileServerRecord('trips', { ...TRIP, version: 3, endDate: '2026-11-20T00:00:00.000Z' });
  await reconcileServerRecord('schedules', { ...SCHEDULE, version: 3, title: '새 서버 제목' });
  await reconcileServerRecord('expenses', { ...EXPENSE, version: 3, category: 'transport' });
  response.resolve({ success: true, data: { trips: [TRIP], schedules: [SCHEDULE], expenses: [EXPENSE] } });
  const result = await pending;
  expect(result.schedules).toEqual([expect.objectContaining({ title: '새 서버 제목' })]);
  expect(result.expenses).toEqual([expect.objectContaining({ category: 'transport' })]);
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

it('렌더링할 자식이 없는 확정 여행 삭제도 남은 서버 원문을 지운다', async () => {
  await reconcileServerRecord('expenses', EXPENSE);
  await getDatabase().delete(expenses).where(eq(expenses.id, EXPENSE.id));
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  expect((await getDatabase().select().from(serverRecords).all()).every((state) => state.record === null)).toBe(true);
});
