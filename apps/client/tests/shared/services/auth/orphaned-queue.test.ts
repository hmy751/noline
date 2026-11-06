/** @jest-environment node */
import { beforeEach, expect, it, jest } from '@jest/globals';

import * as SecureStore from 'expo-secure-store';

import { eq } from 'drizzle-orm';

import { syncStatusEnum } from '@repo/schema/sync/sync-queue';

import { refreshTripListLocal } from '@/entities/trip/lib/trip-local';
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
import { inspectLocalAccount } from '@/shared/services/auth/local-account';
import { completeLogin } from '@/shared/services/auth/login-service';
import { checkPendingSync, performLogout } from '@/shared/services/auth/logout-service';
import api from '@/shared/services/sync/api';
import { vacuumDeletedRecords } from '@/shared/services/sync/cleanup-job';
import { pushChanges, syncData } from '@/shared/services/sync/engine';
import {
  deleteTask,
  getFailedTasks,
  getPendingTasks,
  getSyncableTasks,
  getSyncQueueStats,
  getTaskById,
  recoverInterruptedTasks,
  retryFailedTask,
  updateTaskStatus,
} from '@/shared/services/sync/queue';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: { post: jest.fn(), put: jest.fn(), delete: jest.fn(), get: jest.fn() },
}));
jest.mock('@/shared/services/auth/auth-api', () => ({
  logout: jest.fn(),
  deleteAccount: jest.fn(),
  revokeRefreshToken: jest.fn(),
}));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: jest.fn() }));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: {
    clear: jest.fn(),
    cancelQueries: jest.fn(async () => undefined),
    invalidateQueries: jest.fn(async () => undefined),
  },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
// 실제 Drizzle SQL과 SQLite를 사용한다. 파일·기기 SecureStore는 사용하지 않는다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));
jest.mock('@/shared/services/id/ulid', () => ({
  generateId: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
}));

