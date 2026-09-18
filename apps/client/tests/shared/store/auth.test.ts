import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';

import { createAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
}));

let authStore: ReturnType<typeof createAuthStore>;

const getItemMock = jest.mocked(SecureStore.getItemAsync);

beforeEach(() => {
  authStore = createAuthStore();
  getItemMock.mockReset().mockResolvedValue(null);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('앱 시작의 인증 복원', () => {
  it('저장된 사용자와 토큰으로 오프라인 로그인 상태를 복원한다', async () => {
    const values: Record<string, string> = {
      noline_access_token: 'stored-token',
      noline_user_id: 'user-1',
      noline_user_name: '여행자',
      noline_user_email: 'traveler@example.com',
    };
    getItemMock.mockImplementation(async (key) => values[key] ?? null);

    await authStore.getState().restoreSessionOnce();

    expect(authStore.getState()).toMatchObject({
      userId: 'user-1',
      userInfo: { name: '여행자', email: 'traveler@example.com', profileImageUrl: null },
      isAuthenticated: true,
      isSessionExpired: false,
    });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it.each(['정보 없음', '토큰만 있음', '사용자만 있음', '읽기 실패'] as const)(
    '%s이면 비인증 상태로 복원을 마치고 저장된 정보는 지우지 않는다',
    async (scenario) => {
      getItemMock.mockImplementation(async (key) => {
        if (scenario === '읽기 실패') {
          throw new Error('읽기 실패');
        }
        if (scenario === '토큰만 있음' && key === 'noline_access_token') {
          return 'stored-token';
        }
        if (scenario === '사용자만 있음' && key === 'noline_user_id') {
          return 'user-1';
        }
        return null;
      });

      await expect(authStore.getState().restoreSessionOnce()).resolves.toBeUndefined();

      expect(authStore.getState()).toMatchObject({
        userId: null,
        userInfo: null,
        isAuthenticated: false,
        isSessionExpired: false,
      });
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();

      getItemMock.mockClear();
      await authStore.getState().restoreSessionOnce();
      expect(getItemMock).not.toHaveBeenCalled();
    },
  );

  it('복원 중 반복 호출은 같은 읽기 작업의 완료를 기다린다', async () => {
    let finishRead!: (value: string) => void;
    const pendingToken = new Promise<string>((resolve) => {
      finishRead = resolve;
    });
    getItemMock.mockImplementation(async (key) => {
      if (key === 'noline_access_token') {
        return pendingToken;
      }
      if (key === 'noline_user_id') {
        return 'user-1';
      }
      return null;
    });

    const first = authStore.getState().restoreSessionOnce();
    const second = authStore.getState().restoreSessionOnce();
    const tokenReads = getItemMock.mock.calls.filter(([key]) => key === 'noline_access_token');
    let completedCalls = 0;
    const completions = [first, second].map((call) => call.then(() => completedCalls++));
    await Promise.resolve();
    expect(completedCalls).toBe(0);

    finishRead('stored-token');
    await Promise.all(completions);
    expect(tokenReads).toHaveLength(1);
    expect(authStore.getState().isAuthenticated).toBe(true);
    expect(completedCalls).toBe(2);
  });

  it('복원이 끝난 뒤 로그인·로그아웃 상태를 다시 복원해 덮어쓰지 않는다', async () => {
    await authStore.getState().restoreSessionOnce();
    await authStore.getState().login({ accessToken: 'token', refreshToken: 'refresh', userId: 'user-1' });
    getItemMock.mockClear();

    await authStore.getState().restoreSessionOnce();
    expect(authStore.getState().isAuthenticated).toBe(true);
    expect(getItemMock).not.toHaveBeenCalled();

    await authStore.getState().logout();
    await authStore.getState().restoreSessionOnce();
    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(getItemMock).not.toHaveBeenCalled();
  });
});
