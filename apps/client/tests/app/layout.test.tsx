import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter, useSegments } from 'expo-router';

import RootLayout from '../../app/_layout';
import { selectMainTrip, useGetTrips } from '@/entities/trip';
import { initializeDatabase } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';
import { useOfflineMapCleanup } from '@/shared/services/offline-map';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { useAuthStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store';
import { networkStore } from '@/shared/store/network';

// native 화면과 외부 처리를 대체하고 실제 RootLayout과 Store의 연결을 검사한다.
jest.mock('../../styles/global.css', () => ({}));
jest.mock('react-native-safe-area-context', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(ReactRuntime.Fragment, null, children),
  };
});
jest.mock('@rnmapbox/maps', () => ({ __esModule: true, default: { setAccessToken: jest.fn() } }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-router', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) =>
      ReactRuntime.createElement(View, { testID: 'app-stack' }, children),
    { Screen: () => null },
  );
  return { Stack, useRouter: jest.fn(), useSegments: jest.fn(() => ['(tabs)']) };
});
jest.mock('@rn-primitives/portal', () => ({ PortalHost: () => null }));
jest.mock('@/shared/components', () => ({ SessionExpiredBanner: () => null }));
jest.mock('@/shared/db', () => ({ initializeDatabase: jest.fn() }));
jest.mock('@/shared/services/offline-map', () => ({ useOfflineMapCleanup: jest.fn() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn(async () => undefined) }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip', () => ({ useGetTrips: jest.fn(), selectMainTrip: jest.fn() }));
jest.mock('@/shared/store/auth', () => {
  const { create } = jest.requireActual<typeof import('zustand')>('zustand');
  return { useAuthStore: create(() => ({ isAuthenticated: false, isInitialized: false, init: jest.fn() })) };
});

const databaseMock = jest.mocked(initializeDatabase);
const tripsMock = jest.mocked(useGetTrips);
const mainTripMock = jest.mocked(selectMainTrip);
const cleanupMock = jest.mocked(processPendingCleanups);
const initAuthMock = jest.fn<() => Promise<void>>();
const replaceMock = jest.fn();

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

function setTripQuery(data: ReturnType<typeof useGetTrips>['data'] = [], isError = false) {
  tripsMock.mockReturnValue({
    data,
    isLoading: false,
    isError,
    error: isError ? new Error('조회 실패') : null,
  } as ReturnType<typeof useGetTrips>);
}

async function finishBootstrap() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  networkStore.cleanup();
  networkStore.setOverride(null);
  useAuthStore.setState({ isAuthenticated: false, isInitialized: false, init: initAuthMock });
  useTripStore.setState({ selectedTripId: null });
  databaseMock.mockResolvedValue(undefined);
  initAuthMock.mockResolvedValue(undefined);
  cleanupMock.mockResolvedValue(0);
  mainTripMock.mockReturnValue(null);
  setTripQuery();
  jest.mocked(useRouter).mockReturnValue({
    replace: replaceMock,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    push: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: jest.fn(() => false),
    setParams: jest.fn(),
  });
  jest.mocked(useSegments).mockReturnValue(['(tabs)']);
  jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
  for (const method of ['log', 'info', 'debug', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation(() => undefined);
  }
});

afterEach(() => {
  networkStore.cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('RootLayout의 앱 준비와 인증 후 작업 연결', () => {
  it('DB 완료 뒤 인증을 복원하고 두 작업이 끝나기 전에는 화면과 Splash를 열지 않는다', async () => {
    const database = deferred();
    const auth = deferred();
    databaseMock.mockReturnValue(database.promise);
    initAuthMock.mockReturnValue(auth.promise);
    const view = render(<RootLayout />);

    expect(databaseMock).toHaveBeenCalledTimes(1);
    expect(initAuthMock).not.toHaveBeenCalled();
    expect(view.queryByTestId('app-stack')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await act(async () => {
      database.resolve();
    });
    expect(initAuthMock).toHaveBeenCalledTimes(1);
    expect(view.queryByTestId('app-stack')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await act(async () => {
      auth.resolve();
    });
    expect(view.queryByTestId('app-stack')).not.toBeNull();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('네트워크가 unknown이어도 진입하며 해제 시 감지 session과 타이머를 정리한다', async () => {
    const init = jest.spyOn(networkStore, 'init');
    const cleanup = jest.spyOn(networkStore, 'cleanup');
    const view = render(<RootLayout />);
    await finishBootstrap();

    expect(init).toHaveBeenCalledTimes(1);
    expect(networkStore.realStatus).toBe('unknown');
    expect(view.queryByTestId('app-stack')).not.toBeNull();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);

    view.unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('비인증 상태에서는 여행 조회와 지도·pending cleanup을 시작하지 않는다', async () => {
    render(<RootLayout />);
    await finishBootstrap();
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    expect(tripsMock).not.toHaveBeenCalled();
    expect(useOfflineMapCleanup).not.toHaveBeenCalled();
    expect(cleanupMock).not.toHaveBeenCalled();
  });

  it.each<[boolean, boolean, '(auth)' | '(tabs)', '/(auth)/login' | '/(tabs)' | null]>([
    [false, false, '(tabs)', null],
    [false, true, '(tabs)', '/(auth)/login'],
    [false, true, '(auth)', null],
    [true, true, '(auth)', '/(tabs)'],
    [true, true, '(tabs)', null],
  ])(
    '인증=%s·복원 완료=%s·route=%s일 때 이동 대상은 %s이다',
    async (isAuthenticated, isInitialized, segment, target) => {
      jest.mocked(useSegments).mockReturnValue([segment]);
      useAuthStore.setState({ isAuthenticated, isInitialized });
      render(<RootLayout />);
      await finishBootstrap();

      if (target) {
        expect(replaceMock).toHaveBeenCalledTimes(1);
        expect(replaceMock).toHaveBeenCalledWith(target);
      } else {
        expect(replaceMock).not.toHaveBeenCalled();
      }
    },
  );

  it.each([true, false])('최초 여행 목록에서 대표 여행 존재 여부=%s에 맞게 선택한다', async (hasMainTrip) => {
    const trips = [
      { id: 'first', name: '첫 여행' },
      { id: 'main', name: '대표 여행' },
    ] as NonNullable<ReturnType<typeof useGetTrips>['data']>;
    setTripQuery(trips);
    mainTripMock.mockReturnValue(hasMainTrip ? trips[1] : null);
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    render(<RootLayout />);
    await finishBootstrap();

    expect(useTripStore.getState().selectedTripId).toBe(hasMainTrip ? 'main' : 'first');
  });

  it('빈 여행 목록에서는 기존 선택을 변경하지 않는다', async () => {
    useTripStore.setState({ selectedTripId: 'selected' });
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    render(<RootLayout />);
    await finishBootstrap();
    expect(useTripStore.getState().selectedTripId).toBe('selected');
  });

  it('인증 후 2초가 지나고 cleanup 처리 건수가 있을 때만 관련 캐시를 무효화한다', async () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    cleanupMock.mockResolvedValue(1);
    render(<RootLayout />);
    await finishBootstrap();
    expect(useOfflineMapCleanup).toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1_999);
    });
    expect(cleanupMock).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(cleanupMock).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    for (const key of ['trip', 'schedule', 'expense']) {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });

  it('cleanup 결과가 없으면 캐시를 무효화하지 않는다', async () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    render(<RootLayout />);
    await finishBootstrap();
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(cleanupMock).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('cleanup 실패는 화면을 닫거나 캐시를 무효화하지 않는다', async () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    cleanupMock.mockRejectedValue(new Error('정리 실패'));
    const view = render(<RootLayout />);
    await finishBootstrap();
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(view.queryByTestId('app-stack')).not.toBeNull();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('지연 cleanup 실행 전에 로그아웃하면 해당 타이머를 해제한다', async () => {
    useAuthStore.setState({ isAuthenticated: true, isInitialized: true });
    render(<RootLayout />);
    await finishBootstrap();
    await act(async () => {
      useAuthStore.setState({ isAuthenticated: false });
    });
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(cleanupMock).not.toHaveBeenCalled();
  });
});
