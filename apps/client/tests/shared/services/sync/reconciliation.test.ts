/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';
import { AxiosError, AxiosHeaders } from 'axios';
import { eq, sql } from 'drizzle-orm';

import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  schedules,
  trips,
  tripActivations,
  expenses,
  syncQueue,
  legacySyncHolds,
  legacyHoldAcks,
  runDatabaseTransaction,
  serverRecords,
} from '@/shared/db';
import { reportSyncSignal } from '@/shared/diagnostics/sentry';
import api from '@/shared/services/sync/api';
import { pushChanges, pullChanges, syncData } from '@/shared/services/sync/engine';
import {
  preserveLegacyHoldInTransaction,
  synchronizeLegacyHolds,
  clearLegacyHold,
  subscribeLegacyHolds,
} from '@/shared/services/sync/legacy-holds';
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
const EDIT_STAMP = { time: FIXTURE_TIME, sequence: 1, id: 'edit' };
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

it('pull은 미전송 금액만 보호하고 서버 분류와 표식을 수신한다', async () => {
  await getDatabase()
    .update(expenses)
    .set({ amount: '30', fieldEdits: { amount: EDIT_STAMP } })
    .where(eq(expenses.id, '01ARZ3NDEKTSV4RRFFQ69G5FAX'));
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', {
    amount: '30',
    currency: 'USD',
    edit: EDIT_STAMP,
  });
  await reconcileServerRecord('expenses', { ...EXPENSE, category: 'transport', fieldEdits: { category: EDIT_STAMP } });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    amount: '30',
    category: 'transport',
    fieldEdits: { amount: EDIT_STAMP, category: EDIT_STAMP },
  });
});

it('앞 요청의 응답은 전송 중 저장된 다음 입력을 덮거나 종결하지 않는다', async () => {
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', {
    amount: '30',
    currency: 'USD',
    edit: EDIT_STAMP,
  });
  await enqueueTestTask('q2', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', {
    title: '새 제목',
    edit: { ...EDIT_STAMP, sequence: 2 },
  });
  await reconcileServerRecord('expenses', { ...EXPENSE, amount: '30' }, 'q1');
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '30', title: '새 제목' });
  expect((await getDatabase().select().from(syncQueue).all()).map((row) => row.id)).toEqual(['q2']);
});

