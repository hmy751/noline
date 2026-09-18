import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { SyncProvider, useSyncContext } from '@/shared/services/sync/provider';
import { syncData } from '@/shared/services/sync/engine';
import { performLogout, performDeleteAccount } from '@/shared/services/auth/logout-service';
import { logout as logoutApi, deleteAccount } from '@/shared/services/auth/auth-api';
import { getSyncQueueStats, clearSyncQueue } from '@/shared/services/sync/queue';
import { resetDatabase, isDatabaseReady } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore, useNetworkStore } from '@/shared/store/network';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));
jest.mock('@/shared/services/auth/token-storage', () => ({ clearAuthData: jest.fn(async () => undefined) }));
jest.mock('@/shared/services/auth/auth-api', () => ({ logout: jest.fn(), deleteAccount: jest.fn() }));
jest.mock('@/shared/services/sync/queue', () => ({ getSyncQueueStats: jest.fn(), clearSyncQueue: jest.fn() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({
  withPendingCleanupsPaused: jest.fn(async (operation: () => Promise<unknown>) => operation()),
}));
jest.mock('@/shared/db', () => ({ resetDatabase: jest.fn(), isDatabaseReady: jest.fn(() => true) }));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { clear: jest.fn() } }));

const syncMock = jest.mocked(syncData);
const statsMock = jest.mocked(getSyncQueueStats);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((finish, fail) => {
    resolve = finish;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function SyncWrapper({ children }: { children: React.ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}

beforeEach(() => {
  jest.mocked(isDatabaseReady).mockReturnValue(true);
  useAuthStore.setState({ isAuthenticated: true, isSessionExpired: false, userId: 'user-1' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  syncMock.mockReset().mockResolvedValue(undefined);
  statsMock.mockReset().mockResolvedValue({ pending: 0, inProgress: 0, failed: 0, total: 0 });
  jest.mocked(resetDatabase).mockReset().mockResolvedValue(undefined);
  jest.mocked(logoutApi).mockReset().mockResolvedValue(undefined);
  jest.mocked(deleteAccount).mockReset().mockResolvedValue(undefined);
  for (const method of ['log', 'info', 'debug', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation(() => undefined);
  }
});

afterEach(() => {
  networkStore.cleanup();
  jest.restoreAllMocks();
});

describe('sync와 세션 종료 순서', () => {
  it('DB reset이 실패해 준비 상태가 해제되면 일시 중단 해제 후에도 sync를 시작하지 않는다', async () => {
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    syncMock.mockClear();
    jest.mocked(resetDatabase).mockImplementationOnce(async () => {
      jest.mocked(isDatabaseReady).mockReturnValue(false);
      throw new Error('DB reset 실패');
    });

    await act(async () => {
      await expect(performLogout()).resolves.toMatchObject({ success: false });
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await act(async () => {
      await expect(result.current.triggerManualSync()).resolves.toEqual({
        status: 'skipped',
        reason: 'database-not-ready',
      });
    });
    expect(syncMock).not.toHaveBeenCalled();
  });

  it.each([
    { scenario: '로그아웃', endSession: performLogout, serverOperation: logoutApi, pendingCount: 0 },
    { scenario: '회원 탈퇴', endSession: performDeleteAccount, serverOperation: deleteAccount, pendingCount: 0 },
    {
      scenario: '강제 로그아웃',
      endSession: () => performLogout({ force: true }),
      serverOperation: logoutApi,
      pendingCount: 1,
    },
    {
      scenario: '강제 회원 탈퇴',
      endSession: () => performDeleteAccount({ force: true }),
      serverOperation: deleteAccount,
      pendingCount: 1,
    },
  ])(
    '$scenario 확정 후 새 sync를 막고 실행 종료 뒤 서버와 DB를 정리한다',
    async ({ endSession, serverOperation, pendingCount }) => {
      statsMock.mockResolvedValue({ pending: pendingCount, inProgress: 0, failed: 0, total: pendingCount });
      const work = deferred<void>();
      const serverStarted = deferred<void>();
      const serverWork = deferred<void>();
      syncMock.mockReturnValueOnce(work.promise);
      jest.mocked(serverOperation).mockImplementationOnce(() => {
        serverStarted.resolve();
        return serverWork.promise;
      });
      const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
      let ending!: ReturnType<typeof performLogout>;

      try {
        await act(async () => {
          ending = endSession();
        });
        expect(serverOperation).not.toHaveBeenCalled();
        expect(clearSyncQueue).not.toHaveBeenCalled();
        expect(resetDatabase).not.toHaveBeenCalled();

        await act(async () => {
          useNetworkStore.setState({ realStatus: 'offline' });
        });
        await act(async () => {
          useNetworkStore.setState({ realStatus: 'online' });
          await result.current.triggerManualSync();
        });
        expect(syncMock).toHaveBeenCalledTimes(1);

        await act(async () => {
          work.resolve();
          await serverStarted.promise;
        });
        expect(result.current.isSyncing).toBe(false);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(resetDatabase).not.toHaveBeenCalled();

        await act(async () => {
          await expect(result.current.triggerManualSync()).resolves.toEqual({
            status: 'skipped',
            reason: 'session-ending',
          });
        });
        expect(syncMock).toHaveBeenCalledTimes(1);

        await act(async () => {
          serverWork.resolve();
          await ending;
        });
        await expect(ending).resolves.toMatchObject({ success: true });
        expect(serverOperation).toHaveBeenCalledTimes(1);
        expect(resetDatabase).toHaveBeenCalledTimes(1);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(queryClient.clear).toHaveBeenCalledTimes(1);

        await act(async () => {
          await result.current.triggerManualSync();
        });
        expect(syncMock).toHaveBeenCalledTimes(1);
      } finally {
        await act(async () => {
          work.resolve();
          serverWork.resolve();
          await ending;
        });
      }
    },
  );

  it('진행 중 sync가 실패해도 종료를 기다린 뒤 로그아웃을 마친다', async () => {
    const work = deferred<void>();
    syncMock.mockReturnValueOnce(work.promise);
    renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    let ending!: ReturnType<typeof performLogout>;

    try {
      await act(async () => {
        ending = performLogout();
      });
      expect(resetDatabase).not.toHaveBeenCalled();

      await act(async () => {
        work.reject(new Error('sync 실패'));
        await ending;
      });
      await expect(ending).resolves.toMatchObject({ success: true });
      expect(resetDatabase).toHaveBeenCalledTimes(1);
    } finally {
      await act(async () => {
        work.resolve();
        await ending;
      });
    }
  });

  it('미동기화 안내로 종료를 보류하면 세션을 유지하고 sync를 계속 허용한다', async () => {
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    statsMock.mockResolvedValue({ pending: 1, inProgress: 0, failed: 0, total: 1 });

    await expect(performLogout()).resolves.toMatchObject({ success: false, hasPendingSync: true });
    expect(logoutApi).not.toHaveBeenCalled();
    expect(resetDatabase).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.triggerManualSync();
    });
    expect(syncMock).toHaveBeenCalledTimes(2);
  });

  it('회원 탈퇴의 서버 요청이 실패하면 DB를 유지하고 sync 일시 중단을 해제한다', async () => {
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    jest.mocked(deleteAccount).mockRejectedValueOnce(new Error('삭제 실패'));

    await act(async () => {
      await expect(performDeleteAccount()).resolves.toMatchObject({ success: false });
    });
    expect(resetDatabase).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    syncMock.mockClear();

    await act(async () => {
      await result.current.triggerManualSync();
    });
    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it('서버 로그아웃에 실패해도 로컬 세션을 종료하고 새 sync를 막는다', async () => {
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    jest.mocked(logoutApi).mockRejectedValueOnce(new Error('서버 로그아웃 실패'));

    await act(async () => {
      await expect(performLogout()).resolves.toMatchObject({ success: true });
    });
    expect(resetDatabase).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    syncMock.mockClear();

    await act(async () => {
      await expect(result.current.triggerManualSync()).resolves.toEqual({ status: 'skipped', reason: 'signed-out' });
    });
    expect(syncMock).not.toHaveBeenCalled();
  });
});
