import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import * as auth from '@/shared/store/auth';
import { inspectLocalAccount } from '@/shared/services/auth/local-account';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn() }));
let store: ReturnType<typeof auth.createAuthStore>;

beforeEach(() => {
  store = auth.createAuthStore();
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue(
      JSON.stringify({ version: 1, userId: 'a', accessToken: 'a', refreshToken: 'r', userInfo: null }),
    );
  jest.mocked(inspectLocalAccount).mockReset().mockResolvedValue('same');
});
afterEach(() => {
  jest.restoreAllMocks();
});

it.each(['different', 'unresolved'] as const)(
  '로컬 계정 검사가 %s이면 저장값 삭제 없이 restore-failed다',
  async (result) => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(inspectLocalAccount).mockResolvedValue(result);
    await store.getState().restoreSessionOnce();
    expect(store.getState()).toMatchObject({ status: 'restore-failed', userId: null });
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith('[Auth] session restore failed', expect.any(Error));
  },
);

it('DB 소유자 검사 실패를 마친 뒤 대기하던 로그인도 필수 계정 검사를 거쳐 적용한다', async () => {
  let finish!: (value: 'different') => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  jest.mocked(inspectLocalAccount).mockImplementationOnce(() => {
    started();
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const restore = store.getState().restoreSessionOnce();
  await ready;
  expect(store.getState()).toMatchObject({ status: 'initializing', userId: null });
  const login = store.getState().saveAndApplySession({ userId: 'b', accessToken: 'b', refreshToken: 'r' });
  finish('different');
  await Promise.all([restore, login]);
  expect(store.getState()).toMatchObject({ status: 'signed-in', userId: 'b' });
});