it.each([
  { action: 'CREATE', payload: EXPENSE },
  { action: 'UPDATE', payload: { title: '입력', edit: EDIT_STAMP } },
  { action: 'DELETE', payload: { ownerVersion: 1, userId: TRIP.userId, tripId: TRIP.id } },
] as const)('삭제가 확인된 $action 성공 응답은 완료 요청을 한 번만 제거한다', async ({ action, payload }) => {
  const db = getDatabase();

  await enqueueTestTask('completed', 'expenses', EXPENSE.id, action, payload);

  const response = { data: { success: true, data: { ...EXPENSE, deletedAt: FIXTURE_TIME, version: 3 } } };
  const request = { CREATE: api.post, UPDATE: api.put, DELETE: api.delete }[action];

  jest.mocked(request).mockResolvedValueOnce(response);

  const deletion = jest.spyOn(db, 'delete');

  try {
    await pushChanges();

    expect(deletion.mock.calls.filter(([table]) => table === syncQueue)).toHaveLength(1);
    expect(await db.select().from(syncQueue).all()).toEqual([]);
    expect(await db.select().from(expenses).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  } finally {
    deletion.mockRestore();
  }
});

it.each([
  { action: 'UPDATE', payload: '{', status: 'PENDING' },
  { action: 'CREATE', payload: '{', status: 'FAILED' },
  { action: 'UPDATE', payload: '{}', status: 'IN_PROGRESS' },
])(
  '남은 $action 입력을 해석할 수 없으면 Local을 보존하되 서버 원본과 완료 요청은 확정한다 ($status)',
  async (pending) => {
    const db = getDatabase();
    await db.update(expenses).set({ amount: '35', title: '보존할 입력' }).where(eq(expenses.id, EXPENSE.id));
    await enqueueTestTask('completed', 'expenses', EXPENSE.id, 'UPDATE', { amount: '30', edit: EDIT_STAMP });
    await db.insert(syncQueue).values({
      id: 'unresolved',
      tableName: 'expenses',
      recordId: EXPENSE.id,
      createdAt: FIXTURE_TIME,
      ...pending,
    });
    const localBefore = await db.select().from(expenses).get();
    const pendingBefore = await db.select().from(syncQueue).where(eq(syncQueue.id, 'unresolved')).get();
    const response = { ...EXPENSE, amount: '30', category: 'transport', version: 3 };

    await reconcileServerRecord('expenses', response, 'completed');

    expect(await db.select().from(expenses).get()).toEqual(localBefore);
    expect(await db.select().from(syncQueue).all()).toEqual([pendingBefore]);
    expect(await db.select().from(serverRecords).get()).toMatchObject({ version: 3, record: response });
  },
);

it.each([
  { table: 'server_records', operation: 'INSERT' },
  { table: 'expenses', operation: 'INSERT' },
  { table: 'sync_queue', operation: 'DELETE' },
])('$table 쓰기 실패는 서버 원본·Local·완료 요청 처리를 함께 되돌린다', async ({ table, operation }) => {
  const db = getDatabase();
  await reconcileServerRecord('expenses', EXPENSE);
  await enqueueTestTask('completed', 'expenses', EXPENSE.id, 'UPDATE', { amount: '30', edit: EDIT_STAMP });
  const before = {
    server: await db.select().from(serverRecords).all(),
    local: await db.select().from(expenses).all(),
    queue: await db.select().from(syncQueue).all(),
  };
  await db.run(
    sql.raw(`CREATE TRIGGER fail_reconcile BEFORE ${operation} ON ${table}
    BEGIN SELECT RAISE(ABORT, 'reconcile write unavailable'); END`),
  );

  try {
    await expect(
      reconcileServerRecord('expenses', { ...EXPENSE, amount: '30', version: 3 }, 'completed'),
    ).rejects.toThrow('reconcile write unavailable');
    expect(await db.select().from(serverRecords).all()).toEqual(before.server);
    expect(await db.select().from(expenses).all()).toEqual(before.local);
    expect(await db.select().from(syncQueue).all()).toEqual(before.queue);
  } finally {
    await db.run(sql.raw('DROP TRIGGER fail_reconcile'));
  }
});

it('30 전송 중 추가된 35는 다음 FIFO로 남기고 현재 실행은 중단 진단 없이 pull까지 진행한다', async () => {
  const later = { amount: '35', currency: 'USD', edit: { ...EDIT_STAMP, sequence: 2 } };
  const first = { amount: '30', currency: 'USD', edit: EDIT_STAMP };
  await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', first);
  await getDatabase().insert(tripActivations).values({
    id: TRIP.id,
    tripId: TRIP.id,
    userId: TRIP.userId,
    isActivated: true,
    activatedAt: FIXTURE_TIME,
    expiresAt: '2027-01-01T00:00:00.000Z',
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  });
  const accepted = { ...EXPENSE, amount: '30', fieldEdits: { amount: EDIT_STAMP }, version: 3 };
  jest
    .mocked(api.put)
    .mockReset()
    .mockImplementationOnce(async () => {
      await enqueueTestTask('q2', 'expenses', EXPENSE.id, 'UPDATE', later);
      return { data: { success: true, data: accepted } } as never;
    })
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...accepted, amount: '35', category: '교통', version: 5, fieldEdits: { amount: later.edit } },
      },
    });
  jest
    .mocked(api.get)
    .mockResolvedValueOnce({ data: { success: true, data: [] } })
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          trips: [],
          schedules: [],
          expenses: [{ ...accepted, version: 4, category: '교통' }],
          serverTime: FIXTURE_TIME,
          nextCursor: '123',
        },
      },
    });
  await syncData();
  expect(api.get).toHaveBeenCalledWith('/api/sync/pull', expect.anything());
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '35', category: '교통' });
  expect(await getDatabase().select().from(syncQueue).all()).toMatchObject([
    { id: 'q2', status: 'PENDING', retryCount: 0 },
  ]);
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(reportSyncSignal).not.toHaveBeenCalled();

  await pushChanges();
  expect(api.put).toHaveBeenLastCalledWith(`/api/expenses/${EXPENSE.id}`, later);
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(0);
});

it('알 수 없는 FIFO 상태는 새로 저장된 정상 PENDING과 달리 다음 작업 전송과 pull을 막는다', async () => {
  await enqueueTestTask('unknown', 'expenses', EXPENSE.id, 'UPDATE', { title: '확인 필요' });
  await getDatabase().update(syncQueue).set({ status: 'UNKNOWN' }).where(eq(syncQueue.id, 'unknown'));
  await enqueueTestTask('later', 'expenses', EXPENSE.id, 'UPDATE', { title: '다음' });
  jest.mocked(api.put).mockClear();
  await expect(syncData()).rejects.toMatchObject({ name: 'SyncIncompleteError' });
  expect(api.put).not.toHaveBeenCalled();
  expect(api.get).not.toHaveBeenCalled();
  expect(reportSyncSignal).toHaveBeenCalledWith(expect.objectContaining({ kind: 'sync.push.blocked' }), undefined);
});

