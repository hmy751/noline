import { expect, it, jest } from '@jest/globals';
import { pushChanges } from '@/shared/services/sync/engine';
import { getSyncableTasks, updateTaskStatus } from '@/shared/services/sync/queue';
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

it.each([
  { name: '다른 계정', owner: 'b' },
  { name: '확인 불가', owner: null },
])('큐 소유자가 $name이면 현재 계정으로 전송하지 않는다', async ({ owner }) => {
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  useAuthStore.setState({ status: 'signed-in', userId: 'a' });
  jest.mocked(getSyncableTasks).mockResolvedValue([
    {
      id: 'q',
      tableName: 'trips',
      recordId: 't',
      action: 'UPDATE',
      payload: '{}',
      status: 'PENDING',
      retryCount: 0,
      createdAt: 'now',
      updatedAt: null,
    },
  ]);
  jest.mocked(getQueueOwner).mockResolvedValue(owner);
  await expect(pushChanges()).rejects.toThrow();
  expect(api.put).not.toHaveBeenCalled();
  expect(updateTaskStatus).not.toHaveBeenCalled();
  expect(errorLog).toHaveBeenCalledWith('[Sync] Push failed:', expect.any(Error));
  errorLog.mockRestore();
});
