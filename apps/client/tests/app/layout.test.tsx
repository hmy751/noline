jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn(async () => 'same') }));
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

import RootLayout from '../../app/_layout';
import { useGetTrips } from '@/entities/trip/data/useGetTrips';
import { selectMainTrip } from '@/entities/trip/utils';
import { initializeDatabase } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';
import { useOfflineMapCleanup } from '@/shared/services/offline-map';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { syncData } from '@/shared/services/sync/engine';
import * as authModule from '@/shared/store/auth';
import { createAuthStore, useAuthStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store';
import { networkStore, useNetworkStore } from '@/shared/store/network';

// native 화면과 외부 처리를 대체하고 실제 RootLayout과 Store의 연결을 검사한다.
jest.mock('../../styles/global.css', () => ({}));
// 실제 버튼은 사용하되 이번 화면과 무관한 UI barrel의 native 의존성은 불러오지 않는다.
jest.mock('@repo/ui', () => jest.requireActual('../../../../packages/ui/src/components/Pressable'));
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
jest.mock('@/shared/db', () => ({ initializeDatabase: jest.fn(), isDatabaseReady: () => true }));
jest.mock('@/shared/services/offline-map', () => ({ useOfflineMapCleanup: jest.fn() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn(async () => undefined) }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTrips', () => ({ useGetTrips: jest.fn() }));
jest.mock('@/entities/trip/utils', () => ({ selectMainTrip: jest.fn() }));
// 준비 완료 여부를 공개 state로 조작하지 않고 테스트마다 실제 Store를 새로 만든다.
jest.mock('@/shared/store/auth', () => {
  const actual = jest.requireActual<typeof import('@/shared/store/auth')>('@/shared/store/auth');
  return { ...actual, __esModule: true };
});
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
}));

const databaseMock = jest.mocked(initializeDatabase);
const tripsMock = jest.mocked(useGetTrips);
const mainTripMock = jest.mocked(selectMainTrip);
const cleanupMock = jest.mocked(processPendingCleanups);
const restoreSessionOnceMock = jest.fn<() => Promise<void>>();
const replaceMock = jest.fn();
let restoreSessionOnce: () => Promise<void>;

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
    isSuccess: !isError,
    isFetching: false,
    dataSource: 'local',
    isError,
    error: isError ? new Error('조회 실패') : null,
  } as ReturnType<typeof useGetTrips>);
}