it('서버가 채택하지 않은 편집도 현재 값으로 수렴하고 요청만 종결한다', async () => {
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', {
    amount: '30',
    currency: 'USD',
    edit: EDIT_STAMP,
  });
  await reconcileServerRecord('expenses', { ...EXPENSE, amount: '40' }, 'q1');
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '40' });
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
});

it('명시한 여행 삭제는 귀속한 생성·수정·삭제를 정리하고 다른 여행은 보존한다', async () => {
  await getDatabase()
    .insert(trips)
    .values({ ...TRIP, id: '01ARZ3NDEKTSV4RRFFQ69G5FAY' });
  await enqueueTestTask('q1', 'schedules', '01ARZ3NDEKTSV4RRFFQ69G5FAW', 'CREATE', SCHEDULE);
  await enqueueTestTask('q2', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'DELETE', {
    ownerVersion: 1,
    userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
    tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  });
  await enqueueTestTask('q3', 'trips', '01ARZ3NDEKTSV4RRFFQ69G5FAY', 'UPDATE', { name: '다른 여행' });
  await runDatabaseTransaction(() =>
    applyConfirmedDeletionInTransaction(
      'trips',
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      FIXTURE_TIME,
    ),
  );
  expect((await getDatabase().select().from(syncQueue).all()).map((row) => row.id)).toEqual(['q3']);
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
});

it('일정 삭제는 경비를 보존하고 오래된 미전송 연결도 다시 노출하지 않는다', async () => {
  await runDatabaseTransaction(() =>
    applyConfirmedDeletionInTransaction(
      'schedules',
      '01ARZ3NDEKTSV4RRFFQ69G5FAW',
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      FIXTURE_TIME,
    ),
  );
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', {
    scheduleId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
    edit: EDIT_STAMP,
  });
  await reconcileServerRecord('expenses', EXPENSE);
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    amount: '25',
    scheduleId: null,
    deletedAt: null,
  });
});

it('다른 소유자의 응답과 불명확한 여행 삭제는 정리하지 않는다', async () => {
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', { title: '입력' });
  await expect(reconcileServerRecord('expenses', { ...EXPENSE, userId: 'foreign' })).rejects.toThrow();

  await runDatabaseTransaction(() =>
    applyConfirmedDeletionInTransaction('expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'unknown-trip', FIXTURE_TIME),
  );
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(1);
});

it('구버전 입력 원문과 서버 값의 보존 및 큐 종결은 함께 확정한다', async () => {
  const payload = { amount: '30', currency: 'USD', title: '원래 입력' };
  await enqueueTestTask('q1', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FAX', 'UPDATE', payload);
  await runDatabaseTransaction(async () => {
    await preserveLegacyHoldInTransaction(
      'expenses',
      '01ARZ3NDEKTSV4RRFFQ69G5FAX',
      '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      payload,
      EXPENSE,
      'q1',
    );
    await getDatabase().delete(syncQueue).where(eq(syncQueue.id, 'q1'));
  });
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({
    payload,
    current: EXPENSE,
    userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  });
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
});

it('실제 push 경로는 구버전 보류를 남기고 다음 수정까지 처리한다', async () => {
  const payload = { amount: '30', currency: 'USD', title: '옛 입력' };
  await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', payload);
  await enqueueTestTask('q2', 'expenses', EXPENSE.id, 'UPDATE', { category: 'transport', edit: EDIT_STAMP });
  jest
    .mocked(api.put)
    .mockRejectedValueOnce(
      new AxiosError(
        'conflict',
        'ERR_BAD_RESPONSE',
        undefined,
        {},
        {
          status: 409,
          data: { error: 'Conflict', code: 'LEGACY_UPDATE_CONFLICT', data: EXPENSE },
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      ),
    )
    .mockResolvedValueOnce({
      data: { success: true, data: { ...EXPENSE, category: 'transport', fieldEdits: { category: EDIT_STAMP } } },
    });
  await pushChanges();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({ payload });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ amount: '25', category: 'transport' });
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'sync.push.resolved', stage: 'legacy-held' }),
    undefined,
  );
});

