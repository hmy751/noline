import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { pushChanges, SyncIncompleteError } from '@/shared/services/sync/engine';
import { getSyncableTasks, getSyncQueueStats, updateTaskStatus, deleteTask } from '@/shared/services/sync/queue';
import { getQueueOwner } from '@/shared/services/auth/local-account';
import api from '@/shared/services/sync/api';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncableTasks: jest.fn(),
  getSyncQueueStats: jest.fn(),
  updateTaskStatus: jest.fn(),
  retryFailedTask: jest.fn(),
  deleteTask: jest.fn(),
}));
jest.mock('@/shared/services/auth/local-account', () => ({ getQueueOwner: jest.fn() }));
jest.mock('@/shared/db', () => ({}));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/lib/queryClient', () => ({}));
jest.mock('@/shared/services/sync/storage', () => ({}));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('@/shared/services/auth/auth-interceptor', () => ({ AuthRequiredError: class extends Error {} }));
jest.mock('expo-secure-store', () => ({}));

const failedTask = {
  id: 'failed-1',
  tableName: 'trips',
  recordId: 'trip-1',
  action: 'UPDATE',
  payload: '{}',
  status: 'FAILED',
  retryCount: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
} as const;

beforeEach(() => {
  useAuthStore.setState({ status: 'signed-in', userId: 'user-1' });
  jest.mocked(getSyncableTasks).mockReset().mockResolvedValue([failedTask]);
  jest.mocked(getSyncQueueStats).mockReset().mockResolvedValue({ pending: 0, inProgress: 0, failed: 0, total: 0 });
  jest.mocked(getQueueOwner).mockReset().mockResolvedValue('user-1');
  jest.mocked(updateTaskStatus).mockReset().mockResolvedValue(undefined);
  jest.mocked(deleteTask).mockReset().mockResolvedValue(undefined);
  jest.mocked(api.put).mockReset().mockResolvedValue({});
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('이전 FAILED 작업을 다음 sync에서 다시 전송하고 성공하면 제거한다', async () => {
  await expect(pushChanges()).resolves.toBeUndefined();
  expect(updateTaskStatus).toHaveBeenCalledWith('failed-1', 'IN_PROGRESS');
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(deleteTask).toHaveBeenCalledWith('failed-1');
});

it('재시도 실패를 다시 FAILED로 남기고 뒤 작업을 진행하지 않은 채 실패를 보고한다', async () => {
  const laterTask = { ...failedTask, id: 'later', recordId: 'trip-2', status: 'PENDING', retryCount: 0 } as const;
  jest.mocked(getSyncableTasks).mockResolvedValue([failedTask, laterTask]);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 1, inProgress: 0, failed: 1, total: 2 });
  jest.mocked(api.put).mockRejectedValueOnce(new Error('server unavailable'));

  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(updateTaskStatus).toHaveBeenNthCalledWith(1, 'failed-1', 'IN_PROGRESS');
  expect(updateTaskStatus).toHaveBeenNthCalledWith(2, 'failed-1', 'FAILED', 2);
  expect(api.put).toHaveBeenCalledTimes(1);
});
