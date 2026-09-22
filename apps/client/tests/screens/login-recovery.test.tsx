import React from 'react';
import { Alert } from 'react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import LoginScreen from '@/screens/LoginScreen';
import { useAuthStore } from '@/shared/store/auth';
import { performLogout } from '@/shared/services/auth/logout-service';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/services/auth/logout-service', () => ({ performLogout: jest.fn() }));
jest.mock('@/shared/services/auth/login-service', () => ({ completeLogin: jest.fn() }));
jest.mock('@/shared/services/auth', () => ({
  useGoogleAuth: () => ({ signIn: jest.fn(), isLoading: false }),
  isGoogleAuthConfigured: () => false,
  isAppleAuthAvailable: () => false,
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => false } }));
jest.mock('lucide-react-native', () => ({ Plane: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
}));
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Pressable: ({ children, ...props }: React.ComponentProps<typeof Pressable>) =>
      ReactRuntime.createElement(
        Pressable,
        props,
        ReactRuntime.createElement(
          Text,
          null,
          typeof children === 'function' ? children({ pressed: false }) : children,
        ),
      ),
  };
});

beforeEach(() => {
  jest.mocked(performLogout).mockReset().mockResolvedValue({ success: true });
});

it.each(['restore-failed', 'signed-out'] as const)(
  '%s에서도 명시적 폐기 확인 뒤에만 기기 데이터를 정리한다',
  async (status) => {
    useAuthStore.setState({ status, userId: null });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = render(<LoginScreen />);
    fireEvent.press(view.getByText('기기 데이터 정리하고 로그아웃'));
    expect(performLogout).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2];
    expect(buttons?.find((button) => button.style === 'cancel')).toBeTruthy();
    await act(async () => {
      await buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    expect(performLogout).toHaveBeenCalledWith({ force: true });
    alert.mockRestore();
  },
);