it('잘못된 성공 본문은 큐를 삭제하지 않고 응답 뒤의 로컬 실패로 남긴다', async () => {
  await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', { title: '입력', edit: EDIT_STAMP });
  jest.mocked(api.put).mockResolvedValueOnce({ data: { success: true } });
  await expect(pushChanges()).rejects.toThrow();
  expect(await getDatabase().select().from(syncQueue).get()).toMatchObject({ status: 'FAILED' });
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'sync.push.blocked', stage: 'local-after-response' }),
    undefined,
  );
});

it('같은 시각의 큐는 임의 ID 순서 대신 실제 삽입 순서로 화면을 보호한다', async () => {
  await enqueueTestTask('z-first', 'expenses', EXPENSE.id, 'UPDATE', { title: '먼저', edit: EDIT_STAMP });
  await enqueueTestTask('a-later', 'expenses', EXPENSE.id, 'UPDATE', {
    title: '나중',
    edit: { ...EDIT_STAMP, sequence: 2 },
  });
  await reconcileServerRecord('expenses', EXPENSE);
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ title: '나중' });
});

it('같은 pull의 여행 삭제 다음에 살아 있는 자식이 와도 다시 노출되지 않는다', async () => {
  await reconcileServerRecord('trips', { ...TRIP, deletedAt: FIXTURE_TIME });
  await reconcileServerRecord('schedules', SCHEDULE);
  await reconcileServerRecord('expenses', EXPENSE);
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
});

it('기기에 없던 일정의 삭제도 저장해 이후 경비가 다시 연결되지 않게 한다', async () => {
  await getDatabase().delete(schedules).where(eq(schedules.id, SCHEDULE.id));
  await reconcileServerRecord('schedules', { ...SCHEDULE, deletedAt: FIXTURE_TIME });
  await reconcileServerRecord('expenses', EXPENSE);
  expect(await getDatabase().select().from(schedules).get()).toMatchObject({ deletedAt: FIXTURE_TIME });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ scheduleId: null });
});

it('개별 tombstone 수신은 구버전 생성과 손상·격리 입력을 자동 폐기하지 않는다', async () => {
  await enqueueTestTask('create', 'schedules', SCHEDULE.id, 'CREATE', SCHEDULE);
  await enqueueTestTask('bad', 'schedules', SCHEDULE.id, 'UPDATE', { title: 12 });
  await enqueueTestTask('held', 'schedules', SCHEDULE.id, 'UPDATE', { title: '격리' });
  await getDatabase().update(syncQueue).set({ status: 'QUARANTINED' }).where(eq(syncQueue.id, 'held'));
  await reconcileServerRecord('schedules', { ...SCHEDULE, deletedAt: FIXTURE_TIME });
  expect((await getDatabase().select().from(syncQueue).all()).map((row) => row.id)).toEqual(['create', 'bad', 'held']);
});

it('410 여행 삭제는 같은 스냅샷의 자식 작업을 건너뛰고 다른 여행 전송을 잇는다', async () => {
  const otherTrip = '01ARZ3NDEKTSV4RRFFQ69G5FB0';
  const otherSchedule = { ...SCHEDULE, id: '01ARZ3NDEKTSV4RRFFQ69G5FB1', tripId: otherTrip };
  await getDatabase()
    .insert(trips)
    .values({ ...TRIP, id: otherTrip });
  await getDatabase().insert(schedules).values(otherSchedule);
  await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', { title: '늦은 수정', edit: EDIT_STAMP });
  await enqueueTestTask('q2', 'schedules', SCHEDULE.id, 'UPDATE', { title: '다른 자식 수정', edit: EDIT_STAMP });
  await enqueueTestTask('q3', 'schedules', otherSchedule.id, 'UPDATE', { title: '다른 여행 수정', edit: EDIT_STAMP });
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
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {
            error: 'Gone',
            code: 'TRIP_DELETED',
            data: { id: EXPENSE.id, tripId: TRIP.id, deletedAt: FIXTURE_TIME },
          },
        },
      ),
    )
    .mockResolvedValueOnce({ data: { success: true, data: { ...otherSchedule, title: '다른 여행 수정' } } });
  const before = jest.mocked(api.put).mock.calls.length;
  await pushChanges();
  expect(jest.mocked(api.put).mock.calls.length - before).toBe(2);
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect(await getDatabase().select().from(trips).where(eq(trips.id, TRIP.id)).get()).toMatchObject({
    deletedAt: FIXTURE_TIME,
  });
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'sync.push.resolved', stage: 'trip-deleted' }),
    undefined,
  );
});

