import React from 'react';
import { Alert } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';

import ProfileScreen from '@/screens/ProfileScreen';
import { performLogout, performDeleteAccount, type LogoutResult } from '@/shared/services/auth';

jest.mock('@/shared/services/auth', () => ({ performLogout: jest.fn(), performDeleteAccount: jest.fn() }));
jest.mock('@/shared/store/auth', () => ({ useAuthStore: () => ({ userInfo: null }) }));
jest.mock('@/features/profile/hooks/useStorageStats', () => ({
  useStorageStats: () => ({ stats: { dbSize: '0 B', mapPackSize: '0 B' } }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('lucide-react-native', () => ({
  User: () => null,
  Sun: () => null,
  Moon: () => null,
  Settings: () => null,
  Globe: () => null,
  Download: () => null,
  ChevronRight: () => null,
  Bug: () => null,
}));
jest.mock('@/shared/components', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Container: View, Stack: View, MobileHeader: () => null };
});
jest.mock('@repo/ui', () => {
  const actual = jest.requireActual<typeof import('@repo/ui')>('../../../../../packages/ui/src/components/Pressable');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    Avatar: View,
    AvatarFallback: View,
    AvatarImage: () => null,
    Switch: () => null,
    Separator: () => null,
  };
});

beforeEach(() => {
  jest.mocked(performLogout).mockReset();
  jest.mocked(performDeleteAccount).mockReset();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('강제 세션 종료의 대기 표시', () => {
  it.each([
    {
      scenario: '로그아웃',
      label: '로그아웃',
      confirmation: '계속 로그아웃',
      busyLabel: '로그아웃 중...',
      operation: performLogout,
    },
    {
      scenario: '회원 탈퇴',
      label: '계정 삭제',
      confirmation: '계속 삭제',
      busyLabel: '계정 삭제 중...',
      operation: performDeleteAccount,
    },
  ])(
    '$scenario 확인 후 대기하는 동안 진행 표시를 유지하고 두 종료 버튼을 막는다',
    async ({ label, confirmation, busyLabel, operation }) => {
      let finish!: (value: LogoutResult) => void;
      const pending = new Promise<LogoutResult>((resolve) => {
        finish = resolve;
      });
      jest.mocked(operation).mockResolvedValueOnce({ success: false, hasPendingSync: true });
      jest.mocked(operation).mockReturnValueOnce(pending);
      const screen = render(<ProfileScreen />);

      await act(async () => {
        fireEvent.press(screen.getByText(label));
        if (label === '계정 삭제') {
          const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
          buttons?.find((button) => button.text === '계정 삭제')?.onPress?.();
        }
      });
      const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
      const continueButton = buttons?.find((button) => button.text === confirmation);
      expect(continueButton).toBeDefined();

      try {
        act(() => {
          continueButton?.onPress?.();
        });
        expect(screen.getByText(busyLabel)).toBeOnTheScreen();
        expect(screen.getByText(busyLabel)).toBeDisabled();
        const otherLabel = label === '로그아웃' ? '계정 삭제' : '로그아웃';
        expect(screen.getByText(otherLabel)).toBeDisabled();
        expect(operation).toHaveBeenLastCalledWith({ force: true });
      } finally {
        await act(async () => {
          finish({ success: true });
        });
      }
      expect(screen.getByText(label)).toBeOnTheScreen();
    },
  );
});
