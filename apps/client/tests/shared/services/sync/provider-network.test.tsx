import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { networkStore, useNetworkStore } from '@/shared/store/network';
import { SyncProvider, useSyncContext } from '@/shared/services/sync/provider';
import { syncData } from '@/shared/services/sync/engine';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));

jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));

const syncMock = jest.mocked(syncData);

function SyncWrapper({ children }: { children: React.ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}

beforeEach(() => {
  useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });
  syncMock.mockResolvedValue(undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'debug').mockImplementation(() => undefined);
});

afterEach(() => {
  networkStore.cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SyncProvider의 실제 네트워크 소비', () => {
  it('같은 렌더에서 수동 실행을 연속 요청해도 한 번만 시작하고 완료 후 다시 실행할 수 있다', async () => {
    useNetworkStore.setState({ realStatus: 'online' });
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    syncMock.mockClear();
    let finishSync!: () => void;
    syncMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSync = resolve;
      }),
    );

    await act(async () => {
      // state 갱신이 렌더에 반영되기 전에 같은 실행 함수를 연속 호출한다.
      const first = result.current.triggerManualSync();
      const second = result.current.triggerManualSync();
      expect(syncMock).toHaveBeenCalledTimes(1);
      finishSync();
      await Promise.all([first, second]);
    });

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncedAt).toBeInstanceOf(Date);
    await act(async () => {
      await result.current.triggerManualSync();
    });
    expect(syncMock).toHaveBeenCalledTimes(2);
  });

  it('실패 후 잠금을 해제하고 성공 시각을 유지하며 다음 수동 실행을 허용한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    useNetworkStore.setState({ realStatus: 'online' });
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });
    await act(async () => {
      await Promise.resolve();
    });
    const previousSyncedAt = result.current.lastSyncedAt;
    syncMock.mockRejectedValueOnce(new Error('동기화 실패'));

    await act(async () => {
      await result.current.triggerManualSync();
    });
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncedAt).toBe(previousSyncedAt);

    await act(async () => {
      await result.current.triggerManualSync();
    });
    expect(syncMock).toHaveBeenCalledTimes(3);
  });

  it('주기 타이머는 sync 완료 때 재시작하지 않으며 최신 상태로 차단하고 unmount 때 해제한다', async () => {
    jest.useFakeTimers();
    useNetworkStore.setState({ realStatus: 'online' });
    let finishSync!: () => void;
    syncMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSync = resolve;
      }),
    );
    const { unmount } = renderHook(() => useSyncContext(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <SyncProvider enablePeriodicSync syncInterval={1_000}>
          {children}
        </SyncProvider>
      ),
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
      finishSync();
    });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(syncMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      networkStore.setOverride('online');
      jest.advanceTimersByTime(1_000);
    });
    expect(syncMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      networkStore.setOverride(null);
      useNetworkStore.setState({ realStatus: 'offline' });
      jest.advanceTimersByTime(1_000);
    });
    expect(syncMock).toHaveBeenCalledTimes(2);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('실제 online으로 mount하면 한 번 시작한다', async () => {
    useNetworkStore.setState({ realStatus: 'online' });
    const initialSync = Promise.resolve();
    syncMock.mockReturnValueOnce(initialSync);
    renderHook(() => useSyncContext(), { wrapper: SyncWrapper });

    await act(async () => {
      await initialSync;
    });

    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it.each(['unknown', 'offline'] as const)(
    '초기 %s에서는 전송하지 않고 실제 online 확정 뒤 한 번 시작한다',
    async (realStatus) => {
      useNetworkStore.setState({ realStatus });
      renderHook(() => useSyncContext(), { wrapper: SyncWrapper });

      expect(syncMock).not.toHaveBeenCalled();

      await act(async () => {
        useNetworkStore.setState({ realStatus: 'online' });
      });

      expect(syncMock).toHaveBeenCalledTimes(1);
    },
  );

  it('online의 일반 rerender와 sync 진행·완료에 따른 실행 함수 변경은 자동 sync를 반복하지 않는다', async () => {
    useNetworkStore.setState({ realStatus: 'online' });
    let finishSync!: () => void;
    syncMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSync = resolve;
      }),
    );
    const { result, rerender } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });

    expect(result.current.isSyncing).toBe(true);
    expect(syncMock).toHaveBeenCalledTimes(1);

    rerender({});

    expect(syncMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishSync();
    });

    expect(result.current.isSyncing).toBe(false);
    expect(syncMock).toHaveBeenCalledTimes(1);

    rerender({});
    rerender({});

    expect(syncMock).toHaveBeenCalledTimes(1);
  });

  it('화면 강제 online은 unknown의 수동 sync나 실제 online 전환의 자동 sync를 열지 않는다', async () => {
    networkStore.setOverride('online');
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });

    await act(async () => {
      await result.current.triggerManualSync();
      useNetworkStore.setState({ realStatus: 'online' });
    });

    expect(syncMock).not.toHaveBeenCalled();
  });

  it('실제 online이어도 override 중 전송하지 않고 해제 뒤 수동 실행할 수 있다', async () => {
    useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'unknown' });
    const { result } = renderHook(() => useSyncContext(), { wrapper: SyncWrapper });

    await act(async () => {
      await result.current.triggerManualSync();
    });

    expect(syncMock).not.toHaveBeenCalled();

    await act(async () => {
      networkStore.setOverride(null);
      await result.current.triggerManualSync();
    });

    expect(syncMock).toHaveBeenCalledTimes(1);
  });
});