// React가 이번 비동기 구간의 업데이트를 반영하게 한다. 준비 완료는 각 테스트에서 별도로 검증한다.
async function flushReactUpdates() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  networkStore.cleanup();
  networkStore.setOverride(null);
  const authStore = createAuthStore();
  Object.assign(jest.spyOn(authModule, 'useAuthStore').mockImplementation(authStore), authStore);
  restoreSessionOnce = authStore.getState().restoreSessionOnce;
  authStore.setState({ restoreSessionOnce: restoreSessionOnceMock });
  useTripStore.setState({ selectedTripId: null });
  databaseMock.mockReset().mockResolvedValue(undefined);
  restoreSessionOnceMock.mockReset().mockResolvedValue(undefined);
  jest.mocked(SecureStore.getItemAsync).mockReset().mockResolvedValue(null);
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
  describe('앱 준비·실패·재시도', () => {
    it('인증 상태와 실제 online이 있어도 DB 실패 시 진입·인증 복원·후속 작업을 막고 재시도를 안내한다', async () => {
      useAuthStore.setState({ status: 'signed-in' });
      databaseMock.mockRejectedValue(new Error('테이블 준비 실패'));
      const view = render(<RootLayout />);
      await act(async () => {
        useNetworkStore.setState({ realStatus: 'online' });
      });
      await flushReactUpdates();
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });

      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(view.getByRole('button', { name: '다시 시도' })).toBeTruthy();
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
      expect(restoreSessionOnceMock).not.toHaveBeenCalled();
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
      expect(replaceMock).not.toHaveBeenCalled();
      expect(tripsMock).not.toHaveBeenCalled();
      expect(useOfflineMapCleanup).not.toHaveBeenCalled();
      expect(cleanupMock).not.toHaveBeenCalled();
      expect(syncData).not.toHaveBeenCalled();
    });

    it('재시도 연속 입력은 한 번만 준비하며 DB와 인증 복원이 끝난 뒤 진입한다', async () => {
      const database = deferred();
      const auth = deferred();
      databaseMock.mockRejectedValueOnce(new Error('DB 준비 실패')).mockReturnValueOnce(database.promise);
      restoreSessionOnceMock.mockReturnValue(auth.promise);
      const view = render(<RootLayout />);
      await flushReactUpdates();

      const retryButton = view.getByRole('button', { name: '다시 시도' });
      act(() => {
        fireEvent.press(retryButton);
        fireEvent.press(retryButton);
      });
      expect(databaseMock).toHaveBeenCalledTimes(2);
      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(view.getByText('앱을 준비하고 있어요')).toBeTruthy();
      expect(restoreSessionOnceMock).not.toHaveBeenCalled();

      await act(async () => database.resolve());
      expect(restoreSessionOnceMock).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('app-stack')).toBeNull();

      await act(async () => auth.resolve());
      expect(view.queryByTestId('app-stack')).not.toBeNull();
      expect(view.queryByRole('button', { name: '다시 시도' })).toBeNull();
    });

    it('재시도가 다시 실패하면 안내를 유지하고 다음 재시도 성공 시 진입한다', async () => {
      databaseMock.mockRejectedValueOnce(new Error('첫 실패')).mockRejectedValueOnce(new Error('두 번째 실패'));
      const view = render(<RootLayout />);
      await flushReactUpdates();

      fireEvent.press(view.getByRole('button', { name: '다시 시도' }));
      await flushReactUpdates();
      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(restoreSessionOnceMock).not.toHaveBeenCalled();

      fireEvent.press(view.getByRole('button', { name: '다시 시도' }));
      await flushReactUpdates();
      expect(databaseMock).toHaveBeenCalledTimes(3);
      expect(restoreSessionOnceMock).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('app-stack')).not.toBeNull();
    });

    it('화면 해제 뒤 DB 준비가 완료돼도 인증 복원이나 화면 진입을 시작하지 않는다', async () => {
      const database = deferred();
      databaseMock.mockReturnValue(database.promise);
      const view = render(<RootLayout />);
      view.unmount();
      await act(async () => database.resolve());

      expect(restoreSessionOnceMock).not.toHaveBeenCalled();
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
      expect(tripsMock).not.toHaveBeenCalled();
      expect(syncData).not.toHaveBeenCalled();
    });

    it('인증 복원 중 화면을 다시 붙여도 읽기는 공유하고 현재 화면만 진입한다', async () => {
      let finishTokenRead!: (token: string) => void;
      const token = new Promise<string>((resolve) => {
        finishTokenRead = resolve;
      });
      useAuthStore.setState({ restoreSessionOnce });
      jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => {
        if (key === 'noline_access_token') {
          return token;
        }
        if (key === 'noline_user_id') {
          return 'user-1';
        }
        return null;
      });
      jest.mocked(useSegments).mockReturnValue(['(auth)']);

      const firstView = render(<RootLayout />);
      await flushReactUpdates();
      firstView.unmount();
      const currentView = render(<RootLayout />);
      await flushReactUpdates();
      expect(currentView.queryByTestId('app-stack')).toBeNull();
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

      await act(async () => finishTokenRead('stored-token'));

      const tokenReads = jest
        .mocked(SecureStore.getItemAsync)
        .mock.calls.filter(([key]) => key === 'noline_access_token');
      expect(tokenReads).toHaveLength(1);
      expect(currentView.queryByTestId('app-stack')).not.toBeNull();
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith('/(tabs)');
    });

    it.each(['저장된 인증 정보', '인증 정보 없음', '보안 저장소 읽기 실패'] as const)(
      'DB 성공 후 실제 인증 복원: %s에 따라 진입하며 저장된 정보를 지우지 않는다',
      async (scenario) => {
        useAuthStore.setState({ restoreSessionOnce });
        if (scenario === '저장된 인증 정보') {
          jest.mocked(SecureStore.getItemAsync).mockImplementation(async (key) => {
            if (key === 'noline_access_token') {
              return 'stored-token';
            }
            if (key === 'noline_user_id') {
              return 'user-1';
            }
            return null;
          });
          jest.mocked(useSegments).mockReturnValue(['(auth)']);
        } else if (scenario === '보안 저장소 읽기 실패') {
          jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('읽기 실패'));
        }

        const view = render(<RootLayout />);
        await flushReactUpdates();
        expect(view.queryByTestId('app-stack')).not.toBeNull();
        expect(replaceMock).toHaveBeenCalledWith(scenario === '저장된 인증 정보' ? '/(tabs)' : '/(auth)/login');
        expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      },
    );

    it('DB 완료 뒤 인증을 복원하고 두 작업이 끝나기 전에는 화면과 Splash를 열지 않는다', async () => {
      const database = deferred();
      const auth = deferred();
      databaseMock.mockReturnValue(database.promise);
      restoreSessionOnceMock.mockReturnValue(auth.promise);
      const view = render(<RootLayout />);

      expect(databaseMock).toHaveBeenCalledTimes(1);
      expect(restoreSessionOnceMock).not.toHaveBeenCalled();
      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

      await act(async () => {
        database.resolve();
      });
      expect(restoreSessionOnceMock).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

      await act(async () => {
        auth.resolve();
      });
      expect(view.queryByTestId('app-stack')).not.toBeNull();
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('네트워크 수명과 인증 변화', () => {
    it('네트워크가 unknown이어도 진입하며 해제 시 감지 session과 타이머를 정리한다', async () => {
      const init = jest.spyOn(networkStore, 'init');
      const cleanup = jest.spyOn(networkStore, 'cleanup');
      const view = render(<RootLayout />);
      await flushReactUpdates();

      expect(init).toHaveBeenCalledTimes(1);
      expect(networkStore.realStatus).toBe('unknown');
      expect(view.queryByTestId('app-stack')).not.toBeNull();
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(1);

      view.unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('DB 실패와 재시도 동안 네트워크 감지는 유지하고 앱 해제 시 한 번 정리한다', async () => {
      const init = jest.spyOn(networkStore, 'init');
      const cleanup = jest.spyOn(networkStore, 'cleanup');
      databaseMock.mockRejectedValueOnce(new Error('DB 준비 실패'));
      const view = render(<RootLayout />);
      await flushReactUpdates();

      fireEvent.press(view.getByRole('button', { name: '다시 시도' }));
      await flushReactUpdates();

      expect(databaseMock).toHaveBeenCalledTimes(2);
      expect(init).toHaveBeenCalledTimes(1);
      expect(cleanup).not.toHaveBeenCalled();
      expect(view.getByTestId('app-stack')).toBeTruthy();

      view.unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('진입 후 로그인·로그아웃·재로그인은 인증 후 작업만 다시 시작하고 앱 준비를 반복하지 않는다', async () => {
      const view = render(<RootLayout />);
      await flushReactUpdates();
      expect(tripsMock).not.toHaveBeenCalled();

      act(() => useAuthStore.setState({ status: 'signed-in' }));
      expect(tripsMock).toHaveBeenCalled();
      expect(useOfflineMapCleanup).toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(1_000));
      act(() => useAuthStore.setState({ status: 'signed-out' }));
      act(() => jest.advanceTimersByTime(2_000));
      expect(cleanupMock).not.toHaveBeenCalled();

      act(() => useAuthStore.setState({ status: 'signed-in' }));
      await act(async () => jest.advanceTimersByTime(2_000));

      expect(cleanupMock).toHaveBeenCalledTimes(1);
      expect(databaseMock).toHaveBeenCalledTimes(1);
      expect(restoreSessionOnceMock).toHaveBeenCalledTimes(1);
      expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
      expect(view.getByTestId('app-stack')).toBeTruthy();
    });
  });

  describe('인증에 따른 화면과 후속 작업 연결', () => {
    it('비인증 상태에서는 여행 조회와 지도·pending cleanup을 시작하지 않는다', async () => {
      render(<RootLayout />);
      await flushReactUpdates();
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });

      expect(tripsMock).not.toHaveBeenCalled();
      expect(useOfflineMapCleanup).not.toHaveBeenCalled();
      expect(cleanupMock).not.toHaveBeenCalled();
    });

    it('인증 복원이 끝나기 전에는 초기화 상태를 하위 화면에 넘기지 않고 라우팅도 시작하지 않는다', async () => {
      const auth = deferred();
      restoreSessionOnceMock.mockImplementation(async () => {
        await auth.promise;
      });
      const view = render(<RootLayout />);
      await flushReactUpdates();
      expect(view.queryByTestId('app-stack')).toBeNull();
      expect(replaceMock).not.toHaveBeenCalled();

      await act(async () => auth.resolve());
      expect(view.queryByTestId('app-stack')).not.toBeNull();
      expect(replaceMock).toHaveBeenCalledWith('/(auth)/login');
    });

    it.each<[boolean, '(auth)' | '(tabs)', '/(auth)/login' | '/(tabs)' | null]>([
      [false, '(tabs)', '/(auth)/login'],
      [false, '(auth)', null],
      [true, '(auth)', '/(tabs)'],
      [true, '(tabs)', null],
    ])('준비 완료 후 인증=%s·route=%s일 때 이동 대상은 %s이다', async (isAuthenticated, segment, target) => {
      jest.mocked(useSegments).mockReturnValue([segment]);
      useAuthStore.setState({ status: isAuthenticated ? 'signed-in' : 'signed-out' });
      render(<RootLayout />);
      await flushReactUpdates();

      if (target) {
        expect(replaceMock).toHaveBeenCalledTimes(1);
        expect(replaceMock).toHaveBeenCalledWith(target);
      } else {
        expect(replaceMock).not.toHaveBeenCalled();
      }
    });
  });

  describe('여행 선택 연결', () => {
    it.each([true, false])('최초 여행 목록에서 대표 여행 존재 여부=%s에 맞게 선택한다', async (hasMainTrip) => {
      const trips = [
        { id: 'first', name: '첫 여행' },
        { id: 'main', name: '대표 여행' },
      ] as NonNullable<ReturnType<typeof useGetTrips>['data']>;
      setTripQuery(trips);
      mainTripMock.mockReturnValue(hasMainTrip ? trips[1] : null);
      useAuthStore.setState({ status: 'signed-in' });
      render(<RootLayout />);
      await flushReactUpdates();

      expect(useTripStore.getState().selectedTripId).toBe(hasMainTrip ? 'main' : 'first');
    });

    it('빈 로컬 여행 목록에서는 기존 선택을 변경하지 않는다', async () => {
      useTripStore.setState({ selectedTripId: 'selected' });
      useAuthStore.setState({ status: 'signed-in' });
      render(<RootLayout />);
      await flushReactUpdates();
      expect(useTripStore.getState().selectedTripId).toBe('selected');
    });

    it('사용자가 고른 여행은 목록이 갱신되어도 대표 여행으로 되돌리지 않는다', async () => {
      const trips = [{ id: 'main' }, { id: 'chosen' }] as NonNullable<ReturnType<typeof useGetTrips>['data']>;
      setTripQuery(trips);
      mainTripMock.mockReturnValue(trips[0]);
      useAuthStore.setState({ status: 'signed-in' });
      const view = render(<RootLayout />);
      await flushReactUpdates();
      act(() => useTripStore.setState({ selectedTripId: 'chosen' }));

      setTripQuery([...trips]);
      view.rerender(<RootLayout />);
      expect(useTripStore.getState().selectedTripId).toBe('chosen');
    });
  });

  describe('정리 작업 예약과 해제', () => {
    it('인증 후 2초가 지나면 공통 cleanup 서비스를 호출한다', async () => {
      useAuthStore.setState({ status: 'signed-in' });
      cleanupMock.mockResolvedValue(1);
      render(<RootLayout />);
      await flushReactUpdates();
      expect(useOfflineMapCleanup).toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1_999);
      });
      expect(cleanupMock).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(cleanupMock).toHaveBeenCalledTimes(1);
    });

    it('cleanup 결과가 없으면 캐시를 무효화하지 않는다', async () => {
      useAuthStore.setState({ status: 'signed-in' });
      render(<RootLayout />);
      await flushReactUpdates();
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });
      expect(cleanupMock).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    it('cleanup 실패는 화면을 닫거나 캐시를 무효화하지 않는다', async () => {
      useAuthStore.setState({ status: 'signed-in' });
      cleanupMock.mockRejectedValue(new Error('정리 실패'));
      const view = render(<RootLayout />);
      await flushReactUpdates();
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });
      expect(view.queryByTestId('app-stack')).not.toBeNull();
      expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('지연 cleanup 실행 전에 로그아웃하면 해당 타이머를 해제한다', async () => {
      useAuthStore.setState({ status: 'signed-in' });
      render(<RootLayout />);
      await flushReactUpdates();
      await act(async () => {
        useAuthStore.setState({ status: 'signed-out' });
      });
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });
      expect(cleanupMock).not.toHaveBeenCalled();
    });
  });
});

