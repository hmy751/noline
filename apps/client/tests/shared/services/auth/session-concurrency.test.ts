import { beforeEach, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import axios, { AxiosError, type AxiosAdapter } from 'axios';
import { useAuthStore } from '@/shared/store/auth';
import { completeLogin } from '@/shared/services/auth/login-service';
import { inspectLocalAccount } from '@/shared/services/auth/local-account';
import { setupAuthInterceptors } from '@/shared/services/auth/auth-interceptor';
import { refreshTokens } from '@/shared/services/auth/auth-transport';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn() }));
jest.mock('@/shared/services/auth/auth-api', () => ({ revokeRefreshToken: jest.fn() }));
jest.mock('@/shared/services/auth/auth-transport', () => ({ refreshTokens: jest.fn() }));
jest.mock('@/shared/services/sync/engine', () => ({ syncData: jest.fn() }));
jest.mock('@/shared/services/offline-map', () => ({ cleanupOfflineMapForTrip: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(), clear: jest.fn() } }));

const accountA = { userId: 'a', accessToken: 'access-a', refreshToken: 'refresh-a' };
let disk: Map<string, string>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(async () => {
  disk = new Map();
  jest
    .mocked(SecureStore.getItemAsync)
    .mockReset()
    .mockImplementation(async (key) => disk.get(key) ?? null);
  jest
    .mocked(SecureStore.setItemAsync)
    .mockReset()
    .mockImplementation(async (key, value) => {
      disk.set(key, value);
    });
  jest
    .mocked(SecureStore.deleteItemAsync)
    .mockReset()
    .mockImplementation(async (key) => {
      disk.delete(key);
    });
  jest.mocked(inspectLocalAccount).mockReset().mockResolvedValue('empty');
  jest.mocked(refreshTokens).mockReset();
  await useAuthStore.getState().clearSession();
});

it('동시 로그인에서도 먼저 적용된 A 계정 뒤 B 계정은 명시적 로그아웃 없이 적용하지 않는다', async () => {
  const writing = deferred<void>();
  const started = deferred<void>();
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (key, value) => {
    started.resolve();
    await writing.promise;
    disk.set(key, value);
  });
  const first = completeLogin(accountA);
  await started.promise;
  const second = completeLogin({ userId: 'b', accessToken: 'access-b', refreshToken: 'refresh-b' });
  await Promise.resolve();
  writing.resolve();
  const results = await Promise.allSettled([first, second]);
  expect({ results: results.map((r) => r.status), userId: useAuthStore.getState().userId }).toEqual({
    results: ['fulfilled', 'rejected'],
    userId: 'a',
  });
});

it('세션 삭제 성공 뒤 겹친 로그인 저장이 실패하면 signed-out과 빈 저장소가 일치한다', async () => {
  await useAuthStore.getState().saveAndApplySession(accountA);
  const deleting = deferred<void>();
  const started = deferred<void>();
  jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async (key) => {
    started.resolve();
    await deleting.promise;
    disk.delete(key);
  });
  const logout = useAuthStore.getState().clearSession();
  await started.promise;
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('new login save failed'));
  const login = useAuthStore
    .getState()
    .saveAndApplySession(accountA)
    .catch((error: Error) => error);
  deleting.resolve();
  await logout;
  await login;
  expect({ status: useAuthStore.getState().status, stored: disk.has('noline_session') }).toEqual({
    status: 'signed-out',
    stored: false,
  });
});

it('재시도 요청의 401이 확정된 뒤에는 다른 갱신 저장을 기다리는 동안에도 새 보호 요청을 차단한다', async () => {
  await useAuthStore.getState().saveAndApplySession(accountA);
  jest
    .mocked(refreshTokens)
    .mockResolvedValueOnce({ accessToken: 'first', refreshToken: 'first' })
    .mockResolvedValueOnce({ accessToken: 'second', refreshToken: 'second' });
  const firstRetried = deferred<void>();
  const rejectFirstRetry = deferred<void>();
  const invalidationCalled = deferred<void>();
  const invalidate = useAuthStore.getState().requireReauthentication;
  useAuthStore.setState({
    requireReauthentication: (sessionId) => {
      invalidationCalled.resolve();
      return invalidate(sessionId);
    },
  });
  const writing = deferred<void>();
  const started = deferred<void>();
  const adapter = jest.fn<AxiosAdapter>().mockImplementation(async (config) => {
    if (config.url === '/third') {
      return { status: 200, statusText: 'OK', headers: {}, config, data: {} };
    }
    if (config.url === '/first' && config.headers.Authorization === 'Bearer first') {
      firstRetried.resolve();
      await rejectFirstRetry.promise;
    }
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
      status: 401,
      statusText: 'Unauthorized',
      data: {},
      headers: {},
      config,
    });
  });
  const client = axios.create({ adapter });
  setupAuthInterceptors(client);
  const first = client.get('/first').catch((error: Error) => error);
  await firstRetried.promise;
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (key, value) => {
    started.resolve();
    await writing.promise;
    disk.set(key, value);
  });
  const second = client.get('/second').catch((error: Error) => error);
  await started.promise;
  rejectFirstRetry.resolve();
  await invalidationCalled.promise;
  await client.get('/third').catch(() => undefined);
  const callsWhileSaving = adapter.mock.calls.filter(([config]) => config.url === '/third').length;
  writing.resolve();
  await Promise.all([first, second]);
  useAuthStore.setState({ requireReauthentication: invalidate });
  expect(callsWhileSaving).toBe(0);
});
