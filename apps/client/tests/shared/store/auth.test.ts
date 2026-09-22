import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';

import { createAuthStore } from '@/shared/store/auth';
import { inspectLocalAccount } from '@/shared/services/auth/local-account';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
}));
jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn() }));

const key = 'noline_session';
const credentials = { userId: 'user-1', accessToken: 'access', refreshToken: 'refresh' };
let storage: Map<string, string>;
let store: ReturnType<typeof createAuthStore>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.mocked(inspectLocalAccount).mockReset().mockResolvedValue('empty');
  storage = new Map();
  jest
    .mocked(SecureStore.getItemAsync)
    .mockReset()
    .mockImplementation(async (name) => storage.get(name) ?? null);
  jest
    .mocked(SecureStore.setItemAsync)
    .mockReset()
    .mockImplementation(async (name, value) => {
      storage.set(name, value);
    });
  jest
    .mocked(SecureStore.deleteItemAsync)
    .mockReset()
    .mockImplementation(async (name) => {
      storage.delete(name);
    });
  store = createAuthStore();
});

describe('기기에 저장한 세션 복원', () => {
  it('초기 상태는 initializing이고 빈 저장소를 읽으면 signed-out이 된다', async () => {
    expect(store.getState().status).toBe('initializing');

    await store.getState().restoreSessionOnce();

    expect(store.getState().status).toBe('signed-out');
  });

  it.each([
    { accessToken: 'access', refreshToken: 'refresh', expectedStatus: 'signed-in' },
    { accessToken: 'access', refreshToken: null, expectedStatus: 'signed-in' },
    { accessToken: null, refreshToken: 'refresh', expectedStatus: 'signed-in' },
    { accessToken: null, refreshToken: null, expectedStatus: 'reauth-required' },
  ] as const)(
    'access=$accessToken refresh=$refreshToken이면 $expectedStatus로 서버 없이 복원한다',
    async ({ accessToken, refreshToken, expectedStatus }) => {
      storage.set(key, JSON.stringify({ version: 1, userId: 'user-1', accessToken, refreshToken, userInfo: null }));

      await store.getState().restoreSessionOnce();

      expect(store.getState()).toMatchObject({ status: expectedStatus, userId: 'user-1' });
    },
  );

  it.each([
    {
      name: '저장소 읽기',
      arrange: () => jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('locked')),
    },
    { name: 'JSON 해석', arrange: () => storage.set(key, '{') },
    {
      name: '세션 형태 검증',
      arrange: () => storage.set(key, JSON.stringify({ version: 1, userId: 'user-1' })),
    },
    { name: '이전 사용자 단독 기록', arrange: () => storage.set('noline_user_id', 'user-1') },
    { name: '이전 토큰 단독 기록', arrange: () => storage.set('noline_access_token', 'access') },
  ])('$name 실패는 데이터 삭제 없이 restore-failed이다', async ({ arrange }) => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    arrange();

    await store.getState().restoreSessionOnce();

    expect(store.getState()).toMatchObject({ status: 'restore-failed', userId: null });
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith('[Auth] session restore failed', expect.anything());
    errorLog.mockRestore();
  });

  it('기존 사용자와 토큰 쌍은 복원하고 다음 저장부터 하나의 레코드를 쓴다', async () => {
    storage.set('noline_user_id', 'user-1');
    storage.set('noline_access_token', 'access');
    await store.getState().restoreSessionOnce();
    expect(store.getState().status).toBe('signed-in');
    await store.getState().requireReauthentication(store.getState().sessionId);
    const storedSession = storage.get(key);
    if (!storedSession) {
      throw new Error('저장된 테스트 세션을 찾지 못했습니다');
    }
    expect(JSON.parse(storedSession)).toMatchObject({ userId: 'user-1', accessToken: null, refreshToken: null });
  });

  it('복원 실패는 명시적 재시도만 다시 읽고 성공 후에는 반복 복원하지 않는다', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('locked'));
    await store.getState().restoreSessionOnce();
    const reads = jest.mocked(SecureStore.getItemAsync).mock.calls.length;
    await store.getState().restoreSessionOnce();
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(reads);
    await store.getState().retrySessionRestore();
    expect(store.getState().status).toBe('signed-out');
    await store.getState().saveAndApplySession(credentials);
    await store.getState().restoreSessionOnce();
    expect(store.getState().status).toBe('signed-in');
    expect(errorLog).toHaveBeenCalledWith('[Auth] session restore failed', expect.any(Error));
    errorLog.mockRestore();
  });

  it('동시 복원은 한 번 읽고 복원이 끝난 뒤 로그인 세션을 적용한다', async () => {
    const read = deferred<string | null>();
    jest.mocked(SecureStore.getItemAsync).mockReturnValueOnce(read.promise);
    const first = store.getState().restoreSessionOnce();
    const second = store.getState().restoreSessionOnce();
    expect(first).toBe(second);
    const login = store.getState().saveAndApplySession(credentials);
    read.resolve(null);
    await Promise.all([first, login]);
    expect(store.getState()).toMatchObject({ status: 'signed-in', userId: 'user-1' });
  });
});

