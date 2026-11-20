import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import LoginScreen from '@/screens/LoginScreen';
import { useAuthStore } from '@/shared/store/auth';
import { signInWithApple } from '@/shared/services/auth';

const mockGoogleSignIn = jest.fn<() => Promise<unknown>>();

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/services/auth/logout-service', () => ({ performLogout: jest.fn() }));
jest.mock('@/shared/services/auth/login-service', () => ({ completeLogin: jest.fn() }));
jest.mock('@/shared/services/auth', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useGoogleAuth: () => ({ signIn: mockGoogleSignIn, isLoading: false }),
    isGoogleAuthConfigured: () => true,
    isAppleAuthAvailable: () => true,
    signInWithApple: jest.fn(),
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
    AppleAuthenticationButtonType: { SIGN_IN: 0 },
    AppleAuthenticationButtonStyle: { BLACK: 2 },
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) =>
      ReactRuntime.createElement(Pressable, { onPress }, ReactRuntime.createElement(Text, null, 'Apple로 로그인')),
  };
});
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => false } }));
jest.mock('lucide-react-native', () => ({ Plane: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.requireActual<typeof import('react-native')>('react-native').View,
}));
jest.mock('@repo/ui', () => ({
  Pressable: jest.requireActual<typeof import('react-native')>('react-native').Pressable,
}));

/** 끝나지 않은 로그인을 흉내 내고, 나중에 취소로 끝낼 수 있게 resolve를 돌려준다. */
function pending() {
  let resolve: (value: unknown) => void = () => undefined;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, finish: () => resolve({ success: false, error: 'CANCELLED' }) };
}

beforeEach(() => {
  useAuthStore.setState({ status: 'signed-out', userId: null });
  mockGoogleSignIn.mockReset();
  jest.mocked(signInWithApple).mockReset();
});

it('Apple 로그인 중에는 Apple 버튼에만 로딩을 표시하고 Google 버튼은 그대로 둔다', async () => {
  const apple = pending();
  jest.mocked(signInWithApple).mockReturnValue(apple.promise as ReturnType<typeof signInWithApple>);
  const view = render(<LoginScreen />);

  fireEvent.press(view.getByText('Apple로 로그인'));

  expect(view.getByLabelText('Apple 로그인 진행 중')).toBeTruthy();
  expect(view.queryByLabelText('Google 로그인 진행 중')).toBeNull();
  expect(view.getByText('Google로 계속하기')).toBeTruthy();

  await act(async () => {
    apple.finish();
  });
  expect(view.queryByLabelText('Apple 로그인 진행 중')).toBeNull();
});

it('Google 로그인 중에는 Google 버튼에만 로딩을 표시한다', async () => {
  const google = pending();
  mockGoogleSignIn.mockReturnValue(google.promise);
  const view = render(<LoginScreen />);

  fireEvent.press(view.getByText('Google로 계속하기'));

  expect(view.getByLabelText('Google 로그인 진행 중')).toBeTruthy();
  expect(view.queryByLabelText('Apple 로그인 진행 중')).toBeNull();

  await act(async () => {
    google.finish();
  });
  expect(view.getByText('Google로 계속하기')).toBeTruthy();
});