it.each([true, false])(
  '원본 없는 DELETE 성공 뒤 늦게 도착한 행을 되살리지 않는다 (여행 ID 보존=%s)',
  async (hasTripId) => {
    await getDatabase().delete(expenses).where(eq(expenses.id, EXPENSE.id));
    await enqueueTestTask('deleted', 'expenses', EXPENSE.id, 'DELETE', {
      ownerVersion: 1,
      userId: TRIP.userId,
      ...(hasTripId ? { tripId: TRIP.id } : {}),
    });
    jest.mocked(api.delete).mockResolvedValueOnce({
      data: { success: true, data: { id: EXPENSE.id, deletedAt: FIXTURE_TIME } },
    });
    await pushChanges();
    await reconcileServerRecord('expenses', EXPENSE);
    expect(await getDatabase().select().from(expenses).where(eq(expenses.id, EXPENSE.id)).get()).toBeUndefined();
    expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(0);
  },
);

it('원본 없는 DELETE도 저장한 소유자와 명시한 삭제 증거로 종결한다', async () => {
  const missing = '01ARZ3NDEKTSV4RRFFQ69G5FB2';
  await enqueueTestTask('q1', 'expenses', missing, 'DELETE', { ownerVersion: 1, userId: TRIP.userId });
  jest.mocked(api.delete).mockRejectedValueOnce(
    new AxiosError(
      'gone',
      'ERR_BAD_RESPONSE',
      undefined,
      {},
      {
        status: 410,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {
          error: 'Gone',
          code: 'ENTITY_DELETED',
          data: { id: missing, tripId: TRIP.id, deletedAt: FIXTURE_TIME },
        },
      },
    ),
  );
  await pushChanges();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: null });
});

it('미전송 로컬 여행 삭제와 목록 숨김은 서버 삭제로 추정해 자식 입력을 폐기하지 않는다', async () => {
  await getDatabase().update(trips).set({ deletedAt: FIXTURE_TIME }).where(eq(trips.id, TRIP.id));
  await enqueueTestTask('pending', 'expenses', EXPENSE.id, 'UPDATE', { title: '보존할 입력', edit: EDIT_STAMP });
  await reconcileServerRecord('expenses', { ...EXPENSE, title: '서버 값' });
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(1);
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: null, title: EXPENSE.title });
});

it('CREATE 재전송을 기다리는 동안 받은 서버의 독립 항목은 후속 UPDATE와 병합한다', async () => {
  await enqueueTestTask('create', 'expenses', EXPENSE.id, 'CREATE', EXPENSE);
  await enqueueTestTask('update', 'expenses', EXPENSE.id, 'UPDATE', { title: '로컬 제목', edit: EDIT_STAMP });
  await reconcileServerRecord('expenses', { ...EXPENSE, category: 'transport', amount: '40' });
  expect(await getDatabase().select().from(expenses).get()).toMatchObject({
    title: '로컬 제목',
    category: 'transport',
    amount: '40',
  });
  expect(await getDatabase().select().from(syncQueue).all()).toHaveLength(2);
});

const REMOTE_HOLD = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FB3',
  userId: TRIP.userId,
  tableName: 'expenses' as const,
  recordId: EXPENSE.id,
  tripId: TRIP.id,
  payload: { amount: '30', currency: 'USD', title: '옛 앱 직접 입력' },
  current: EXPENSE,
  createdAt: FIXTURE_TIME,
};

it('활성 여행이 없어도 예전 앱 직접 수정의 서버 보류를 수신한다', async () => {
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [REMOTE_HOLD] } });
  await pullChanges();
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({
    ...REMOTE_HOLD,
    serverBacked: true,
  });
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith('/api/sync/legacy-holds');
});

it('오프라인 확인은 원문을 지우고 ACK만 남기며 재수신이 입력을 되살리지 않는다', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { success: true, data: [REMOTE_HOLD] } });
  await synchronizeLegacyHolds();
  await clearLegacyHold(REMOTE_HOLD.id);
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
  expect(await getDatabase().select().from(legacyHoldAcks).get()).toMatchObject({
    id: REMOTE_HOLD.id,
    userId: TRIP.userId,
  });

  jest.mocked(api.delete).mockRejectedValueOnce(new Error('offline'));
  await expect(synchronizeLegacyHolds()).rejects.toThrow('offline');
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
  expect(await getDatabase().select().from(legacyHoldAcks).all()).toHaveLength(1);

  jest.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: { id: REMOTE_HOLD.id } } });
  await synchronizeLegacyHolds();
  expect(await getDatabase().select().from(legacyHoldAcks).where(eq(legacyHoldAcks.acknowledged, false)).all()).toEqual(
    [],
  );
});