it('재인증 화면 진입을 홈으로 되돌리지 않는다', async () => {
  useAuthStore.setState({ status: 'reauth-required', userId: 'user-1' });
  jest.mocked(useSegments).mockReturnValue(['(auth)']);
  render(<RootLayout />);
  await flushReactUpdates();
  expect(replaceMock).not.toHaveBeenCalled();
});

it('재로그인 성공 시 기존 여행 화면으로 돌아가 입력 중 화면을 유지한다', async () => {
  const back = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ ...useRouter(), canGoBack: () => true, back });
  jest.mocked(useSegments).mockReturnValue(['(auth)']);
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  render(<RootLayout />);
  await flushReactUpdates();
  act(() => useAuthStore.setState({ status: 'signed-in' }));
  expect(back).toHaveBeenCalledTimes(1);
  expect(replaceMock).not.toHaveBeenCalled();
});

it('다른 계정 로그인은 이전 여행 화면으로 돌아가지 않고 홈으로 진입한다', async () => {
  const back = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ ...useRouter(), canGoBack: () => true, back });
  jest.mocked(useSegments).mockReturnValue(['(auth)']);
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  render(<RootLayout />);
  await flushReactUpdates();
  act(() => useAuthStore.setState({ status: 'signed-in', userId: 'b' }));
  expect(back).not.toHaveBeenCalled();
  expect(replaceMock).toHaveBeenCalledWith('/(tabs)');
});
