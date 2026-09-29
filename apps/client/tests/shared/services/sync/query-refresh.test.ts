import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { pushChanges, syncData, SyncIncompleteError } from '@/shared/services/sync/engine';
import { getSyncableTasks, getSyncQueueStats, deleteTask } from '@/shared/services/sync/queue';
import api from '@/shared/services/sync/api';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
jest.mock('@/shared/services/sync/queue', () => ({
  getSyncableTasks: jest.fn(),
  getSyncQueueStats: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
  retryFailedTask: jest.fn(),
}));
jest.mock('@/shared/services/auth/local-account', () => ({ getQueueOwner: async () => 'a' }));
jest.mock('@/shared/services/sync/storage', () => ({ getLastSyncedAt: async () => null, setLastSyncedAt: jest.fn() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({ processPendingCleanups: async () => 0 }));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/db', () => ({
  tripActivations: { isActivated: 'active', userId: 'user', tripId: 'trip' },
  getDatabase: () => ({ select: () => ({ from: () => ({ where: async () => mockActivatedTrips }) }) }),
}));
jest.mock('@/shared/lib/queryClient', () => ({
  get queryClient() {
    return mockClient;
  },
}));

let mockClient: QueryClient;
let mockActivatedTrips: { tripId: string }[];
const subscriptions: (() => void)[] = [];
const key = ['schedule', 'list', 'inactive-trip'];
const task = {
  id: 'task',
  tableName: 'schedules',
  recordId: 'schedule',
  action: 'UPDATE',
  payload: '{}',
  status: 'PENDING',
  retryCount: 0,
  createdAt: '2026-09-29T00:00:00Z',
  updatedAt: null,
} as const;

function deferred() {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function observe(queryFn: () => Promise<string>, queryKey = key) {
  const observer = new QueryObserver(mockClient, { queryKey, queryFn, staleTime: 5 * 60 * 1000 });
  subscriptions.push(observer.subscribe(() => undefined));
  return observer;
}

beforeEach(() => {
  mockClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnReconnect: false } } });
  mockActivatedTrips = [];
  useAuthStore.setState({ status: 'signed-in', userId: 'a', sessionId: Symbol('session') });
  jest.mocked(getSyncableTasks).mockReset().mockResolvedValue([task]);
  jest.mocked(getSyncQueueStats).mockReset().mockResolvedValue({ pending: 0, inProgress: 0, failed: 0, total: 0 });
  jest.mocked(deleteTask).mockReset().mockResolvedValue(undefined);
  jest.mocked(api.put).mockReset().mockResolvedValue({});
  jest.mocked(api.get).mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
  await mockClient.cancelQueries();
  mockClient.clear();
  jest.restoreAllMocks();
});

it.each([false, true])('push 뒤 pull이 생략돼도 이전 GET를 버리고 변경을 읽는다 (캐시: %s)', async (cached) => {
  const oldRead = deferred();
  let serverValue = '이전 서버 값';
  const read = jest
    .fn<() => Promise<string>>()
    .mockImplementationOnce(() => oldRead.promise)
    .mockImplementation(async () => serverValue);
  if (cached) mockClient.setQueryData(key, '캐시', { updatedAt: Date.now() - 6 * 60 * 1000 });
  observe(read);
  jest.mocked(api.put).mockImplementationOnce(async () => {
    serverValue = 'push 이후 값';
    return {} as never;
  });
  await syncData();
  expect(api.get).not.toHaveBeenCalled();
  expect(mockClient.getQueryData(key)).toBe('push 이후 값');
  oldRead.resolve('push 이전 늦은 값');
  await oldRead.promise;
  expect(mockClient.getQueryData(key)).toBe('push 이후 값');
});

it('push 일부 성공 뒤 다음 전송이 실패해도 성공한 변경을 갱신한다', async () => {
  mockClient.setQueryData(key, '이전 값');
  observe(async () => '첫 전송 이후 값');
  jest.mocked(getSyncableTasks).mockResolvedValue([task, { ...task, id: 'second', recordId: 'second' }]);
  jest.mocked(api.put).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('failed'));
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, inProgress: 0, failed: 1, total: 1 });
  await expect(syncData()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(mockClient.getQueryData(key)).toBe('첫 전송 이후 값');
  expect(api.get).not.toHaveBeenCalled();
});

it('서버 쓰기 뒤 큐 삭제가 실패해도 서버 변경을 다시 읽는다', async () => {
  mockClient.setQueryData(key, '이전 값');
  observe(async () => '서버에 반영된 값');
  jest.mocked(deleteTask).mockRejectedValueOnce(new Error('local queue failed'));
  jest.mocked(getSyncQueueStats).mockResolvedValue({ pending: 0, inProgress: 0, failed: 1, total: 1 });
  await expect(pushChanges()).rejects.toBeInstanceOf(SyncIncompleteError);
  expect(mockClient.getQueryData(key)).toBe('서버에 반영된 값');
});

it('push 뒤 pull 실패가 앞서 성공한 변경의 갱신을 막지 않는다', async () => {
  mockActivatedTrips = [{ tripId: 'active-trip' }];
  mockClient.setQueryData(key, '이전 값');
  observe(async () => 'push 이후 값');
  jest.mocked(api.get).mockRejectedValueOnce(new Error('pull failed'));
  await expect(syncData()).rejects.toThrow('pull failed');
  expect(mockClient.getQueryData(key)).toBe('push 이후 값');
});

it('갱신 GET가 끝나지 않아도 sync는 완료된다', async () => {
  mockClient.setQueryData(key, '기존 내용');
  const read = deferred();
  observe(() => read.promise);
  await syncData();
  expect(mockClient.getQueryState(key)?.fetchStatus).toBe('fetching');
  expect(mockClient.getQueryData(key)).toBe('기존 내용');
  read.resolve('갱신된 내용');
  await read.promise;
});

it('push 쓰기가 없고 pull도 생략되면 유효한 캐시를 불필요하게 갱신하지 않는다', async () => {
  jest.mocked(getSyncableTasks).mockResolvedValue([]);
  mockClient.setQueryData(key, '유효한 캐시');
  const read = jest.fn<() => Promise<string>>();
  observe(read);
  await syncData();
  expect(read).not.toHaveBeenCalled();
  expect(mockClient.getQueryState(key)?.isInvalidated).toBe(false);
});

it('활성 구독이 없으면 캐시를 무효화만 하고 나중 구독할 때 변경을 읽는다', async () => {
  mockClient.setQueryData(key, '이전 값');
  await syncData();
  expect(mockClient.getQueryState(key)?.isInvalidated).toBe(true);
  const observer = observe(async () => '새 값');
  await observer.refetch();
  expect(mockClient.getQueryData(key)).toBe('새 값');
});