it('서버 ID 수신은 같은 원문의 기존 로컬 보류와 중복 표시되지 않는다', async () => {
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction(
      'expenses',
      EXPENSE.id,
      TRIP.id,
      REMOTE_HOLD.payload,
      EXPENSE,
      'local-before-upgrade',
    ),
  );
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [REMOTE_HOLD] } });
  await synchronizeLegacyHolds();
  expect((await getDatabase().select().from(legacySyncHolds).all()).map((hold) => hold.id)).toEqual([REMOTE_HOLD.id]);
});

it('이미 수신한 서버 보류가 그대로여도 로컬 중복을 정리하면 목록에 알린다', async () => {
  await getDatabase()
    .insert(legacySyncHolds)
    .values([
      { ...REMOTE_HOLD, id: 'local-before-upgrade', serverBacked: false },
      { ...REMOTE_HOLD, serverBacked: true },
    ]);
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [REMOTE_HOLD] } });
  const onChange = jest.fn();
  const unsubscribe = subscribeLegacyHolds(onChange);

  try {
    await synchronizeLegacyHolds();
    expect((await getDatabase().select().from(legacySyncHolds).all()).map((hold) => hold.id)).toEqual([REMOTE_HOLD.id]);
    expect(onChange).toHaveBeenCalledTimes(1);
  } finally {
    unsubscribe();
  }
});

it.each([
  { deletedAt: 'invalid-date', tripId: TRIP.id, stage: 'server-rejected' },
  { deletedAt: FIXTURE_TIME, tripId: '', stage: 'server-rejected' },
  { deletedAt: '2026-11-10', tripId: TRIP.id, stage: 'local-after-response' },
  { deletedAt: FIXTURE_TIME, tripId: 'invalid-id', stage: 'local-after-response' },
])(
  '불완전한 삭제 응답은 입력을 보존하고 기존 실패 단계를 유지한다: $deletedAt/$tripId',
  async ({ deletedAt, tripId, stage }) => {
    const payload = { title: '보존할 입력', edit: EDIT_STAMP };
    await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', payload);
    jest.mocked(api.put).mockRejectedValueOnce(
      new AxiosError(
        'gone',
        'ERR_BAD_RESPONSE',
        undefined,
        {},
        {
          status: 410,
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { error: 'Gone', code: 'ENTITY_DELETED', data: { id: EXPENSE.id, tripId, deletedAt } },
        },
      ),
    );

    await expect(pushChanges()).rejects.toThrow();
    expect(await getDatabase().select().from(syncQueue).get()).toMatchObject({
      id: 'q1',
      payload: JSON.stringify(payload),
      status: 'FAILED',
    });
    expect(await getDatabase().select().from(expenses).get()).toMatchObject({ deletedAt: null });
    expect(reportSyncSignal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'sync.push.blocked', stage }),
      undefined,
    );
  },
);

it('확인한 뒤 같은 내용의 새 요청은 새 ID의 별도 입력으로 수신한다', async () => {
  jest.mocked(api.get).mockResolvedValue({ data: { success: true, data: [REMOTE_HOLD] } });
  await synchronizeLegacyHolds();
  await clearLegacyHold(REMOTE_HOLD.id);
  const next = { ...REMOTE_HOLD, id: '01ARZ3NDEKTSV4RRFFQ69G5FB4' };
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [next] } });
  jest.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: { id: REMOTE_HOLD.id } } });
  await synchronizeLegacyHolds();
  expect((await getDatabase().select().from(legacySyncHolds).all()).map((hold) => hold.id)).toEqual([next.id]);
});

it('옛 서버의 미지원 응답은 로컬 입력과 미확인 ACK를 버리지 않는다', async () => {
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  await clearLegacyHold(REMOTE_HOLD.id);
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(
      new AxiosError(
        'unsupported',
        'ERR_BAD_RESPONSE',
        undefined,
        {},
        { status: 404, data: {}, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } },
      ),
    );
  await synchronizeLegacyHolds();
  expect(await getDatabase().select().from(legacyHoldAcks).all()).toHaveLength(1);
});

