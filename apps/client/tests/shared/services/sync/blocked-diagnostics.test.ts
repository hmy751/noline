import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { authAxios } from '@/shared/api/axios-instances';
import { reportSyncSignal } from '@/shared/diagnostics/sentry';
import { useAuthStore } from '@/shared/store/auth';
import api from '@/shared/services/sync/api';
import { pushChanges, SyncIncompleteError } from '@/shared/services/sync/engine';
import { deleteTask, getSyncableTasks, getSyncQueueStats, updateTaskStatus } from '@/shared/services/sync/queue';
import { queryClient } from '@/shared/lib/queryClient';

jest.mock('expo-secure-store', () => ({ setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@/shared/diagnostics/sentry', () => ({ reportSyncSignal: jest.fn() }));
jest.mock('@/shared/services/auth/local-account', () => ({
  inspectLocalAccount: jest.fn(async () => 'empty'),
  getQueueOwner: jest.fn(async () => 'a'),
}));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncableTasks: jest.fn(),
  recoverInterruptedTasks: jest.fn(),
  getSyncQueueStats: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
  retryFailedTask: jest.fn(),
}));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { cancelQueries: jest.fn(async () => undefined), invalidateQueries: jest.fn(async () => undefined) },
}));

const task = {
  id: 't',
  tableName: 'trips',
  recordId: 'trip',
  action: 'UPDATE',
  payload: '{}',
  status: 'PENDING',
  retryCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
};
const originalSyncAdapter = api.defaults.adapter;
const originalAuthAdapter = authAxios.defaults.adapter;

beforeEach(async () => {
  await useAuthStore.getState().saveAndApplySession({ userId: 'a', accessToken: 'a-token', refreshToken: 'r' });
  jest.mocked(getSyncableTasks).mockResolvedValue([task]);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, failed: 1, inProgress: 0, quarantined: 0, total: 1 });
});

afterEach(() => {
  jest.restoreAllMocks();
  api.defaults.adapter = originalSyncAdapter;
  authAxios.defaults.adapter = originalAuthAdapter;
});

function rejectHttp(config: InternalAxiosRequestConfig, status: number) {
  return new AxiosError(
    'request failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    { status, statusText: '', headers: {}, data: {}, config },
  );
}

it.each([
  { afterUnauthorized: false, refreshStatus: 500 },
  { afterUnauthorized: false, refreshStatus: undefined },
  { afterUnauthorized: true, refreshStatus: 500 },
])(
  '토큰 교환 실패는 여행 서버 거절·여행 요청 재시도로 집계하지 않는다: %j',
  async ({ afterUnauthorized, refreshStatus }) => {
    if (!afterUnauthorized) {
      jest.spyOn(useAuthStore, 'getAccessToken').mockReturnValueOnce(null);
    }

    const sendTrip = jest.fn<AxiosAdapter>(async (config) => {
      throw rejectHttp(config, 401);
    });
    const refresh = jest.fn<AxiosAdapter>(async (config) => {
      if (refreshStatus) {
        throw rejectHttp(config, refreshStatus);
      }
      throw new AxiosError('offline', 'ERR_NETWORK', config);
    });
    api.defaults.adapter = sendTrip;
    authAxios.defaults.adapter = refresh;

    await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);

    expect(sendTrip).toHaveBeenCalledTimes(afterUnauthorized ? 1 : 0);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reportSyncSignal).toHaveBeenCalledTimes(1);
    expect(reportSyncSignal).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'sync.push.blocked',
        stage: 'auth-refresh-failed',
        httpStatus: refreshStatus,
      }),
      undefined,
    );
    expect(updateTaskStatus).toHaveBeenCalledWith('t', 'FAILED', 1);
    expect(deleteTask).not.toHaveBeenCalled();
  },
);

it('여행 수정 자체의 404는 엔티티 요청 거절로 기록한다', async () => {
  const refresh = jest.fn<AxiosAdapter>();
  api.defaults.adapter = async (config) => {
    throw rejectHttp(config, 404);
  };
  authAxios.defaults.adapter = refresh;

  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);

  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({ stage: 'server-rejected', httpStatus: 404 }),
    undefined,
  );
  expect(refresh).not.toHaveBeenCalled();
});

it('서버 반영과 큐 삭제 뒤 캐시 갱신에 실패하면 응답 뒤의 로컬 실패로 남긴다', async () => {
  api.defaults.adapter = async (config) => ({ status: 200, statusText: 'OK', data: {}, headers: {}, config });
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, failed: 0, inProgress: 0, quarantined: 0, total: 0 });
  const cacheError = new Error('query cancellation failed');
  jest.mocked(queryClient.cancelQueries).mockRejectedValueOnce(cacheError);

  await expect(pushChanges()).rejects.toBe(cacheError);

  expect(deleteTask).toHaveBeenCalledWith('t');
  expect(reportSyncSignal).toHaveBeenCalledTimes(1);
  expect(reportSyncSignal).toHaveBeenCalledWith(expect.objectContaining({ stage: 'local-after-response' }), undefined);
});
