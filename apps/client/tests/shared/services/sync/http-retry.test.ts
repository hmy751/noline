import { expect, it, jest } from '@jest/globals';
import { AxiosError, type AxiosAdapter } from 'axios';
import api from '@/shared/services/sync/api';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn(async () => 'empty') }));

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn() }));

it('sync HTTP의 연속 5xx는 명시된 최대 3회 재시도와 일치한다', async () => {
  await useAuthStore.getState().saveAndApplySession({ userId: 'a', accessToken: 'a', refreshToken: 'r' });
  const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => {
    throw new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', config, null, {
      status: 503,
      statusText: 'Unavailable',
      headers: {},
      config,
      data: {},
    });
  });
  api.defaults.adapter = adapter;
  jest.useFakeTimers();
  try {
    const request = api.get('/api/sync/pull').catch((error: Error) => error);
    await jest.advanceTimersByTimeAsync(14000);
    await request;
    expect(adapter).toHaveBeenCalledTimes(4);
  } finally {
    jest.useRealTimers();
  }
});
