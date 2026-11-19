/** @jest-environment node */
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

import {
  getDatabase,
  initializeDatabase,
  offlineCities,
  resetDatabase,
  syncQueue,
  tripActivations,
  trips,
} from '@/shared/db';
import {
  cleanupExpiredOfflineMaps,
  cleanupOfflineMapForTrip,
  downloadOfflineMapInBackground,
} from '@/shared/services/offline-map';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { OFFLINE_MAP_STYLE_URL } from '@/shared/lib/mapbox';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () =>
    jest.requireActual<typeof import('../../../helpers/sqlite')>('../../../helpers/sqlite').createExpoSQLiteDatabase(),
}));
jest.mock('@rnmapbox/maps', () => ({
  __esModule: true,
  default: { offlineManager: { createPack: jest.fn(), getPacks: jest.fn(), deletePack: jest.fn() } },
}));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(async () => undefined) },
}));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'after-cleanup' }));

const manager = jest.requireMock<{
  default: {
    offlineManager: {
      createPack: jest.Mock<(options: { name: string }) => Promise<void>>;
      getPacks: jest.Mock<() => Promise<{ name: string; size: number }[]>>;
      deletePack: jest.Mock<(name: string) => Promise<void>>;
    };
  };
}>('@rnmapbox/maps').default.offlineManager;

const nativePacks = new Set<string>();
const CITY_ID = 1835848;
const PACK_NAME = `offline_city_${CITY_ID}`;
const TIME = '2026-11-14T00:00:00.000Z';

beforeEach(async () => {
  nativePacks.clear();
  manager.getPacks.mockImplementation(async () => Array.from(nativePacks, (name) => ({ name, size: 100 })));
  manager.createPack.mockImplementation(async ({ name }) => {
    nativePacks.add(name);
  });
  manager.deletePack.mockImplementation(async (name) => {
    nativePacks.delete(name);
  });
  useAuthStore.setState({ status: 'signed-in', userId: 'user', sessionId: Symbol('session') });
  await initializeDatabase();
  await resetDatabase();
  for (const id of ['A', 'B']) {
    await getDatabase().insert(trips).values({
      id,
      userId: 'user',
      name: id,
      cityId: CITY_ID,
      destination: '서울',
      timeZone: 'Asia/Seoul',
      latitude: '37.5665',
      longitude: '126.978',
      startDate: TIME,
      endDate: TIME,
      createdAt: TIME,
      updatedAt: TIME,
    });
    await getDatabase()
      .insert(tripActivations)
      .values({
        id: `prep-${id}`,
        tripId: id,
        userId: 'user',
        isActivated: id === 'A',
        activatedAt: TIME,
        expiresAt: TIME,
        createdAt: TIME,
        updatedAt: TIME,
      });
  }
});

const setActive = (tripId: string, isActivated: boolean) =>
  getDatabase().update(tripActivations).set({ isActivated }).where(eq(tripActivations.tripId, tripId));

const activation = (tripId: string) =>
  getDatabase().select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();

const city = () => getDatabase().select().from(offlineCities).where(eq(offlineCities.cityId, CITY_ID)).get();

async function selectTripB() {
  await setActive('A', false);
  await setActive('B', true);
}

async function acquireForBothTrips() {
  await downloadOfflineMapInBackground('A');
  await selectTripB();
  await downloadOfflineMapInBackground('B');
}

afterEach(() => {
  jest.useRealTimers();
});

it('미전송 큐가 비어 지도 미획득 여행 A의 정리를 실행해도 B의 공유 지도를 보존한다', async () => {
  await selectTripB();
  await downloadOfflineMapInBackground('B');
  await getDatabase().update(tripActivations).set({ cleanupPending: true }).where(eq(tripActivations.tripId, 'A'));
  await getDatabase().insert(syncQueue).values({
    id: 'unsent',
    tableName: 'trips',
    recordId: 'A',
    action: 'UPDATE',
    payload: '{"name":"변경"}',
    createdAt: TIME,
  });

  await processPendingCleanups();
  expect(activation('A')).toMatchObject({ cleanupPending: true, mapDownloaded: false });
  expect(getDatabase().select().from(syncQueue).get()).toMatchObject({ id: 'unsent' });
  await getDatabase().delete(syncQueue).where(eq(syncQueue.id, 'unsent'));
  await processPendingCleanups();

  expect(activation('A')).toMatchObject({ cleanupPending: false, mapDownloaded: false });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(manager.deletePack).not.toHaveBeenCalled();
});

it.each(['정상', '구버전 과소 집계'])('%s 공유 수에서도 마지막 소유 여행이 반납할 때만 지도를 지운다', async (kind) => {
  await acquireForBothTrips();
  expect(city()).toMatchObject({ referenceCount: 2 });
  if (kind === '구버전 과소 집계') {
    await getDatabase().update(offlineCities).set({ referenceCount: 1 }).where(eq(offlineCities.cityId, CITY_ID));
  }

  await cleanupOfflineMapForTrip('A');
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(manager.deletePack).not.toHaveBeenCalled();
  expect(activation('A')).toMatchObject({ mapDownloaded: false });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });

  await setActive('B', false);
  await cleanupOfflineMapForTrip('B');
  expect(activation('B')).toMatchObject({ mapDownloaded: false });
  expect(city()).toBeUndefined();
  expect(nativePacks.has(PACK_NAME)).toBe(false);
  expect(manager.deletePack).toHaveBeenCalledTimes(1);
});