it('큐 409는 서버 보류 ID를 그대로 사용해 다음 수신에서 중복되지 않는다', async () => {
  await enqueueTestTask('q1', 'expenses', EXPENSE.id, 'UPDATE', REMOTE_HOLD.payload);
  jest.mocked(api.put).mockRejectedValueOnce(
    new AxiosError(
      'conflict',
      'ERR_BAD_RESPONSE',
      undefined,
      {},
      {
        status: 409,
        data: {
          error: 'Conflict',
          code: 'LEGACY_UPDATE_CONFLICT',
          data: EXPENSE,
          recoveryId: REMOTE_HOLD.id,
          hold: REMOTE_HOLD,
        },
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    ),
  );
  await pushChanges();
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({
    id: REMOTE_HOLD.id,
    serverBacked: true,
    payload: REMOTE_HOLD.payload,
  });
});

it('목록 요청 중 로컬에서 확인한 입력은 늦은 서버 목록으로 다시 나타나지 않는다', async () => {
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  jest.mocked(api.get).mockImplementationOnce(async () => {
    requested();
    await gate;
    return { data: { success: true, data: [REMOTE_HOLD] } } as never;
  });
  jest.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: { id: REMOTE_HOLD.id } } });
  const pending = synchronizeLegacyHolds();
  await started;
  await clearLegacyHold(REMOTE_HOLD.id);
  release();
  await pending;
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
  expect(await getDatabase().select().from(legacyHoldAcks).where(eq(legacyHoldAcks.acknowledged, false)).all()).toEqual(
    [],
  );
});

it('목록 요청 중 새로 보존한 직접 요청 보류는 옛 빈 목록으로 삭제되지 않는다', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  jest.mocked(api.get).mockImplementationOnce(async () => {
    requested();
    await gate;
    return { data: { success: true, data: [] } } as never;
  });
  const pending = synchronizeLegacyHolds();
  await started;
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  release();
  await pending;
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({ id: REMOTE_HOLD.id });
});

it('다른 기기의 확인은 서버 목록에서 빠진 보류만 지우고 로컬 전용 입력은 보존한다', async () => {
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, { title: '로컬' }, EXPENSE, 'local-only'),
  );
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [] } });
  await synchronizeLegacyHolds();
  expect((await getDatabase().select().from(legacySyncHolds).all()).map((hold) => hold.id)).toEqual(['local-only']);

  await clearLegacyHold('local-only');
  expect(await getDatabase().select().from(legacyHoldAcks).where(eq(legacyHoldAcks.acknowledged, false)).all()).toEqual(
    [],
  );
});

it('ACK가 끝난 뒤 늦은 409가 돌아와도 같은 ID의 안내를 되살리지 않는다', async () => {
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  await clearLegacyHold(REMOTE_HOLD.id);
  jest.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: [REMOTE_HOLD] } });
  jest.mocked(api.delete).mockResolvedValueOnce({ data: { success: true, data: { id: REMOTE_HOLD.id } } });
  await synchronizeLegacyHolds();
  expect(await getDatabase().select().from(legacyHoldAcks).get()).toMatchObject({ acknowledged: true });

  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
});

it('표식을 관측하는 동안 계정이 바뀌면 이전 계정의 입력을 새 계정 보류로 저장하지 않는다', async () => {
  const previous = TRIP.userId;
  useAuthStore.setState({ status: 'signed-in', userId: '01ARZ3NDEKTSV4RRFFQ69G5FB5' });
  await expect(
    runDatabaseTransaction(() =>
      preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, REMOTE_HOLD.payload, EXPENSE, REMOTE_HOLD.id, {
        serverBacked: true,
      }),
    ),
  ).rejects.toThrow();
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);

  useAuthStore.setState({ status: 'signed-in', userId: previous });
  await expect(
    runDatabaseTransaction(() =>
      preserveLegacyHoldInTransaction(
        'expenses',
        EXPENSE.id,
        TRIP.id,
        { ...REMOTE_HOLD.payload, userId: 'foreign' },
        EXPENSE,
        REMOTE_HOLD.id,
        { serverBacked: false },
      ),
    ),
  ).rejects.toThrow();
  expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
});

it('서버가 보존한 구버전 원문의 부수 필드는 소유권 주장으로 해석하지 않고 그대로 보존한다', async () => {
  const payload = { ...REMOTE_HOLD.payload, userId: 'old-user', tripId: 'incidental-trip', id: 'incidental-id' };
  await runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction('expenses', EXPENSE.id, TRIP.id, payload, EXPENSE, REMOTE_HOLD.id, {
      serverBacked: true,
    }),
  );
  expect(await getDatabase().select().from(legacySyncHolds).get()).toMatchObject({
    userId: TRIP.userId,
    tripId: TRIP.id,
    recordId: EXPENSE.id,
    payload,
  });
});

