jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn(async () => 'empty') }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { configureApiClient } from '@/shared/api/fetcher';
import { AuthRequiredError } from '@/shared/store/auth';
import { refreshTokens } from '@/shared/services/auth/auth-transport';
import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/auth/auth-transport', () => ({ refreshTokens: jest.fn() }));

const credentials = { userId: 'user-a', accessToken: 'expired', refreshToken: 'refresh' };

beforeEach(async () => {
  await useAuthStore.getState().saveAndApplySession(credentials);
  jest.mocked(refreshTokens).mockReset().mockResolvedValue({
    accessToken: 'renewed',
    refreshToken: 'renewed-refresh',
  });
});

describe('인증 재시도를 포함한 API client', () => {
  it('사람의 재로그인이 필요한 오류는 React Query 재시도 대상으로 쌓지 않는다', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');
    const shouldRetry = retry as (failureCount: number, error: Error) => boolean;

    expect(shouldRetry(0, new AuthRequiredError())).toBe(false);
    expect(shouldRetry(0, new Error('temporary'))).toBe(true);
    expect(shouldRetry(1, new Error('temporary'))).toBe(false);
  });

  it('401 갱신 뒤 재전송한 응답 본문을 한 번만 변환한다', async () => {
    const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => {
      if (config.headers.Authorization !== 'Bearer renewed') {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        });
      }
      return { status: 200, statusText: 'OK', data: { value: 'kept' }, headers: {}, config };
    });
    const client = configureApiClient(axios.create({ adapter }));

    await expect(client.get('/api/trips')).resolves.toEqual({ value: 'kept' });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(refreshTokens).toHaveBeenCalledTimes(1);
  });

  it('재인증 필요 오류를 일반 API 오류로 바꾸지 않는다', async () => {
    await useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId);
    const adapter = jest.fn<AxiosAdapter>();
    const client = configureApiClient(axios.create({ adapter }));

    await expect(client.get('/api/trips')).rejects.toMatchObject({ name: 'AuthRequiredError' });
    expect(adapter).not.toHaveBeenCalled();
  });
});
