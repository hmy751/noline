/** @jest-environment node */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createExpenseLocal, getExpensesByTripIdLocal } from '@/entities/expense/lib/expense-local';
import {
  createScheduleLocal,
  deleteScheduleLocal,
  getSchedulesLocal,
  updateScheduleLocal,
} from '@/entities/schedule/lib/schedule-local';
import { getTripByIdLocal, getTripsLocal, updateTripLocal } from '@/entities/trip/lib/trip-local';
import {
  expenses,
  getDatabase,
  initializeDatabase,
  resetDatabase,
  schedules,
  syncQueue,
  tripActivations,
  trips,
} from '@/shared/db';
import { getQueueOwner, inspectLocalAccount } from '@/shared/services/auth/local-account';
import { getTripActivationStatus } from '@/shared/services/offline-prep/metadata';
import { getSyncableTasks, recoverInterruptedTasks } from '@/shared/services/sync/queue';
import { useAuthStore } from '@/shared/store/auth';

// 실제 Drizzle SQL과 SQLite를 사용한다. 파일·기기 SecureStore는 사용하지 않는다.
jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/id/ulid', () => ({
  generateId: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
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

it('FAILED 작업은 실패 횟수와 관계없이 다음 sync 대상이며 FIFO 순서를 유지한다', async () => {
  await getDatabase()
    .insert(syncQueue)
    .values([
      {
        id: 'failed-once',
        tableName: 'trips',
        recordId: 'trip-a',
        action: 'UPDATE',
        payload: '{}',
        status: 'FAILED',
        retryCount: 1,
        createdAt: now,
      },
      {
        id: 'failed-many',
        tableName: 'trips',
        recordId: 'trip-a',
        action: 'UPDATE',
        payload: '{}',
        status: 'FAILED',
        retryCount: 3,
        createdAt: '2026-01-02T00:00:00Z',
      },
      {
        id: 'later',
        tableName: 'trips',
        recordId: 'trip-a',
        action: 'UPDATE',
        payload: '{}',
        status: 'PENDING',
        retryCount: 0,
        createdAt: '2026-01-03T00:00:00Z',
      },
    ]);

  expect((await getSyncableTasks()).map((task) => task.id)).toEqual(['failed-once', 'failed-many', 'later']);
});

it('IN_PROGRESS는 되돌리기 전까지 뒤 작업을 막고, 되돌리면 횟수를 유지한 채 PENDING으로 다시 보낸다', async () => {
  await getDatabase()
    .insert(syncQueue)
    .values([
      {
        id: 'interrupted',
        tableName: 'trips',
        recordId: 'trip-a',
        action: 'UPDATE',
        payload: '{}',
        status: 'IN_PROGRESS',
        retryCount: 2,
        createdAt: now,
      },
      {
        id: 'later',
        tableName: 'trips',
        recordId: 'trip-a',
        action: 'UPDATE',
        payload: '{}',
        status: 'PENDING',
        retryCount: 0,
        createdAt: '2026-01-03T00:00:00Z',
      },
    ]);

  expect(await getSyncableTasks()).toEqual([]);

  await recoverInterruptedTasks();

  const tasks = await getSyncableTasks();
  expect(tasks.map((task) => task.id)).toEqual(['interrupted', 'later']);
  expect(tasks[0]).toMatchObject({ status: 'PENDING', retryCount: 2 });
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