describe('세션 변경과 늦은 토큰 응답', () => {
  it.each(['signed-in', 'reauth-required'] as const)(
    '%s에서 로그아웃 저장소 삭제가 실패하면 인증 차단과 계정을 유지하고 종료를 재시도한다',
    async (status) => {
      await store.getState().saveAndApplySession(credentials);
      const sessionId = store.getState().sessionId;
      if (status === 'reauth-required') {
        await store.getState().requireReauthentication(sessionId);
      }
      const saved = storage.get(key);
      jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async () => {
        throw new Error('secure store locked');
      });

      await expect(store.getState().clearSession()).rejects.toThrow('secure store locked');

      expect(store.getState()).toMatchObject({ status: 'reauth-required', userId: 'user-1' });
      expect(store.isCurrentSession(sessionId)).toBe(false);
      expect(store.getAccessToken(sessionId)).toBeNull();
      expect(store.getRefreshToken(sessionId)).toBeNull();
      expect(storage.get(key)).toBe(saved);

      await expect(store.getState().clearSession()).resolves.toBeUndefined();
      expect(store.getState()).toMatchObject({ status: 'signed-out', userId: null });
      expect(storage.has(key)).toBe(false);
    },
  );

  it('로그아웃 삭제 실패 뒤 재로그인 저장도 실패하면 인증 차단 상태를 유지한다', async () => {
    await store.getState().saveAndApplySession(credentials);
    const sessionId = store.getState().sessionId;
    jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('delete failed'));
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('save failed'));

    const logout = store.getState().clearSession();
    const login = store.getState().saveAndApplySession(credentials);
    await expect(logout).rejects.toThrow('delete failed');
    await expect(login).rejects.toThrow('save failed');

    expect(store.getState()).toMatchObject({ status: 'reauth-required', userId: 'user-1' });
    expect(store.getAccessToken(sessionId)).toBeNull();
    await store.getState().saveAndApplySession(credentials);
    expect(store.getState().status).toBe('signed-in');
    expect(store.getState().sessionId).not.toBe(sessionId);
    expect(store.getAccessToken(store.getState().sessionId)).toBe('access');
  });

  it('새 로그인 저장 실패는 기존 세션의 공개 상태와 요청 세대를 그대로 유지한다', async () => {
    await store.getState().saveAndApplySession(credentials);
    const previousSessionId = store.getState().sessionId;
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('secure store locked'));

    await expect(
      store.getState().saveAndApplySession({ ...credentials, accessToken: 'replacement', refreshToken: 'replacement' }),
    ).rejects.toThrow('secure store locked');

    expect(store.getState()).toMatchObject({
      status: 'signed-in',
      userId: 'user-1',
      sessionId: previousSessionId,
    });
    expect(store.getState()).not.toHaveProperty('session');
    expect(store.getAccessToken(previousSessionId)).toBe('access');
    await expect(
      store.getState().refreshTokens({ accessToken: 'renewed', refreshToken: 'renewed' }, previousSessionId),
    ).resolves.toBe(true);
  });

  it('겹친 로그인에서 첫 저장은 성공하고 두 번째 저장이 실패하면 첫 세션을 유지한다', async () => {
    const firstWrite = deferred<void>();
    const firstStarted = deferred<void>();
    jest
      .mocked(SecureStore.setItemAsync)
      .mockImplementationOnce(async (name, value) => {
        firstStarted.resolve();
        await firstWrite.promise;
        storage.set(name, value);
      })
      .mockRejectedValueOnce(new Error('second save failed'));

    const first = store.getState().saveAndApplySession(credentials);
    await firstStarted.promise;
    const second = store.getState().saveAndApplySession({ ...credentials, accessToken: 'second' });
    firstWrite.resolve();

    await expect(first).resolves.toBeUndefined();
    await expect(second).rejects.toThrow('second save failed');
    expect(store.getState()).toMatchObject({ status: 'signed-in', userId: 'user-1' });
    expect(store.getAccessToken(store.getState().sessionId)).toBe('access');
    expect(JSON.parse(storage.get(key) ?? '{}')).toMatchObject({ accessToken: 'access' });
  });

  it('로그아웃이 시작된 뒤 완료된 로그인 저장은 세션으로 적용되지 않는다', async () => {
    const writing = deferred<void>();
    const started = deferred<void>();
    jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (name, value) => {
      started.resolve();
      await writing.promise;
      storage.set(name, value);
    });

    const login = store.getState().saveAndApplySession(credentials);
    await started.promise;
    const logout = store.getState().clearSession();
    writing.resolve();

    await expect(login).rejects.toThrow('종료된 세션의 로그인 저장은 적용할 수 없습니다');
    await expect(logout).resolves.toBeUndefined();
    expect(store.getState()).toMatchObject({ status: 'signed-out', userId: null });
    expect(storage.has(key)).toBe(false);
  });

  it('reauth-required의 재로그인 저장 실패는 로컬 세션을 유지하고 다음 시도에서 복구한다', async () => {
    await store.getState().saveAndApplySession(credentials);
    await store.getState().requireReauthentication(store.getState().sessionId);
    const previousSessionId = store.getState().sessionId;
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('secure store locked'));

    await expect(store.getState().saveAndApplySession(credentials)).rejects.toThrow('secure store locked');
    expect(store.getState()).toMatchObject({
      status: 'reauth-required',
      userId: 'user-1',
      sessionId: previousSessionId,
    });
    expect(store.getAccessToken(previousSessionId)).toBeNull();
    expect(store.getRefreshToken(previousSessionId)).toBeNull();

    await expect(store.getState().saveAndApplySession(credentials)).resolves.toBeUndefined();
    expect(store.getState()).toMatchObject({ status: 'signed-in', userId: 'user-1' });
    expect(store.getState().sessionId).not.toBe(previousSessionId);
  });

  it('인증 갱신 거부 결과는 재시작 후에도 같은 계정의 reauth-required로 남는다', async () => {
    await store.getState().saveAndApplySession(credentials);
    await store.getState().requireReauthentication(store.getState().sessionId);
    const restarted = createAuthStore();
    await restarted.getState().restoreSessionOnce();
    expect(restarted.getState()).toMatchObject({ status: 'reauth-required', userId: 'user-1' });
  });

  it.each([
    { name: 'logout', nextUserId: null },
    { name: 'different-account', nextUserId: 'user-2' },
    { name: 'same-account', nextUserId: 'user-1' },
  ])('$name 뒤 도착한 이전 refresh를 저장하지 않는다', async ({ nextUserId }) => {
    await store.getState().saveAndApplySession(credentials);
    const sessionId = store.getState().sessionId;

    await store.getState().clearSession();
    if (nextUserId) {
      await store.getState().saveAndApplySession({ ...credentials, userId: nextUserId });
    }

    const before = storage.get(key);
    expect(await store.getState().refreshTokens({ accessToken: 'late', refreshToken: 'late' }, sessionId)).toBe(false);
    expect(storage.get(key)).toBe(before);
  });

  it('refresh 저장 중 로그아웃이 시작돼도 직렬화된 삭제 후 토큰이 되살아나지 않는다', async () => {
    await store.getState().saveAndApplySession(credentials);
    const writing = deferred<void>();
    const started = deferred<void>();
    jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (name, value) => {
      started.resolve();
      await writing.promise;
      storage.set(name, value);
    });
    const refresh = store
      .getState()
      .refreshTokens({ accessToken: 'new', refreshToken: 'new' }, store.getState().sessionId);
    await started.promise;
    const logout = store.getState().clearSession();
    writing.resolve();
    await Promise.all([refresh, logout]);
    expect(store.getState().status).toBe('signed-out');
    expect(storage.has(key)).toBe(false);
  });
});

it.each(['different', 'unresolved'] as const)(
  'Store를 직접 호출해도 %s 데이터 위에 새 세션을 저장하지 않는다',
  async (account) => {
    jest.mocked(inspectLocalAccount).mockResolvedValue(account);
    await expect(store.getState().saveAndApplySession(credentials)).rejects.toThrow();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  },
);

it('복원 중 로그인 저장이 실패하면 완료된 복원 상태를 유지한다', async () => {
  const read = deferred<string | null>();
  jest.mocked(SecureStore.getItemAsync).mockReturnValueOnce(read.promise);
  const restore = store.getState().restoreSessionOnce();
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('save failed'));
  const login = store
    .getState()
    .saveAndApplySession(credentials)
    .catch((error: Error) => error);
  read.resolve(JSON.stringify({ version: 1, ...credentials, userInfo: null }));
  await restore;
  expect(await login).toMatchObject({ message: 'save failed' });
  expect(store.getState()).toMatchObject({ status: 'signed-in', userId: credentials.userId });
});
