import { expect, it, jest } from '@jest/globals';
import { executeSync } from '@/shared/services/sync/lifecycle';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';
import { AuthRequiredError } from '@/shared/store/auth';
import api from '@/shared/services/sync/api';
import { retryFailedTask } from '@/shared/services/sync/queue';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('@/shared/services/sync/api', () => ({ __esModule: true, default: { put: jest.fn(), get: jest.fn() } }));
jest.mock('@/shared/services/auth/local-account', () => ({ getQueueOwner: jest.fn(async () => 'a') }));
jest.mock('@/shared/services/sync/storage', () => ({ getLastSyncedAt: jest.fn(async () => null) }));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/db', () => ({
  isDatabaseReady: () => true,
  tripActivations: { isActivated: 'active', userId: 'user', tripId: 'trip' },
  getDatabase: () => ({ select: () => ({ from: () => ({ where: async () => [] }) }) }),
}));
jest.mock('@/shared/lib/queryClient', () => ({ queryClient: {} }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncableTasks: jest.fn(async () => [
    {
      id: 'task',
      tableName: 'trips',
      recordId: 'trip-a',
      action: 'UPDATE',
      payload: '{}',
      status: 'PENDING',
      retryCount: 0,
    },
  ]),
  getSyncQueueStats: jest.fn(async () => ({ pending: 1, inProgress: 0, failed: 0, total: 1 })),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
  retryFailedTask: jest.fn(),
}));

it('push가 인증 거부로 PENDING을 남겼으면 활성 여행이 없어도 sync 완료로 알리지 않는다', async () => {
  useAuthStore.setState({ status: 'signed-in', userId: 'a' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  jest.mocked(api.put).mockImplementationOnce(async () => {
    useAuthStore.setState({ status: 'reauth-required' });
    throw new AuthRequiredError();
  });
  const result = await executeSync('manual');
  expect(retryFailedTask).toHaveBeenCalledWith('task');
  expect(result.status).not.toBe('completed');
});
