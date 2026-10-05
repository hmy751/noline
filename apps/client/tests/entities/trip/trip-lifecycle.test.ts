/** @jest-environment node */
import { beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';
import {
  getDatabase,
  initializeDatabase,
  resetDatabase,
  trips,
  tripActivations,
  syncQueue,
  schedules,
  expenses,
} from '@/shared/db';
import { APIError } from '@/shared/api/errors';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore, useNetworkStore } from '@/shared/store/network';
import { TripRepository } from '@/entities/trip/repository/trip-repository';
import * as TripApi from '@/entities/trip/api/trips';
import { refreshTripListLocal } from '@/entities/trip/lib/trip-local';
import type { Trip } from '@/entities/trip/model';

jest.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: jest.fn() } }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/api/trips');
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

const now = '2026-10-04T00:00:00.000Z';
const userId = '01ARZ3NDEKTSV4RRFFQ69G5FA0';
const activeId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const newId = '01ARZ3NDEKTSV4RRFFQ69G5FAZ';
const input = {
  id: newId,
  name: 'Tokyo',
  destination: 'Tokyo',
  country: 'Japan',
  baseCurrency: 'JPY',
  startDate: now,
  endDate: now,
  cityId: null,
  latitude: 0,
  longitude: 0,
};
const remoteTrip: Trip = {
  ...input,
  userId,
  latitude: '0',
  longitude: '0',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  version: 1,
};
const queued = () => getDatabase().select().from(syncQueue).all();

beforeEach(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  await initializeDatabase();
  await resetDatabase();
  await useAuthStore.getState().saveAndApplySession({ userId, accessToken: 'access', refreshToken: 'refresh' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  await getDatabase()
    .insert(trips)
    .values({ ...remoteTrip, userId, id: activeId, name: 'Paris' });
  await getDatabase().insert(tripActivations).values({
    id: activeId,
    tripId: activeId,
    userId,
    isActivated: true,
    activatedAt: now,
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
  });
  jest.mocked(TripApi.fetchCreateTrip).mockResolvedValue(remoteTrip);
  jest.mocked(TripApi.fetchDeleteTrip).mockResolvedValue({ id: newId, deletedAt: now });
});
afterEach(() => {
  networkStore.cleanup();
  jest.restoreAllMocks();
});

it('생성·수정·삭제는 서버에서 확정하고 목록 재조회가 로컬 사본을 갱신한다', async () => {
  expect(await TripRepository.create(input)).toEqual(remoteTrip);
  expect(getDatabase().select().from(trips).where(eq(trips.id, newId)).get()).toBeUndefined();
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
  const first = await TripRepository.getAllWithSource();
  expect(first.source).toBe('mixed');
  expect(first.trips).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: newId, baseCurrency: 'JPY' }),
      expect.objectContaining({ id: activeId }),
    ]),
  );
  expect(queued()).toEqual([]);

  const updated = { ...remoteTrip, name: 'Tokyo edited', baseCurrency: 'USD', version: 2 };
  jest.mocked(TripApi.fetchUpdateTrip).mockResolvedValue(updated);
  await TripRepository.update(newId, { name: updated.name, baseCurrency: 'USD' });
  expect(getDatabase().select().from(trips).where(eq(trips.id, newId)).get()?.name).toBe('Tokyo');
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [updated] });
  expect((await TripRepository.getAllWithSource()).trips.find((t) => t.id === newId)).toEqual(updated);
  await TripRepository.delete(newId);
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [] });
  expect((await TripRepository.getAllWithSource()).trips.map((t) => t.id)).toEqual([activeId]);
  expect(getDatabase().select().from(trips).where(eq(trips.id, newId)).get()?.deletedAt).not.toBeNull();
  expect(queued()).toEqual([]);
});

it('server 목록 갱신 뒤 offline에서는 해당 사본과 활성 여행을 읽는다', async () => {
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
  await TripRepository.getAllWithSource();
  jest.mocked(TripApi.fetchAllTrips).mockClear();
  useNetworkStore.setState({ realStatus: 'offline' });
  expect(await TripRepository.getAllWithSource()).toMatchObject({
    source: 'local',
    trips: expect.arrayContaining([expect.objectContaining({ id: newId })]),
  });
  expect(TripApi.fetchAllTrips).not.toHaveBeenCalled();
});

it('서버 목록 오류는 기존 사본을 건드리지 않고 재조회로 복구된다', async () => {
  await getDatabase()
    .insert(trips)
    .values({ ...remoteTrip, userId, name: 'old cache' });
  jest.mocked(TripApi.fetchAllTrips).mockRejectedValueOnce(new Error('server failed'));
  await expect(TripRepository.getAllWithSource()).rejects.toThrow('server failed');
  expect(getDatabase().select().from(trips).where(eq(trips.id, newId)).get()?.name).toBe('old cache');
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
  expect((await TripRepository.getAllWithSource()).trips.find((t) => t.id === newId)?.name).toBe('Tokyo');
});

it('활성 여행의 수정·삭제는 기존 로컬 트랜잭션과 동기화 대기열을 유지한다', async () => {
  await TripRepository.update(activeId, { name: 'Paris edited' });
  await TripRepository.delete(activeId);
  expect(TripApi.fetchUpdateTrip).not.toHaveBeenCalled();
  expect(TripApi.fetchDeleteTrip).not.toHaveBeenCalled();
  expect(queued().map((t) => t.action)).toEqual(['UPDATE', 'DELETE']);
});

