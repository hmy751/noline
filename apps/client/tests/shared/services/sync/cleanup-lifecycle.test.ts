import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as cleanupService from '@/shared/services/sync/cleanup-job';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { performLogout, performDeleteAccount } from '@/shared/services/auth/logout-service';
import { getDatabase, resetDatabase } from '@/shared/db';
import { clearSyncQueue, getSyncQueueStats } from '@/shared/services/sync/queue';
import { queryClient } from '@/shared/lib/queryClient';
import { authStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store/useTripStore';

jest.mock('@/shared/db', () => ({
  getDatabase: jest.fn(),
  resetDatabase: jest.fn(),
  tripActivations: {},
  schedules: {},
  expenses: {},
}));
jest.mock('drizzle-orm', () => ({ eq: jest.fn(), and: jest.fn(), sql: jest.fn() }));
// 실행 조율을 검사하며 SQL·트랜잭션 내부는 이 테스트의 대상이 아니다.
jest.mock('@/shared/db/utils', () => ({
  withTransaction: jest.fn(async () => undefined),
  getCurrentISOString: () => 'now',
}));
jest.mock('@/shared/services/sync/queue', () => ({
  hasPendingTasksForTrip: jest.fn(async () => false),
  clearSyncQueue: jest.fn(),
  getSyncQueueStats: jest.fn(),
}));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: jest.fn() }));
jest.mock('@/shared/services/auth/auth-api', () => ({ logout: jest.fn(), deleteAccount: jest.fn() }));
jest.mock('@/shared/store/auth', () => ({ authStore: { logout: jest.fn() } }));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(async () => undefined), clear: jest.fn() },
}));

const findPendingCleanups = jest.fn<() => Promise<{ tripId: string }[]>>();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

// 실제 일시 중단을 유지하면서 진입 시점만 관찰한다.
function observeCleanupPause() {
  const paused = deferred<void>();
  const pauseCleanups = cleanupService.withPendingCleanupsPaused;

  jest.spyOn(cleanupService, 'withPendingCleanupsPaused').mockImplementation(<T>(operation: () => Promise<T>) => {
    const result = pauseCleanups(operation);
    paused.resolve();
    return result;
  });

  return paused.promise;
}

beforeEach(() => {
  useTripStore.setState({ selectedTripId: 'previous-user-trip' });
  findPendingCleanups.mockReset().mockResolvedValue([]);
  jest.mocked(getDatabase).mockReturnValue({
    select: () => ({ from: () => ({ where: () => ({ all: findPendingCleanups }) }) }),
  } as unknown as ReturnType<typeof getDatabase>);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, inProgress: 0, failed: 0, total: 0 });
  jest.mocked(resetDatabase).mockReset().mockResolvedValue(undefined);
  for (const method of ['log', 'info', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation(() => undefined);
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('pending cleanup의 공유 실행과 로그아웃 조율', () => {
  it('startup과 sync의 동시 호출은 같은 작업의 완료를 함께 기다린다', async () => {
    const work = deferred<{ tripId: string }[]>();
    findPendingCleanups.mockReturnValue(work.promise);
    const startup = processPendingCleanups();
    const sync = processPendingCleanups();

    expect(findPendingCleanups).toHaveBeenCalledTimes(1);

    work.resolve([]);

    await expect(startup).resolves.toBe(0);
    await expect(sync).resolves.toBe(0);
  });

  it('실제 처리 뒤 캐시 갱신은 공통 실행에서 한 번만 수행한다', async () => {
    findPendingCleanups.mockResolvedValue([{ tripId: 'trip-1' }]);

    await Promise.all([processPendingCleanups(), processPendingCleanups()]);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    for (const key of ['trip', 'schedule', 'expense']) {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });

  it('정리 실패는 호출자에게 전달하고 다음 실행은 재시도할 수 있다', async () => {
    findPendingCleanups.mockRejectedValueOnce(new Error('cleanup 실패'));
    await expect(processPendingCleanups()).rejects.toThrow('cleanup 실패');
    await expect(processPendingCleanups()).resolves.toBe(0);
    expect(findPendingCleanups).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it.each<[string, typeof performLogout]>([
    ['로그아웃', performLogout],
    ['회원 탈퇴', performDeleteAccount],
  ])('%s은 실행 중 cleanup을 기다리고 DB reset 중 새로운 cleanup을 막는다', async (_label, endSession) => {
    const work = deferred<{ tripId: string }[]>();
    findPendingCleanups.mockReturnValueOnce(work.promise);
    const paused = observeCleanupPause();
    const cleanup = processPendingCleanups();
    const logout = endSession();

    await paused;
    expect(clearSyncQueue).not.toHaveBeenCalled();
    expect(resetDatabase).not.toHaveBeenCalled();
    await expect(processPendingCleanups()).resolves.toBe(0);
    expect(findPendingCleanups).toHaveBeenCalledTimes(1);

    jest.mocked(resetDatabase).mockImplementation(async () => {
      await expect(processPendingCleanups()).resolves.toBe(0);
      expect(findPendingCleanups).toHaveBeenCalledTimes(1);
    });

    work.resolve([]);
    await cleanup;
    await expect(logout).resolves.toMatchObject({ success: true });

    expect(clearSyncQueue).toHaveBeenCalledTimes(1);
    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(useTripStore.getState().selectedTripId).toBeNull();
  });

  it('cleanup이 실패해도 종료를 기다린 뒤 로그아웃을 마친다', async () => {
    let reject!: (error: Error) => void;
    findPendingCleanups.mockReturnValueOnce(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    const paused = observeCleanupPause();
    const cleanupResult = processPendingCleanups().catch((error: Error) => error);
    const logout = performLogout();

    await paused;
    expect(resetDatabase).not.toHaveBeenCalled();
    reject(new Error('실패'));
    expect(await cleanupResult).toEqual(new Error('실패'));
    await expect(logout).resolves.toMatchObject({ success: true });

    expect(resetDatabase).toHaveBeenCalledTimes(1);
  });

  it('로그아웃의 DB reset이 실패해도 cleanup 일시 중단을 해제한다', async () => {
    jest.mocked(resetDatabase).mockRejectedValueOnce(new Error('reset 실패'));
    await expect(performLogout()).resolves.toMatchObject({ success: false });
    expect(useTripStore.getState().selectedTripId).toBe('previous-user-trip');
    await processPendingCleanups();
    expect(findPendingCleanups).toHaveBeenCalledTimes(1);
  });
});
