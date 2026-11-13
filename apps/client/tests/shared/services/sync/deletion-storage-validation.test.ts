/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { AxiosError, AxiosHeaders } from 'axios';

import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  schedules,
  trips,
  expenses,
  syncQueue,
  runDatabaseTransaction,
} from '@/shared/db';
import { reportSyncSignal } from '@/shared/diagnostics/sentry';
import api from '@/shared/services/sync/api';
import { pushChanges } from '@/shared/services/sync/engine';
import { reconcileServerRecord } from '@/shared/services/sync/reconcile';
import { applyConfirmedDeletionInTransaction } from '@/shared/services/sync/confirmed-deletion';
import { useAuthStore } from '@/shared/store/auth';
jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: async () => 0 }));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { cancelQueries: async () => undefined, invalidateQueries: async () => undefined },
}));
jest.mock('@/shared/diagnostics/sentry', () => ({ reportSyncSignal: jest.fn() }));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => {
    const { createExpoSQLiteDatabase } =
      jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite');
    return createExpoSQLiteDatabase();
  },
}));
jest.mock('@/shared/services/edit-stamp', () => ({
  ...jest.requireActual<typeof import('@/shared/services/edit-stamp')>('@/shared/services/edit-stamp'),
  observeFieldEdits: jest.fn(async () => undefined),
}));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'hold-1' }));
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
  timeZone: null,
  startDate: FIXTURE_TIME,
  endDate: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
};
const SCHEDULE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  title: '서버 제목',
  location: '서울',
  address: null,
  latitude: null,
  longitude: null,
  scheduledAt: FIXTURE_TIME,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  deletedAt: null,
  version: 2,
  fieldEdits: {},
};
const EXPENSE = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  scheduleId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
  title: '식사',
  amount: '25',
  currency: 'USD',
  category: 'food',
  date: '2026-11-10',
  hasReceipt: false,
  receiptUrl: null,
  createdAt: FIXTURE_TIME,
  updatedAt: FIXTURE_TIME,
  deletedAt: null,
  version: 2,
  fieldEdits: {},
};

const enqueueTestTask = async (
  id: string,
  tableName: string,
  recordId: string,
  action: string,
  payload: object | null,
) => {
  await getDatabase()
    .insert(syncQueue)
    .values({ id, tableName, recordId, action, payload: JSON.stringify(payload), createdAt: FIXTURE_TIME });
};

beforeEach(async () => {
  jest.mocked(api.get).mockReset();
  jest.mocked(api.put).mockReset();
  jest.mocked(api.delete).mockReset();
  jest.mocked(reportSyncSignal).mockClear();
  useAuthStore.setState({ status: 'signed-in', userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ' });
  await initializeDatabase();
  await resetDatabase();
  await getDatabase().insert(trips).values(TRIP);
  await getDatabase().insert(schedules).values(SCHEDULE);
  await getDatabase().insert(expenses).values(EXPENSE);
});

it.each(['entity', 'trip'])('삭제 %s는 스키마를 통과해도 저장 불가능한 혼합 입력 원문을 보존한다', async (kind) => {
  const invalid = [
    { title: '고칠 값', amount: 'not-a-number' },
    { title: '고칠 값', amount: '99999999.995' },
    { title: '길'.repeat(201) },
    { title: '고칠 값', currency: 'USDX' },
    { title: '고칠 값', category: 'nul\u0000text' },
    { title: '고칠 값', edit: { time: FIXTURE_TIME, sequence: 1, id: 'nul\u0000id' } },
    { title: '고칠 값', date: '0000-01-01' },
  ];
  for (const [index, payload] of invalid.entries()) {
    await enqueueTestTask('invalid-' + index, 'expenses', EXPENSE.id, 'UPDATE', payload);
  }
  await enqueueTestTask('valid-rounded', 'expenses', EXPENSE.id, 'UPDATE', { amount: '99999999.994', currency: 'USD' });
  await enqueueTestTask('valid-padding', 'expenses', EXPENSE.id, 'UPDATE', {
    title: '😀'.repeat(200) + '  ',
    currency: 'USD   ',
  });
  await enqueueTestTask('valid-exponent', 'expenses', EXPENSE.id, 'UPDATE', { amount: ' +3.125e+1 ', currency: 'USD' });
  await enqueueTestTask('valid-legacy', 'expenses', EXPENSE.id, 'UPDATE', { ...EXPENSE, title: '옛 입력' });
  await runDatabaseTransaction(() =>
    applyConfirmedDeletionInTransaction(
      kind === 'trip' ? 'trips' : 'expenses',
      kind === 'trip' ? TRIP.id : EXPENSE.id,
      TRIP.id,
      FIXTURE_TIME,
    ),
  );
  const retained = await getDatabase().select().from(syncQueue).all();
  expect(retained.map((task) => task.id)).toEqual(invalid.map((_, i) => 'invalid-' + i));
  expect(retained.map((task) => task.payload)).toEqual(invalid.map((payload) => JSON.stringify(payload)));
});

it('여행 삭제도 CREATE의 손상 금액과 일정 좌표를 버리지 않고 유효한 반올림·지수 표기는 정리한다', async () => {
  const badExpense = { ...EXPENSE, amount: 'nope' };
  const badSchedule = { ...SCHEDULE, latitude: 999.99999995 };
  await enqueueTestTask('bad-expense', 'expenses', EXPENSE.id, 'CREATE', badExpense);
  await enqueueTestTask('bad-schedule', 'schedules', SCHEDULE.id, 'CREATE', badSchedule);
  await enqueueTestTask('bad-schedule-update', 'schedules', SCHEDULE.id, 'UPDATE', { latitude: 1000 });
  await enqueueTestTask('valid-expense', 'expenses', EXPENSE.id, 'CREATE', { ...EXPENSE, amount: '1.23456e2' });
  await enqueueTestTask('valid-schedule', 'schedules', SCHEDULE.id, 'CREATE', { ...SCHEDULE, latitude: 999.99999994 });
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  const retained = await getDatabase().select().from(syncQueue).all();
  expect(retained.map((task) => task.id)).toEqual(['bad-expense', 'bad-schedule', 'bad-schedule-update']);
  expect(retained[0].payload).toBe(JSON.stringify(badExpense));
  expect(retained[1].payload).toBe(JSON.stringify(badSchedule));
});

it('삭제 수신 후 보존된 손상 입력은 전송 실패와 진단을 남긴다', async () => {
  const payload = { amount: 'not-a-number', currency: 'USD', title: '전체 원문' };
  await enqueueTestTask('invalid', 'expenses', EXPENSE.id, 'UPDATE', payload);
  await reconcileServerRecord('expenses', { ...EXPENSE, deletedAt: FIXTURE_TIME });
  jest.mocked(api.put).mockRejectedValueOnce(
    new AxiosError(
      'invalid numeric',
      'ERR_BAD_RESPONSE',
      undefined,
      {},
      {
        status: 500,
        data: { error: 'numeric input rejected' },
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    ),
  );
  await expect(pushChanges()).rejects.toThrow();
  expect(await getDatabase().select().from(syncQueue).get()).toMatchObject({
    id: 'invalid',
    payload: JSON.stringify(payload),
    status: 'FAILED',
    retryCount: 1,
  });
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'sync.push.blocked',
      stage: 'server-rejected',
      httpStatus: 500,
    }),
    undefined,
  );
});

