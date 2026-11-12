import { updateExpenseRequest } from '@repo/schema/requests/expense';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { reportSyncSignal } from '@/shared/diagnostics/sentry';
import { pushChanges, SyncIncompleteError } from '@/shared/services/sync/engine';
import {
  getSyncableTasks,
  getSyncQueueStats,
  updateTaskStatus,
  recoverInterruptedTasks,
} from '@/shared/services/sync/queue';
import { getQueueOwner } from '@/shared/services/auth/local-account';
import api from '@/shared/services/sync/api';
import { useAuthStore } from '@/shared/store/auth';
import { reconcileServerRecord } from '@/shared/services/sync/reconcile';

jest.mock('@/shared/diagnostics/sentry', () => ({ reportSyncSignal: jest.fn() }));
jest.mock('@/shared/services/sync/reconcile', () => ({
  reconcileServerRecord: jest.fn<() => Promise<void>>(),
}));
jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncableTasks: jest.fn(),
  getTaskById: jest.fn(async () => ({ id: 'existing' })),
  getSyncQueueStats: jest.fn(),
  updateTaskStatus: jest.fn(),
  retryFailedTask: jest.fn(),
  recoverInterruptedTasks: jest.fn(),
}));
jest.mock('@/shared/services/auth/local-account', () => ({ getQueueOwner: jest.fn() }));
jest.mock('@/shared/db', () => ({}));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/lib/queryClient', () => ({
  queryClient: { cancelQueries: jest.fn(async () => undefined), invalidateQueries: jest.fn(async () => undefined) },
}));
jest.mock('@/shared/services/sync/storage', () => ({}));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: jest.fn() }));
jest.mock('expo-secure-store', () => ({}));

const failedTask = {
  id: 'failed-1',
  tableName: 'trips',
  recordId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  action: 'UPDATE',
  payload: '{}',
  status: 'FAILED',
  retryCount: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
} as const;

beforeEach(() => {
  useAuthStore.setState({ status: 'signed-in', userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ' });
  jest.mocked(getSyncableTasks).mockReset().mockResolvedValue([failedTask]);
  jest
    .mocked(getSyncQueueStats)
    .mockReset()
    .mockResolvedValue({ pending: 0, inProgress: 0, failed: 0, quarantined: 0, total: 0 });
  jest.mocked(getQueueOwner).mockReset().mockResolvedValue('01ARZ3NDEKTSV4RRFFQ69G5FAZ');
  jest.mocked(updateTaskStatus).mockReset().mockResolvedValue(undefined);
  jest.mocked(reconcileServerRecord).mockReset().mockResolvedValue(undefined);
  jest.mocked(recoverInterruptedTasks).mockReset().mockResolvedValue(undefined);
  jest
    .mocked(api.put)
    .mockReset()
    .mockResolvedValue({ data: { success: true, data: mockServerRow } });
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
  expect(reconcileServerRecord).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 'failed-1');
});

it('전송할 작업을 고르기 전에 중단된 IN_PROGRESS부터 되돌린다', async () => {
  await pushChanges();
  expect(jest.mocked(recoverInterruptedTasks).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(getSyncableTasks).mock.invocationCallOrder[0],
  );
});

it('실패 횟수가 많이 쌓인 FAILED도 다시 전송하고 횟수를 계속 센다', async () => {
  jest.mocked(getSyncableTasks).mockResolvedValue([{ ...failedTask, retryCount: 7 }]);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, inProgress: 0, failed: 1, quarantined: 0, total: 1 });
  jest.mocked(api.put).mockRejectedValueOnce(new Error('timeout'));

  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(updateTaskStatus).toHaveBeenLastCalledWith('failed-1', 'FAILED', 8);
});

it('재시도 실패를 다시 FAILED로 남기고 뒤 작업을 진행하지 않은 채 실패를 보고한다', async () => {
  const laterTask = { ...failedTask, id: 'later', recordId: 'trip-2', status: 'PENDING', retryCount: 0 } as const;
  jest.mocked(getSyncableTasks).mockResolvedValue([failedTask, laterTask]);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 1, inProgress: 0, failed: 1, quarantined: 0, total: 2 });
  jest.mocked(api.put).mockRejectedValueOnce(new Error('server unavailable'));

  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(updateTaskStatus).toHaveBeenNthCalledWith(1, 'failed-1', 'IN_PROGRESS');
  expect(updateTaskStatus).toHaveBeenNthCalledWith(2, 'failed-1', 'FAILED', 2);
  expect(api.put).toHaveBeenCalledTimes(1);
});

it('기존 경비 UPDATE 큐의 datetime은 그대로 전송해도 서버 공유 요청 계약에서 수용된다', async () => {
  const payload = { date: '2026-10-02T01:00:00+09:00', scheduleId: null };
  jest.mocked(getSyncableTasks).mockResolvedValue([
    {
      ...failedTask,
      tableName: 'expenses',
      recordId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
      payload: JSON.stringify(payload),
    },
  ]);
  jest.mocked(api.put).mockResolvedValue({
    data: {
      success: true,
      data: {
        ...mockServerRow,
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
        tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        scheduleId: null,
        title: '식사',
        amount: '30',
        currency: 'USD',
        category: 'food',
        date: '2026-10-01',
        hasReceipt: false,
        receiptUrl: null,
      },
    },
  });
  await expect(pushChanges()).resolves.toBeUndefined();
  expect(api.put).toHaveBeenCalledWith('/api/expenses/01ARZ3NDEKTSV4RRFFQ69G5FAX', payload);
  expect(updateExpenseRequest.parse(jest.mocked(api.put).mock.calls[0][1])).toEqual({
    date: '2026-10-01',
    scheduleId: null,
  });
  expect(reconcileServerRecord).toHaveBeenCalledWith(expect.any(String), expect.any(Object), 'failed-1');
});

it.each([
  { payload: '{broken', response: undefined, expectedStage: 'local-before-send' },
  { payload: '{}', response: { status: 404 }, expectedStage: 'server-rejected' },
])('요청 단계별 진단을 한 번 남긴다: $expectedStage', async ({ payload, response, expectedStage }) => {
  jest.mocked(getSyncableTasks).mockResolvedValue([{ ...failedTask, payload }]);
  jest.mocked(getSyncQueueStats).mockResolvedValue({ failed: 1, inProgress: 0, pending: 0, quarantined: 0, total: 1 });
  if (response) {
    jest.mocked(api.put).mockRejectedValueOnce({ isAxiosError: true, response });
  }
  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(reportSyncSignal).toHaveBeenCalledTimes(1);
  expect(reportSyncSignal).toHaveBeenCalledWith(
    expect.objectContaining({
      stage: expectedStage,
      hasWaiting: false,
      ...(response && { httpStatus: response.status }),
    }),
    undefined,
  );
});

const mockServerRow = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  userId: '01ARZ3NDEKTSV4RRFFQ69G5FAZ',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
  version: 1,
  latitude: null,
  longitude: null,
  name: '여행',
  destination: '서울',
  country: null,
  baseCurrency: 'USD',
  cityId: null,
  timeZone: null,
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-03T00:00:00Z',
};
