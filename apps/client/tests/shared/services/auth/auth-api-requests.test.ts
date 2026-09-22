jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn(async () => 'empty') }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AxiosAdapter } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiAxios, authAxios } from '@/shared/api/axios-instances';
import { deleteAccount, getCurrentUser, logout } from '@/shared/services/auth/auth-api';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
}));

const credentials = { userId: 'user-a', accessToken: 'access', refreshToken: 'refresh' };
const previousAdapter = apiAxios.defaults.adapter;

beforeEach(async () => {
  jest.mocked(SecureStore.getItemAsync).mockReset().mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockReset().mockResolvedValue(undefined);
  await useAuthStore.getState().saveAndApplySession(credentials);
  apiAxios.defaults.adapter = previousAdapter;
});

describe('인증 API의 현재 세션 사용', () => {
  it('내 정보 조회와 회원 탈퇴에 현재 세션의 access token을 보낸다', async () => {
    const user = {
      id: 'user-a',
      email: 'user@example.com',
      name: 'User',
      provider: 'google',
      createdAt: '2026-09-21T00:00:00Z',
    };
    const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => ({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: config.url === '/api/auth/me' ? { success: true, data: user } : { success: true },
    }));
    apiAxios.defaults.adapter = adapter;

    await expect(getCurrentUser()).resolves.toMatchObject(user);
    await expect(deleteAccount()).resolves.toBeUndefined();
    expect(adapter).toHaveBeenCalledTimes(2);
    for (const [config] of adapter.mock.calls) {
      expect(config.headers.Authorization).toBe('Bearer access');
    }
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it('인증 거절 저장 실패 뒤에도 디스크의 옛 토큰으로 보호된 요청을 보내지 않는다', async () => {
    const adapter = jest.fn<AxiosAdapter>();
    apiAxios.defaults.adapter = adapter;
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(JSON.stringify({ version: 1, ...credentials, userInfo: null }));
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('secure store locked'));

    await expect(useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId)).rejects.toThrow(
      'secure store locked',
    );
    await expect(getCurrentUser()).rejects.toMatchObject({ name: 'AuthRequiredError' });
    await expect(deleteAccount()).rejects.toMatchObject({ name: 'AuthRequiredError' });
    expect(adapter).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it('로그아웃은 현재 세션의 refresh token을 서버 폐기에 사용한다', async () => {
    const revoke = jest.spyOn(authAxios, 'post').mockResolvedValue({ data: { success: true } });

    try {
      await logout();
      expect(revoke).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh' });
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    } finally {
      revoke.mockRestore();
    }
  });

  it('재로그인이 필요한 상태에서는 디스크의 옛 refresh token을 폐기 요청에 사용하지 않는다', async () => {
    const revoke = jest.spyOn(authAxios, 'post').mockResolvedValue({ data: { success: true } });
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(JSON.stringify({ version: 1, ...credentials, userInfo: null }));

    try {
      await useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId);
      await logout();
      expect(revoke).not.toHaveBeenCalled();
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    } finally {
      revoke.mockRestore();
    }
  });
});