it('여행이 획득·반납을 반복해도 한 번만 반영하고 다시 획득할 수 있다', async () => {
  await Promise.all([downloadOfflineMapInBackground('A'), downloadOfflineMapInBackground('A')]);
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(manager.createPack).toHaveBeenCalledTimes(1);
  expect(manager.createPack.mock.calls[0][0]).toMatchObject({ styleURL: OFFLINE_MAP_STYLE_URL });
  expect(city()).toMatchObject({ styleUrl: OFFLINE_MAP_STYLE_URL });

  await setActive('A', false);
  await Promise.all([cleanupOfflineMapForTrip('A'), cleanupOfflineMapForTrip('A')]);
  expect(city()).toBeUndefined();
  expect(manager.deletePack).toHaveBeenCalledTimes(1);

  await setActive('A', true);
  await downloadOfflineMapInBackground('A');
  expect(activation('A')).toMatchObject({ mapDownloaded: true });
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
});

it('A의 마지막 팩 삭제가 지연되는 동안 들어온 B의 획득 요청은 사용 가능한 지도를 남긴다', async () => {
  await downloadOfflineMapInBackground('A');
  await selectTripB();
  let startDelete!: () => void;
  let finishDelete!: () => void;
  const deleting = new Promise<void>((resolve) => {
    startDelete = resolve;
  });
  const released = new Promise<void>((resolve) => {
    finishDelete = resolve;
  });
  manager.deletePack.mockImplementationOnce(async (name) => {
    startDelete();
    await released;
    nativePacks.delete(name);
  });

  const releaseA = cleanupOfflineMapForTrip('A');
  await deleting;
  const acquireB = downloadOfflineMapInBackground('B');
  // 비동기 native 삭제를 완료하기 전에 B 요청이 같은 도시의 현재 상태를 읽을 기회를 준다.
  await new Promise<void>((resolve) => setImmediate(resolve));
  finishDelete();
  await Promise.all([releaseA, acquireB]);

  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(activation('A')).toMatchObject({ mapDownloaded: false });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });
});

it('도시 정보만 남으면 파일 등록 실패 후 B가 다시 획득하고 A의 예약 정리 뒤에도 파일이 남는다', async () => {
  await downloadOfflineMapInBackground('A');
  await selectTripB();
  await getDatabase().update(tripActivations).set({ cleanupPending: true }).where(eq(tripActivations.tripId, 'A'));
  nativePacks.clear();
  manager.createPack.mockRejectedValueOnce(new Error('지도 등록 실패'));
  await expect(downloadOfflineMapInBackground('B')).rejects.toThrow('지도 등록 실패');
  expect(activation('B')).toMatchObject({ mapDownloaded: false });
  expect(city()).toMatchObject({ referenceCount: 1 });

  await downloadOfflineMapInBackground('B');
  await processPendingCleanups();
  expect(activation('A')).toMatchObject({ cleanupPending: false, mapDownloaded: false });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(manager.deletePack).not.toHaveBeenCalled();
});

it('두 여행의 종료 후 7일 동안 지도를 보관하고 다음 도시 날짜가 시작되면 도시 정보만 정리한다', async () => {
  await acquireForBothTrips();
  // 종료일 11월 14일의 서울 달력에서 11월 21일 전체가 유예 기간이다.
  jest.useFakeTimers({ now: new Date('2026-11-21T23:59:59+09:00') });
  await cleanupExpiredOfflineMaps();
  expect(city()).toMatchObject({ referenceCount: 2 });
  expect(activation('A')).toMatchObject({ mapDownloaded: true });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });

  jest.setSystemTime(new Date('2026-11-22T00:00:00+09:00'));
  await cleanupExpiredOfflineMaps();
  expect(city()).toBeUndefined();
  expect(activation('A')).toMatchObject({ mapDownloaded: true });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(manager.deletePack).not.toHaveBeenCalled();
});

it('A만 만료되면 미만료 여행 수는 1이 되고, 이후 A를 반납해도 B의 지도는 남는다', async () => {
  await acquireForBothTrips();
  await getDatabase().update(trips).set({ endDate: '2026-11-20T00:00:00+09:00' }).where(eq(trips.id, 'B'));
  jest.useFakeTimers({ now: new Date('2026-11-22T00:00:00+09:00') });

  await cleanupExpiredOfflineMaps();
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(activation('A')).toMatchObject({ mapDownloaded: true });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });

  await cleanupOfflineMapForTrip('A');
  expect(activation('A')).toMatchObject({ mapDownloaded: false });
  expect(activation('B')).toMatchObject({ mapDownloaded: true });
  expect(city()).toMatchObject({ referenceCount: 1 });
  expect(nativePacks.has(PACK_NAME)).toBe(true);
  expect(manager.deletePack).not.toHaveBeenCalled();
});

it('받을 양을 모르는 진행 알림(percentage null)은 건너뛰고 이후 진행률과 완료를 반영한다', async () => {
  const recorded: (number | null)[] = [];
  const createPack = manager.createPack as unknown as jest.Mock<
    (
      options: { name: string },
      onProgress: (region: unknown, status: { percentage: number | null }) => Promise<void>,
    ) => Promise<void>
  >;
  createPack.mockImplementationOnce(async ({ name }, onProgress) => {
    for (const percentage of [null, 55, 100]) {
      await onProgress({}, { percentage });
      recorded.push(activation('A')?.syncProgress ?? null);
    }
    nativePacks.add(name);
  });

  await downloadOfflineMapInBackground('A');

  expect(recorded).toEqual([0, 55, 100]);
  expect(activation('A')).toMatchObject({ mapDownloaded: true });
  expect(city()).toMatchObject({ referenceCount: 1 });
});
