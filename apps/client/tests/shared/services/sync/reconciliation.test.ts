/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';

import { eq, sql } from 'drizzle-orm';

import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  schedules,
  trips,
  expenses,
  syncQueue,
  runDatabaseTransaction,
  serverRecords,
  tripActivations,
} from '@/shared/db';
import { reportSyncSignal } from '@/shared/diagnostics/sentry';
import api from '@/shared/services/sync/api';
import { pushChanges, syncData } from '@/shared/services/sync/engine';

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
