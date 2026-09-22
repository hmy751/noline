jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn(async () => 'empty') }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { setupAuthInterceptors, setupSyncAuthInterceptors } from '@/shared/services/auth/auth-interceptor';
import { refreshTokens } from '@/shared/services/auth/auth-transport';
import { useAuthStore } from '@/shared/store/auth';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/auth/auth-transport', () => ({ refreshTokens: jest.fn() }));

const login = { userId: 'user-a', accessToken: 'access', refreshToken: 'refresh' };
const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
const refreshMock = jest.mocked(refreshTokens);

beforeEach(async () => {
  await useAuthStore.getState().clearSession();
  await useAuthStore.getState().saveAndApplySession(login);
  refreshMock.mockReset().mockResolvedValue(tokens);
});

function api(setup: typeof setupAuthInterceptors) {
  const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => {
    if (config.headers.Authorization !== 'Bearer new-access') {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    }
    return { status: 200, statusText: 'OK', data: 'ok', headers: {}, config };
  });
  const client = axios.create({ adapter });
  setup(client);
  return { client, adapter };
}

describe.each([
  { client: '일반 API', setup: setupAuthInterceptors },
  { client: '동기화 API', setup: setupSyncAuthInterceptors },
])('$client의 인증 갱신', ({ setup }) => {
  it('동시에 401을 받은 요청들은 한 번의 토큰 갱신을 공유한다', async () => {
    let finish!: (value: typeof tokens) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    refreshMock.mockImplementationOnce(() => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const { client, adapter } = api(setup);
    const requests = [client.get('/api/trips'), client.get('/api/schedules')];

    await ready;
    expect(refreshMock).toHaveBeenCalledTimes(1);
    finish(tokens);
    await expect(Promise.all(requests)).resolves.toHaveLength(2);
    expect(adapter).toHaveBeenCalledTimes(4);
  });

  it('첫 401에서는 갱신 후 원래 요청을 한 번 재시도한다', async () => {
    const { client, adapter } = api(setup);
    await expect(client.get('/api/trips')).resolves.toMatchObject({ data: 'ok' });
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, 500, 503])('refresh 실패 %s는 재로그인 확정으로 바꾸지 않는다', async (status) => {
    const error = Object.assign(new Error('temporary'), { response: status ? { status } : undefined });
    refreshMock.mockRejectedValue(error);
    await expect(api(setup).client.get('/api/trips')).rejects.toBe(error);
    expect(useAuthStore.getState().status).toBe('signed-in');
  });

  it('refresh 인증 거부는 계정을 유지하고 자격 증명을 비운다', async () => {
    refreshMock.mockRejectedValue({ response: { status: 401 } });
    await expect(api(setup).client.get('/api/trips')).rejects.toMatchObject({ name: 'AuthRequiredError' });
    expect(useAuthStore.getState()).toMatchObject({
      status: 'reauth-required',
      userId: 'user-a',
    });
    expect(useAuthStore.getState()).not.toHaveProperty('session');
    expect(useAuthStore.getRefreshToken(useAuthStore.getState().sessionId)).toBeNull();
  });

  it('인증 거부 저장이 실패해도 현재 실행에서는 일관된 재인증 오류와 상태를 유지한다', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    refreshMock.mockRejectedValue({ response: { status: 401 } });
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('secure store locked'));

    await expect(api(setup).client.get('/api/trips')).rejects.toMatchObject({ name: 'AuthRequiredError' });
    expect(useAuthStore.getState()).toMatchObject({ status: 'reauth-required', userId: 'user-a' });
    expect(errorLog).toHaveBeenCalledWith('[Auth] failed to persist rejected credentials', expect.any(Error));
    errorLog.mockRestore();
  });

  it('refresh 수단이 없는 access 토큰의 거부는 재로그인이 필요하다', async () => {
    const refreshToken = jest.spyOn(useAuthStore, 'getRefreshToken').mockReturnValueOnce(null);
    try {
      await expect(api(setup).client.get('/api/trips')).rejects.toMatchObject({ name: 'AuthRequiredError' });
      expect(refreshMock).not.toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('reauth-required');
    } finally {
      refreshToken.mockRestore();
    }
  });

  it('reauth-required에서는 요청 자체를 보내지 않는다', async () => {
    await useAuthStore.getState().requireReauthentication(useAuthStore.getState().sessionId);
    const { client, adapter } = api(setup);
    await expect(client.post('/api/trips')).rejects.toMatchObject({ name: 'AuthRequiredError' });
    expect(adapter).not.toHaveBeenCalled();
  });

  it('로그아웃 정리 중 도착한 이전 요청의 성공 응답을 버린다', async () => {
    let finishResponse!: () => void;
    let requestStarted!: () => void;
    let finishCleanup!: () => void;
    let cleanupStarted!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      requestStarted = resolve;
    });
    const responsePending = new Promise<void>((resolve) => {
      finishResponse = resolve;
    });
    const cleanupReady = new Promise<void>((resolve) => {
      cleanupStarted = resolve;
    });
    const cleanupPending = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => {
      requestStarted();
      await responsePending;
      return { status: 200, statusText: 'OK', data: 'old result', headers: {}, config };
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async () => {
      cleanupStarted();
      await cleanupPending;
    });
    const client = axios.create({ adapter });
    setup(client);
    const request = client.get('/api/trips');

    await responseReady;
    const ending = useAuthStore.getState().clearSession();
    try {
      await cleanupReady;
      expect(useAuthStore.getState().status).toBe('reauth-required');
      finishResponse();
      await expect(request).rejects.toMatchObject({ name: 'AuthRequiredError' });
    } finally {
      finishResponse();
      finishCleanup();
      await ending;
    }
  });

  it('갱신 중 다른 계정으로 바뀌면 원래 요청을 새 계정으로 재전송하지 않는다', async () => {
    let finish!: (value: typeof tokens) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    refreshMock.mockImplementationOnce(() => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const { client, adapter } = api(setup);
    const response = client.post('/api/trips').catch((error: Error) => error);
    await ready;
    await useAuthStore.getState().clearSession();
    await useAuthStore.getState().saveAndApplySession({ ...login, userId: 'user-b' });
    finish(tokens);
    expect(await response).toMatchObject({ name: 'AuthRequiredError' });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getAccessToken(useAuthStore.getState().sessionId)).toBe('access');
  });
});
