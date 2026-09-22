import React from 'react';
import { Alert } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';

import DebugScreen from '@/features/debug/ui/DebugScreen';
import { SyncProvider } from '@/shared/services/sync/provider';
import { syncData } from '@/shared/services/sync/engine';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));
jest.mock('@/shared/services/auth/token-storage', () => ({}));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncQueueStats: jest.fn(async () => ({ pending: 0, inProgress: 0, failed: 0, total: 0 })),
}));
jest.mock('@/shared/db', () => ({
  isDatabaseReady: () => true,
  getDatabase: () => ({ select: () => ({ from: () => ({ all: async () => [] }) }) }),
}));
jest.mock('@rnmapbox/maps', () => ({ __esModule: true, default: {} }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('lucide-react-native', () => ({ ArrowLeft: () => null }));
jest.mock('@/shared/components', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Container: View, Stack: View, MobileHeader: () => null };
});
jest.mock('@repo/ui', () => jest.requireActual('../../../../../packages/ui/src/components/Pressable'));
jest.mock('@/features/debug/ui/DataInspectorView', () => ({ DataInspectorView: () => null }));
jest.mock('@/features/debug/ui/ToolsView', () => ({ ToolsView: () => null }));
jest.mock('@/features/debug/ui/DashboardView', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Button } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    DashboardView: ({ onManualSync }: { onManualSync: () => Promise<void> }) =>
      ReactRuntime.createElement(Button, { title: '수동 동기화', onPress: onManualSync }),
  };
});

beforeEach(() => {
  useAuthStore.setState({ status: 'signed-in' });
  useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });
  jest.mocked(syncData).mockReset().mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  for (const method of ['log', 'info', 'debug', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation(() => undefined);
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Debug 수동 sync의 실제 실행 경계', () => {
  it.each([
    {
      scenario: 'unknown',
      status: 'unknown',
      override: null,
      authenticated: true,
      message: '네트워크 연결을 확인한 후 다시 시도해 주세요.',
    },
    {
      scenario: 'offline',
      status: 'offline',
      override: null,
      authenticated: true,
      message: '네트워크 연결 후 다시 시도해 주세요.',
    },
    {
      scenario: '강제 online',
      status: 'online',
      override: 'online',
      authenticated: true,
      message: '네트워크 강제 설정을 해제한 후 동기화할 수 있습니다.',
    },
    {
      scenario: '로그인 전',
      status: 'online',
      override: null,
      authenticated: false,
      message: '로그인 후 동기화할 수 있습니다.',
    },
  ] as const)(
    '$scenario에서는 엔진을 호출하지 않고 보류 이유를 안내한다',
    async ({ status, override, authenticated, message }) => {
      useAuthStore.setState({ status: authenticated ? 'signed-in' : 'signed-out' });
      useNetworkStore.setState({ realStatus: status, overrideStatus: override });
      const screen = render(
        <SyncProvider>
          <DebugScreen />
        </SyncProvider>,
      );

      await act(async () => {
        fireEvent.press(screen.getByText('수동 동기화'));
      });

      expect(syncData).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('동기화 보류', message);
    },
  );
});
