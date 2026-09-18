import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';

import TabsLayout from '../../app/(tabs)/_layout';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({}));
jest.mock('lucide-react-native', () => ({
  Home: () => null,
  Calendar: () => null,
  Wallet: () => null,
  User: () => null,
}));
jest.mock('expo-router', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Tabs: Object.assign(
      ({ children }: { children: React.ReactNode }) =>
        ReactRuntime.createElement(View, { testID: 'protected-tabs' }, children),
      { Screen: () => null },
    ),
    Redirect: ({ href }: { href: string }) => ReactRuntime.createElement(Text, null, href),
  };
});

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false });
});

describe('Root 준비 완료 뒤 탭의 인증 보호', () => {
  it('비인증이면 보호된 탭 대신 로그인 경로를 반환한다', () => {
    const view = render(<TabsLayout />);

    expect(view.queryByTestId('protected-tabs')).toBeNull();
    expect(view.getByText('/(auth)/login')).toBeTruthy();
  });

  it('인증 상태에서 탭을 보여주고 로그아웃 상태로 바뀌면 즉시 가린다', () => {
    useAuthStore.setState({ isAuthenticated: true });
    const view = render(<TabsLayout />);
    expect(view.getByTestId('protected-tabs')).toBeTruthy();

    act(() => useAuthStore.setState({ isAuthenticated: false }));

    expect(view.queryByTestId('protected-tabs')).toBeNull();
    expect(view.getByText('/(auth)/login')).toBeTruthy();
  });
});
