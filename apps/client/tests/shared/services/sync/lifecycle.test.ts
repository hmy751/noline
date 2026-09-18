import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { executeSync, withSyncPaused, useSyncLifecycleStore } from '@/shared/services/sync/lifecycle';
import { syncData } from '@/shared/services/sync/engine';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';
import { isDatabaseReady } from '@/shared/db';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));
jest.mock('@/shared/services/auth/token-storage', () => ({}));
jest.mock('@/shared/db', () => ({ isDatabaseReady: jest.fn(() => true) }));

const syncMock = jest.mocked(syncData);

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.mocked(isDatabaseReady).mockReturnValue(true);
  useAuthStore.setState({ isAuthenticated: true, isSessionExpired: false, userId: 'user-1' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  useSyncLifecycleStore.setState({ lastSyncedAt: null });
  syncMock.mockReset().mockResolvedValue(undefined);
  for (const method of ['info', 'debug', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation(() => undefined);
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sync 실행의 공통 경계', () => {
  it('DB 준비 실패 상태에서는 인증·online 조건이 맞아도 시작하지 않는다', async () => {
    jest.mocked(isDatabaseReady).mockReturnValue(false);

    await expect(executeSync('manual')).resolves.toEqual({ status: 'skipped', reason: 'database-not-ready' });
    expect(syncMock).not.toHaveBeenCalled();
  });

  it.each([
    { scenario: '로그인 전', auth: false, expired: false, realStatus: 'online', override: null, reason: 'signed-out' },
    {
      scenario: '세션 만료',
      auth: true,
      expired: true,
      realStatus: 'online',
      override: null,
      reason: 'session-expired',
    },
    {
      scenario: '연결 미확인',
      auth: true,
      expired: false,
      realStatus: 'unknown',
      override: null,
      reason: 'network-unknown',
    },
    {
      scenario: '오프라인',
      auth: true,
      expired: false,
      realStatus: 'offline',
      override: null,
      reason: 'network-offline',
    },
    {
      scenario: 'online 강제 설정',
      auth: true,
      expired: false,
      realStatus: 'online',
      override: 'online',
      reason: 'override-active',
    },
  ] as const)(
    '$scenario에서는 수동 실행도 차단 이유를 반환한다',
    async ({ auth, expired, realStatus, override, reason }) => {
      useAuthStore.setState({ isAuthenticated: auth, isSessionExpired: expired });
      useNetworkStore.setState({ realStatus, overrideStatus: override });

      await expect(executeSync('manual')).resolves.toEqual({ status: 'skipped', reason });
      expect(syncMock).not.toHaveBeenCalled();
    },
  );

  it('React 밖 요청도 같은 잠금으로 중복 실행을 막고 skip을 성공으로 보고하지 않는다', async () => {
    const work = deferred();
    syncMock.mockReturnValueOnce(work.promise);
    const first = executeSync('manual');

    await expect(executeSync('manual')).resolves.toEqual({ status: 'skipped', reason: 'already-running' });
    expect(syncMock).toHaveBeenCalledTimes(1);

    work.resolve();
    await expect(first).resolves.toEqual({ status: 'completed' });
  });

  it('중첩된 일시 중단은 안쪽 작업이 끝나도 바깥 작업이 끝날 때까지 새 실행을 막는다', async () => {
    const outerWork = deferred();
    const innerDone = deferred();
    const outer = withSyncPaused(async () => {
      await withSyncPaused(async () => undefined);
      innerDone.resolve();
      await outerWork.promise;
    });

    await innerDone.promise;
    await expect(executeSync('manual')).resolves.toEqual({ status: 'skipped', reason: 'session-ending' });
    expect(useSyncLifecycleStore.getState().isPaused).toBe(true);

    outerWork.resolve();
    await outer;
    expect(useSyncLifecycleStore.getState().isPaused).toBe(false);
    await expect(executeSync('manual')).resolves.toEqual({ status: 'completed' });
  });

  it('종료 작업이 실패해도 일시 중단을 해제하고 다음 실행을 허용한다', async () => {
    await expect(
      withSyncPaused(async () => {
        throw new Error('종료 실패');
      }),
    ).rejects.toThrow('종료 실패');

    expect(useSyncLifecycleStore.getState().isPaused).toBe(false);
    await expect(executeSync('manual')).resolves.toEqual({ status: 'completed' });
  });

  it('엔진이 reject하면 실패를 반환하고 성공 시각을 갱신하지 않는다', async () => {
    const error = new Error('전송 실패');
    syncMock.mockRejectedValueOnce(error);

    await expect(executeSync('manual')).resolves.toEqual({ status: 'failed', error });
    expect(useSyncLifecycleStore.getState().lastSyncedAt).toBeNull();
    expect(useSyncLifecycleStore.getState().isSyncing).toBe(false);
    await expect(executeSync('manual')).resolves.toEqual({ status: 'completed' });
  });
});