const now = '2026-01-01T00:00:00Z';
const session = { userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', accessToken: 'access', refreshToken: 'refresh' };
const trip = {
  id: 'trip-a',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  name: '서울',
  destination: '서울',
  startDate: now,
  endDate: now,
  createdAt: now,
  updatedAt: now,
};
const orphan = {
  id: 'orphan',
  tableName: 'trips',
  recordId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
  action: 'CREATE',
  payload: '{"name":"보존할 입력"}',
  status: 'FAILED',
  retryCount: 7,
  createdAt: now,
  updatedAt: now,
};

beforeEach(async () => {
  jest.clearAllMocks();
  await initializeDatabase();
  await resetDatabase();
  useAuthStore.setState({ status: 'signed-out', userId: null });
  await useAuthStore.getState().saveAndApplySession(session);
});

it.each(['CREATE', 'UPDATE', 'DELETE'])(
  '%s 원본 없는 작업은 내용 그대로 격리하고 같은 계정 로그인·정상 push를 허용한다',
  async (action) => {
    await getDatabase().insert(trips).values(trip);
    await getDatabase()
      .insert(syncQueue)
      .values([
        { ...orphan, action },
        {
          ...orphan,
          id: 'valid',
          recordId: trip.id,
          action: 'UPDATE',
          payload: '{}',
          status: 'PENDING',
          createdAt: '2026-01-02T00:00:00Z',
        },
      ]);
    useAuthStore.setState({ status: 'restore-failed', userId: null });

    await expect(completeLogin(session)).resolves.toBeUndefined();
    expect(useAuthStore.getState().status).toBe('signed-in');
    expect(await inspectLocalAccount('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe('same');
    await expect(pushChanges()).resolves.toBeUndefined();
    expect(api.put).toHaveBeenCalledWith('/api/trips/trip-a', {});
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
    expect(await getDatabase().select().from(syncQueue).all()).toEqual([{ ...orphan, action, status: 'QUARANTINED' }]);
    expect(await checkPendingSync()).toMatchObject({ hasPending: true, pendingCount: 1 });
    await expect(performLogout()).resolves.toMatchObject({ success: false, hasPendingSync: true });
  },
);

it('저장된 같은 계정 복원도 격리를 보존하며 성공한다', async () => {
  await getDatabase().insert(syncQueue).values(orphan);
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify({ ...session, version: 1, userInfo: null }));
  useAuthStore.setState({ status: 'restore-failed', userId: null });
  await useAuthStore.getState().retrySessionRestore();

  expect(useAuthStore.getState()).toMatchObject({ status: 'signed-in', userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });

  const storedStatus = (await getDatabase().select().from(syncQueue).get())?.status;

  expect(syncStatusEnum.parse(storedStatus)).toBe('QUARANTINED');
});

it('원본이 pull로 되살아나도 재시도·중단 복구·상태 수정·성공 삭제는 격리를 풀거나 지우지 않는다', async () => {
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, status: 'IN_PROGRESS' });
  await getDatabase().insert(trips).values(trip);
  await getDatabase().insert(tripActivations).values({
    id: 'activation',
    tripId: trip.id,
    userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    isActivated: true,
    activatedAt: now,
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
  });
  jest.mocked(api.get).mockResolvedValue({
    data: {
      success: true,
      data: {
        trips: [
          {
            ...trip,
            id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
            country: null,
            baseCurrency: 'USD',
            latitude: null,
            longitude: null,
            cityId: null,
            timeZone: null,
            deletedAt: null,
            version: 1,
          },
        ],
        schedules: [],
        expenses: [],
        serverTime: now,
      },
    },
  });

  await expect(syncData()).resolves.toBeUndefined();
  expect(api.get).toHaveBeenCalled();
  expect(await getDatabase().select().from(trips).where(eq(trips.id, '01ARZ3NDEKTSV4RRFFQ69G5FAX')).get()).toBeTruthy();

  await retryFailedTask(orphan.id);
  await recoverInterruptedTasks();
  await updateTaskStatus(orphan.id, 'FAILED', 0);
  await deleteTask(orphan.id);
  await pushChanges();

  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
  expect(api.delete).not.toHaveBeenCalled();
  expect(await getTaskById(orphan.id)).toBeNull();
  expect(await getPendingTasks()).toEqual([]);
  expect(await getFailedTasks()).toEqual([]);
  expect(await getSyncableTasks()).toEqual([]);
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([{ ...orphan, status: 'QUARANTINED' }]);
  expect(await getSyncQueueStats()).toEqual({ pending: 0, inProgress: 0, failed: 0, quarantined: 1, total: 1 });
});

it.each([
  { tableName: 'unsupported', payload: '{}' },
  { tableName: 'toString', payload: '{}' },
])('미지원 테이블은 격리로 우회하지 않는다: %j', async (override) => {
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, ...override });

  expect(await inspectLocalAccount('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe('unresolved');
  await expect(completeLogin(session)).rejects.toThrow('소유자');
  await expect(pushChanges()).rejects.toThrow();
  expect((await getDatabase().select().from(syncQueue).get())?.status).toBe('FAILED');
  expect(api.post).not.toHaveBeenCalled();
});