it.each(['PENDING', 'IN_PROGRESS', 'FAILED'])(
  '비활성 여행의 %s 변경과 큐를 서버 값으로 덮지 않는다',
  async (status) => {
    await getDatabase()
      .insert(trips)
      .values({ ...remoteTrip, userId, name: 'local edit' });
    await getDatabase().insert(syncQueue).values({
      id: 'queue',
      tableName: 'trips',
      recordId: newId,
      action: 'UPDATE',
      payload: '{}',
      status,
      createdAt: now,
    });
    const before = queued();
    jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
    expect((await TripRepository.getAllWithSource()).trips.find((t) => t.id === newId)?.name).toBe('local edit');
    jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [] });
    expect((await TripRepository.getAllWithSource()).trips.some((t) => t.id === newId)).toBe(true);
    expect(queued()).toEqual(before);
  },
);

it('미전송 로컬 삭제는 서버 목록에 남아 있어도 다시 나타나지 않는다', async () => {
  await getDatabase()
    .insert(trips)
    .values({ ...remoteTrip, userId, deletedAt: now });
  await getDatabase().insert(syncQueue).values({
    id: 'queue',
    tableName: 'trips',
    recordId: newId,
    action: 'DELETE',
    payload: 'null',
    status: 'FAILED',
    createdAt: now,
  });
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
  expect((await TripRepository.getAllWithSource()).trips.some((t) => t.id === newId)).toBe(false);
  expect(queued()).toHaveLength(1);
});

it('다른 계정이나 끝난 세션의 목록 응답은 로컬 DB에 반영하지 않는다', async () => {
  const sessionId = useAuthStore.getState().sessionId;
  await expect(refreshTripListLocal([{ ...remoteTrip, userId: 'other-user' }], sessionId)).rejects.toThrow('다른 계정');
  await expect(refreshTripListLocal([remoteTrip], Symbol('old session'))).rejects.toMatchObject({
    name: 'AuthRequiredError',
  });
  expect(getDatabase().select().from(trips).all()).toHaveLength(1);
});

it('서버 변경 실패는 기존 목록과 큐를 건드리지 않는다', async () => {
  jest.mocked(TripApi.fetchCreateTrip).mockRejectedValueOnce(new Error('server failed'));
  await expect(TripRepository.create(input)).rejects.toThrow('server failed');
  expect(getDatabase().select().from(trips).all()).toHaveLength(1);
  expect(queued()).toEqual([]);
});

it.each(['schedules', 'expenses'] as const)(
  '비활성 여행의 미전송 %s가 있으면 서버 목록에서 부모가 없어도 보존한다',
  async (tableName) => {
    await getDatabase()
      .insert(trips)
      .values({ ...remoteTrip, userId });
    if (tableName === 'schedules')
      await getDatabase().insert(schedules).values({
        id: 'child',
        userId,
        tripId: newId,
        title: '일정',
        location: '서울',
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
      });
    else
      await getDatabase().insert(expenses).values({
        id: 'child',
        userId,
        tripId: newId,
        title: '경비',
        amount: '10',
        currency: 'JPY',
        category: 'food',
        date: '2026-10-04',
        createdAt: now,
        updatedAt: now,
      });
    await getDatabase().insert(syncQueue).values({
      id: 'queue',
      tableName,
      recordId: 'child',
      action: 'DELETE',
      payload: 'null',
      status: 'FAILED',
      createdAt: now,
    });
    jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [] });
    expect((await TripRepository.getAllWithSource()).trips.some((t) => t.id === newId)).toBe(true);
    expect(queued()).toHaveLength(1);
  },
);

it('활성 여행이 없어도 서버 목록을 캐시하고 source는 remote로 반환한다', async () => {
  await getDatabase().update(tripActivations).set({ isActivated: false });
  jest.mocked(TripApi.fetchAllTrips).mockResolvedValue({ success: true, data: [remoteTrip] });
  expect(await TripRepository.getAllWithSource()).toMatchObject({ source: 'remote', trips: [remoteTrip] });
});

it('취소된 조회는 서버의 오래된 목록을 로컬에 저장하지 않는다', async () => {
  const abort = new AbortController();
  abort.abort();
  await expect(refreshTripListLocal([remoteTrip], useAuthStore.getState().sessionId, abort.signal)).rejects.toThrow(
    '취소된',
  );
  expect(getDatabase().select().from(trips).all()).toHaveLength(1);
});

it.each([0, 408, 503])('온라인으로 감지돼도 API 오류 %s에서는 활성 여행의 로컬 목록을 제공한다', async (status) => {
  jest
    .mocked(TripApi.fetchAllTrips)
    .mockRejectedValueOnce(new APIError('unavailable', status, status === 0 ? 'NETWORK_ERROR' : 'SERVER_ERROR'));
  await expect(TripRepository.getAllWithSource()).resolves.toMatchObject({
    source: 'local',
    trips: [expect.objectContaining({ id: activeId })],
  });
});
it('서버 오류라도 활성 여행이 없으면 오래된 비활성 사본을 정상 조회로 반환하지 않는다', async () => {
  await getDatabase().update(tripActivations).set({ isActivated: false });
  jest.mocked(TripApi.fetchAllTrips).mockRejectedValueOnce(new APIError('unavailable', 503, 'SERVER_ERROR'));
  await expect(TripRepository.getAllWithSource()).rejects.toMatchObject({ status: 503 });
});
it.each([
  new APIError('unauthorized', 401, 'TOKEN_INVALID'),
  new APIError('unknown', 0, 'UNKNOWN_ERROR'),
  new Error('invalid response'),
])('인증·미분류·응답 계약 오류는 로컬 fallback으로 숨기지 않는다: %s', async (error) => {
  jest.mocked(TripApi.fetchAllTrips).mockRejectedValueOnce(error);
  await expect(TripRepository.getAllWithSource()).rejects.toBe(error);
});
