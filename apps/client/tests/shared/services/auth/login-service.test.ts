import { beforeEach, expect, it, jest } from '@jest/globals';
import { completeLogin } from '@/shared/services/auth/login-service';
import { inspectLocalAccount } from '@/shared/services/auth/local-account';
import { useAuthStore } from '@/shared/store/auth';
import { queryClient } from '@/shared/lib/queryClient';
import { revokeRefreshToken } from '@/shared/services/auth/auth-api';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/services/auth/local-account', () => ({ inspectLocalAccount: jest.fn() }));
jest.mock('@/shared/services/auth/auth-api', () => ({ revokeRefreshToken: jest.fn() }));
jest.mock('@/shared/services/sync/lifecycle', () => ({ withSyncPaused: (action: () => Promise<void>) => action() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({
  withPendingCleanupsPaused: (action: () => Promise<void>) => action(),
}));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { clear: jest.fn(), cancelQueries: jest.fn(), invalidateQueries: jest.fn() },
}));
const login = { userId: 'new-user', accessToken: 'access', refreshToken: 'refresh' };

beforeEach(() => {
  useAuthStore.setState({ status: 'restore-failed', userId: null });
  jest.mocked(inspectLocalAccount).mockReset().mockResolvedValue('empty');
  jest.mocked(queryClient.invalidateQueries).mockReset().mockResolvedValue(undefined);
  jest.mocked(revokeRefreshToken).mockReset().mockResolvedValue(undefined);
  jest.mocked(SecureStore.setItemAsync).mockReset().mockResolvedValue(undefined);
});

it('복원된 계정이 없어도 실제 DB·큐가 다른 계정이면 데이터 보존 상태로 거절한다', async () => {
  jest.mocked(inspectLocalAccount).mockResolvedValue('different');
  await expect(completeLogin(login)).rejects.toThrow('같은 계정');
  expect(inspectLocalAccount).toHaveBeenCalledWith('new-user');
  expect(revokeRefreshToken).toHaveBeenCalledWith('refresh');
  expect(useAuthStore.getState().userId).toBeNull();
});

it('같은 계정 재로그인은 세션 저장 뒤 조회를 갱신한다', async () => {
  jest.mocked(inspectLocalAccount).mockResolvedValue('same');
  await completeLogin(login);
  expect(useAuthStore.getState()).toMatchObject({ status: 'signed-in', userId: 'new-user' });
  expect(queryClient.invalidateQueries).toHaveBeenCalled();
});

it('조회 갱신 실패는 저장이 끝난 로그인을 실패로 되돌리지 않는다', async () => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.mocked(inspectLocalAccount).mockResolvedValue('same');
  jest.mocked(queryClient.invalidateQueries).mockRejectedValueOnce(new Error('refresh failed'));
  await expect(completeLogin(login)).resolves.toBeUndefined();
  expect(useAuthStore.getState()).toMatchObject({ status: 'signed-in', userId: 'new-user' });
  expect(errorLog).toHaveBeenCalledWith('[Auth] query refresh after login failed', expect.any(Error));
  errorLog.mockRestore();
});

it('소유자를 확인할 수 없는 큐는 다른 계정으로 단정해 폐기하지 않는다', async () => {
  jest.mocked(inspectLocalAccount).mockResolvedValue('unresolved');
  await expect(completeLogin(login)).rejects.toThrow('소유자');
  expect(useAuthStore.getState().userId).toBeNull();
  expect(revokeRefreshToken).toHaveBeenCalledWith('refresh');
});

it('서버 로그인 뒤 기기 저장이 실패하면 발급된 refresh token을 폐기한다', async () => {
  jest.mocked(inspectLocalAccount).mockResolvedValue('same');
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('secure store locked'));
  await expect(completeLogin(login)).rejects.toThrow('secure store locked');
  expect(revokeRefreshToken).toHaveBeenCalledWith('refresh');
});

it('메모리에 남은 계정과 다른 서버 로그인도 로컬 데이터와 세션을 유지한다', async () => {
  useAuthStore.setState({ status: 'reauth-required', userId: 'old-user' });
  jest.mocked(inspectLocalAccount).mockResolvedValue('empty');
  await expect(completeLogin(login)).rejects.toThrow('로그아웃');
  expect(useAuthStore.getState()).toMatchObject({ status: 'reauth-required', userId: 'old-user' });
  expect(revokeRefreshToken).toHaveBeenCalledWith('refresh');
});