it('로컬에서 확신할 수 없는 유효한 옛 숫자는 자신의 410 확인만으로 종결하고 다른 손상 입력은 남긴다', async () => {
  await enqueueTestTask('pg-only', 'expenses', EXPENSE.id, 'UPDATE', { amount: 'NaN', currency: 'USD' });
  const bad = { amount: 'invalid', currency: 'USD' };
  await enqueueTestTask('bad-next', 'expenses', EXPENSE.id, 'UPDATE', bad);
  await reconcileServerRecord('trips', { ...TRIP, deletedAt: FIXTURE_TIME });
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(2);

  jest
    .mocked(api.put)
    .mockRejectedValueOnce(
      new AxiosError(
        'gone',
        'ERR_BAD_RESPONSE',
        undefined,
        {},
        {
          status: 410,
          data: {
            error: 'Gone',
            code: 'TRIP_DELETED',
            data: {
              id: EXPENSE.id,
              tripId: TRIP.id,
              deletedAt: FIXTURE_TIME,
            },
          },
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      ),
    )
    .mockRejectedValueOnce(
      new AxiosError(
        'invalid numeric',
        'ERR_BAD_RESPONSE',
        undefined,
        {},
        { status: 500, data: {}, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } },
      ),
    );
  await expect(pushChanges()).rejects.toThrow();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([
    expect.objectContaining({
      id: 'bad-next',
      payload: JSON.stringify(bad),
      status: 'FAILED',
      retryCount: 1,
    }),
  ]);
  expect(api.put).toHaveBeenCalledTimes(2);
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'sync.push.resolved',
      stage: 'trip-deleted',
    }),
    undefined,
  );
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'sync.push.blocked',
      stage: 'server-rejected',
      httpStatus: 500,
    }),
    undefined,
  );
});

it('여행 삭제 때 큐의 대상과 본문 ID가 다른 CREATE는 보존한다', async () => {
  const payload = { ...EXPENSE, id: '01ARZ3NDEKTSV4RRFFQ69G5FAY' };
  await enqueueTestTask('conflicting-id', 'expenses', EXPENSE.id, 'CREATE', payload);
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  expect(await getDatabase().select().from(syncQueue).all()).toMatchObject([
    { id: 'conflicting-id', payload: JSON.stringify(payload) },
  ]);
});

it.each(['trips', 'schedules', 'expenses'] as const)(
  '여행 삭제는 원본과 저장된 여행 귀속이 모순된 %s DELETE를 보존한다',
  async (tableName) => {
    const otherTripId = 'other-trip';
    const recordId = tableName === 'trips' ? otherTripId : 'other-child';
    await getDatabase()
      .insert(trips)
      .values({ ...TRIP, id: otherTripId });
    if (tableName === 'expenses') {
      await getDatabase()
        .insert(expenses)
        .values({ ...EXPENSE, id: recordId, tripId: otherTripId, scheduleId: null });
    }
    if (tableName === 'schedules') {
      await getDatabase()
        .insert(schedules)
        .values({ ...SCHEDULE, id: recordId, tripId: otherTripId });
    }
    await enqueueTestTask('contradictory-delete', tableName, recordId, 'DELETE', {
      ownerVersion: 1,
      userId: TRIP.userId,
      tripId: TRIP.id,
    });
    const before = await getDatabase().select().from(syncQueue).all();
    await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
    expect(await getDatabase().select().from(syncQueue).all()).toEqual(before);
  },
);