it.each([
  { userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', payload: '{broken' },
  { userId: 'b', payload: '{}' },
  { userId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', payload: '{"userId":"b"}' },
])('실제 다른 소유자와 payload 손상·모순은 기존 거절을 보존한다: %j', async ({ userId, payload }) => {
  await getDatabase()
    .insert(trips)
    .values({ ...trip, userId });
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, recordId: trip.id, payload });

  expect(await inspectLocalAccount('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(userId === 'b' ? 'different' : 'unresolved');
  await expect(completeLogin(session)).rejects.toThrow();
  await expect(pushChanges()).rejects.toThrow();
  expect((await getDatabase().select().from(syncQueue).get())?.status).toBe('FAILED');
});

it('계정 미확정 격리는 다른 계정 로그인 후에도 조회·전송되지 않으며 정상 큐를 막지 않는다', async () => {
  await getDatabase().insert(syncQueue).values(orphan);

  expect(await inspectLocalAccount('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe('empty');

  useAuthStore.setState({ status: 'signed-out', userId: null });
  await completeLogin({ ...session, userId: 'b' });
  await getDatabase()
    .insert(trips)
    .values({ ...trip, userId: 'b' });
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, id: 'b-task', recordId: trip.id, payload: '{}', status: 'PENDING', action: 'UPDATE' });

  expect(await getTaskById(orphan.id)).toBeNull();

  await pushChanges();

  expect(api.put).toHaveBeenCalledTimes(1);
  expect(api.post).not.toHaveBeenCalled();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([{ ...orphan, status: 'QUARANTINED' }]);
});

it('vacuum과 재초기화는 격리 입력을 유지하고 명시적 강제 로그아웃만 폐기한다', async () => {
  await getDatabase().insert(syncQueue).values(orphan);
  await inspectLocalAccount('01ARZ3NDEKTSV4RRFFQ69G5FAV');
  await vacuumDeletedRecords();
  await initializeDatabase();

  expect(await getDatabase().select().from(syncQueue).all()).toEqual([{ ...orphan, status: 'QUARANTINED' }]);
  await expect(performLogout({ force: true })).resolves.toMatchObject({ success: true });
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([]);
});

it('원본 없는 손상 payload도 원문을 격리하고 계정을 추정하지 않는다', async () => {
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, payload: '{broken' });

  expect(await inspectLocalAccount(session.userId)).toBe('empty');
  await expect(completeLogin(session)).resolves.toBeUndefined();
  await expect(pushChanges()).resolves.toBeUndefined();
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([
    { ...orphan, payload: '{broken', status: 'QUARANTINED' },
  ]);
  expect(api.post).not.toHaveBeenCalled();
});

it.each(['schedules', 'expenses'] as const)(
  '구버전 %s DELETE null 격리는 앞뒤 정상 FIFO와 첫 실패 중단을 보존한다',
  async (tableName) => {
    await getDatabase().insert(trips).values(trip);
    await getDatabase()
      .insert(syncQueue)
      .values([
        {
          ...orphan,
          id: 'before',
          recordId: trip.id,
          payload: '{"name":"before"}',
          action: 'UPDATE',
          status: 'PENDING',
          createdAt: '2025-01-01T00:00:00Z',
        },
        { ...orphan, tableName, action: 'DELETE', payload: 'null' },
        {
          ...orphan,
          id: 'failure',
          recordId: trip.id,
          payload: '{"name":"failure"}',
          action: 'UPDATE',
          status: 'FAILED',
          createdAt: '2026-01-02T00:00:00Z',
        },
        {
          ...orphan,
          id: 'after',
          recordId: trip.id,
          payload: '{"name":"after"}',
          action: 'UPDATE',
          status: 'PENDING',
          createdAt: '2026-01-03T00:00:00Z',
        },
      ]);
    jest.mocked(api.put).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('offline'));

    await expect(pushChanges()).rejects.toThrow('동기화하지 못한');
    expect(jest.mocked(api.put).mock.calls.map((call) => call[1])).toEqual([{ name: 'before' }, { name: 'failure' }]);
    expect((await getDatabase().select().from(syncQueue).where(eq(syncQueue.id, 'after')).get())?.status).toBe(
      'PENDING',
    );
    expect(await getDatabase().select().from(syncQueue).where(eq(syncQueue.id, orphan.id)).get()).toEqual({
      ...orphan,
      tableName,
      action: 'DELETE',
      payload: 'null',
      status: 'QUARANTINED',
    });

    await pushChanges();

    expect(jest.mocked(api.put).mock.calls.map((call) => call[1])).toEqual([
      { name: 'before' },
      { name: 'failure' },
      { name: 'failure' },
      { name: 'after' },
    ]);
    expect(api.delete).not.toHaveBeenCalled();
  },
);