it('확인한 여행 삭제는 원본 없는 자식 DELETE의 저장된 소유자·여행 증거도 정리한다', async () => {
  const missing = '01ARZ3NDEKTSV4RRFFQ69G5FB7';
  await enqueueTestTask('missing-child', 'expenses', missing, 'DELETE', {
    ownerVersion: 1,
    userId: TRIP.userId,
    tripId: TRIP.id,
  });
  await enqueueTestTask('unknown-trip', 'expenses', '01ARZ3NDEKTSV4RRFFQ69G5FB8', 'DELETE', {
    ownerVersion: 1,
    userId: TRIP.userId,
  });
  await enqueueTestTask('legacy-null', 'schedules', SCHEDULE.id, 'DELETE', null);
  await enqueueTestTask('legacy-trip', 'expenses', EXPENSE.id, 'DELETE', { tripId: TRIP.id });
  await runDatabaseTransaction(() => applyConfirmedDeletionInTransaction('trips', TRIP.id, TRIP.id, FIXTURE_TIME));
  expect((await getDatabase().select().from(syncQueue).all()).map((task) => task.id)).toEqual(['unknown-trip']);
});

it('구버전 DELETE의 늦은 410도 원본 소유·여행이 확인되면 끝내고 다음 여행을 전송한다', async () => {
  const otherTrip = '01ARZ3NDEKTSV4RRFFQ69G5FB9';
  const other = { ...SCHEDULE, id: '01ARZ3NDEKTSV4RRFFQ69G5FBA', tripId: otherTrip };
  await getDatabase()
    .insert(trips)
    .values({ ...TRIP, id: otherTrip });
  await getDatabase().insert(schedules).values(other);
  await enqueueTestTask('legacy', 'expenses', EXPENSE.id, 'DELETE', null);
  await enqueueTestTask('next-trip', 'schedules', other.id, 'UPDATE', { title: '다음 여행', edit: EDIT_STAMP });
  jest.mocked(api.delete).mockRejectedValueOnce(
    new AxiosError(
      'gone',
      'ERR_BAD_RESPONSE',
      undefined,
      {},
      {
        status: 410,
        data: {
          error: 'Gone',
          code: 'ENTITY_DELETED',
          data: { id: EXPENSE.id, tripId: TRIP.id, deletedAt: FIXTURE_TIME },
        },
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    ),
  );
  jest.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: { ...other, title: '다음 여행' } } });
  await pushChanges();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
  expect(api.put).toHaveBeenCalledWith('/api/schedules/' + other.id, { title: '다음 여행', edit: EDIT_STAMP });
});

it('보류 반영과 FAILED 기록이 함께 실패해도 원문을 남기고 중단 진단을 한 번 기록한다', async () => {
  const payload = { amount: '30' };
  await enqueueTestTask('legacy', 'expenses', EXPENSE.id, 'UPDATE', payload);
  await enqueueTestTask('later', 'expenses', EXPENSE.id, 'UPDATE', { title: '다음 입력', edit: EDIT_STAMP });
  const before = await getDatabase().select().from(syncQueue).all();
  getDatabase().run(
    sql.raw(
      "CREATE TRIGGER fail_hold BEFORE INSERT ON legacy_sync_holds BEGIN SELECT RAISE(ABORT, 'hold store unavailable'); END",
    ),
  );
  getDatabase().run(
    sql.raw(
      "CREATE TRIGGER fail_failure_status BEFORE UPDATE ON sync_queue WHEN NEW.status = 'FAILED' BEGIN SELECT RAISE(ABORT, 'queue store unavailable'); END",
    ),
  );
  jest.mocked(api.put).mockRejectedValueOnce(
    new AxiosError(
      'conflict',
      'ERR_BAD_RESPONSE',
      undefined,
      {},
      {
        status: 409,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { error: 'Conflict', code: 'LEGACY_UPDATE_CONFLICT', data: EXPENSE },
      },
    ),
  );
  try {
    await expect(pushChanges()).rejects.toThrow('queue store unavailable');
    expect(reportSyncSignal).toHaveBeenCalledTimes(1);
    expect(reportSyncSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'sync.push.blocked',
        stage: 'local-after-response',
        hasWaiting: true,
      }),
      undefined,
    );
    const after = await getDatabase().select().from(syncQueue).all();
    expect(after.map((task) => task.payload)).toEqual(before.map((task) => task.payload));
    expect(after.map((task) => task.status)).toEqual(['IN_PROGRESS', 'PENDING']);
    expect(await getDatabase().select().from(legacySyncHolds).all()).toEqual([]);
    expect(api.put).toHaveBeenCalledTimes(1);
  } finally {
    getDatabase().run(sql.raw('DROP TRIGGER fail_hold'));
    getDatabase().run(sql.raw('DROP TRIGGER fail_failure_status'));
  }
});