it.each(['trips', 'schedules', 'expenses'] as const)(
  '%s 격리가 비활성 여행의 서버 목록 갱신과 제거를 막지 않는다',
  async (tableName) => {
    if (tableName !== 'trips') {
      await getDatabase().insert(trips).values(trip);
    }

    const recordId = tableName === 'trips' ? trip.id : orphan.recordId;

    await getDatabase()
      .insert(syncQueue)
      .values({ ...orphan, tableName, recordId });
    await inspectLocalAccount(session.userId);
    if (tableName === 'trips') {
      await getDatabase().insert(trips).values(trip);
    } else {
      await resurrectChild(tableName);
    }

    await refreshTripListLocal(
      [
        {
          ...trip,
          name: '서버에서 수정',
          baseCurrency: 'USD',
          country: null,
          latitude: null,
          longitude: null,
          cityId: null,
          timeZone: null,
          deletedAt: null,
          version: 2,
        },
      ],
      useAuthStore.getState().sessionId,
    );

    expect((await getDatabase().select().from(trips).where(eq(trips.id, trip.id)).get())?.name).toBe('서버에서 수정');

    await refreshTripListLocal([], useAuthStore.getState().sessionId);

    expect((await getDatabase().select().from(trips).where(eq(trips.id, trip.id)).get())?.deletedAt).not.toBeNull();
    expect((await getDatabase().select().from(syncQueue).get())?.status).toBe('QUARANTINED');
  },
);

it.each(['schedules', 'expenses'] as const)(
  '%s 격리 후 되살아난 오래된 삭제 행은 vacuum하고 격리 입력은 보존한다',
  async (tableName) => {
    await getDatabase().insert(trips).values(trip);
    await getDatabase()
      .insert(syncQueue)
      .values({ ...orphan, tableName });
    await inspectLocalAccount(session.userId);
    await resurrectChild(tableName, '2000-01-01T00:00:00Z');

    const counts = await vacuumDeletedRecords();

    expect(counts[tableName]).toBe(1);
    expect(await getDatabase().select().from(syncQueue).all()).toEqual([
      { ...orphan, tableName, status: 'QUARANTINED' },
    ]);
  },
);

it('원본 있는 미지원 action은 기존 계정 확인을 통과하고 push의 작업 오류로 남긴다', async () => {
  await getDatabase().insert(trips).values(trip);
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, recordId: trip.id, action: 'LEGACY_ACTION', payload: '{}' });

  expect(await inspectLocalAccount(session.userId)).toBe('same');
  await expect(completeLogin(session)).resolves.toBeUndefined();
  await expect(pushChanges()).rejects.toThrow('동기화하지 못한');
  expect(await getDatabase().select().from(syncQueue).get()).toMatchObject({
    status: 'FAILED',
    retryCount: orphan.retryCount + 1,
  });
  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
  expect(api.delete).not.toHaveBeenCalled();
});

it('원본도 없는 미지원 action은 격리로 우회하지 않고 확인 불가로 보존한다', async () => {
  await getDatabase()
    .insert(syncQueue)
    .values({ ...orphan, action: 'LEGACY_ACTION' });

  expect(await inspectLocalAccount(session.userId)).toBe('unresolved');
  await expect(completeLogin(session)).rejects.toThrow('소유자');
  expect(await getDatabase().select().from(syncQueue).all()).toEqual([{ ...orphan, action: 'LEGACY_ACTION' }]);
});

const resurrectChild = async (tableName: 'schedules' | 'expenses', deletedAt: string | null = null): Promise<void> => {
  if (tableName === 'schedules') {
    await getDatabase().insert(schedules).values({
      id: orphan.recordId,
      userId: session.userId,
      tripId: trip.id,
      title: '되살아난 행',
      location: '서울',
      scheduledAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt,
    });
  } else {
    await getDatabase().insert(expenses).values({
      id: orphan.recordId,
      userId: session.userId,
      tripId: trip.id,
      title: '되살아난 행',
      amount: '1',
      category: 'food',
      date: '2026-01-01',
      createdAt: now,
      updatedAt: now,
      deletedAt,
    });
  }
};
