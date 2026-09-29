import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { useActivateTrip } from '@/entities/trip/data/useActivateTrip';
import { useDeactivateTrip } from '@/entities/trip/data/useDeactivateTrip';

// DB 전환 성공 이후의 실제 onSuccess를 검사한다. Native DB transaction은 이 검사의 범위가 아니다.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual<object>('@tanstack/react-query'),
  useQueryClient: () => mockClient,
  useMutation: (options: unknown) => options,
}));
jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/db', () => ({}));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/api/fetcher', () => ({}));
jest.mock('@/shared/services/offline-map', () => ({}));
jest.mock('@/shared/services/offline-map/download', () => ({}));
jest.mock('@/shared/services/directions/route-downloader', () => ({}));
jest.mock('@/shared/services/id/ulid', () => ({}));
jest.mock('@/shared/services/sync/queue', () => ({}));

let mockClient: QueryClient;
const subscriptions: (() => void)[] = [];

beforeEach(() => {
  mockClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(async () => {
  subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
  await mockClient.cancelQueries();
  mockClient.clear();
  jest.restoreAllMocks();
});

it.each([
  {
    name: '활성화 뒤 일정',
    hook: useActivateTrip,
    key: ['schedule', 'list', 'trip'],
    newValue: 'Local',
    data: { tripId: 'trip', alreadyActivated: false },
  },
  {
    name: '활성화 뒤 경비',
    hook: useActivateTrip,
    key: ['expense', 'trip', 'trip'],
    newValue: 'Local',
    data: { tripId: 'trip', alreadyActivated: false },
  },
  {
    name: '비활성화 뒤 일정',
    hook: useDeactivateTrip,
    key: ['schedule', 'list', 'trip'],
    newValue: 'Remote',
    data: { tripId: 'trip', alreadyDeactivated: false },
  },
  {
    name: '비활성화 뒤 경비',
    hook: useDeactivateTrip,
    key: ['expense', 'trip', 'trip'],
    newValue: 'Remote',
    data: { tripId: 'trip', alreadyDeactivated: false },
  },
])(
  '$name 뒤 캐시 없는 첫 조회가 늦게 끝나도 이전 데이터 출처의 결과를 채택하지 않는다',
  async ({ hook, key, newValue, data }) => {
    let finishOld!: (value: string) => void;
    const oldRequest = new Promise<string>((resolve) => {
      finishOld = resolve;
    });
    const read = jest.fn<() => Promise<string>>().mockReturnValueOnce(oldRequest).mockResolvedValue(newValue);
    const observer = new QueryObserver(mockClient, { queryKey: key, queryFn: read });
    subscriptions.push(observer.subscribe(() => undefined));
    const mutation = hook() as unknown as { onSuccess: (result: typeof data) => Promise<void> };
    await mutation.onSuccess(data);
    // 이미 시작한 전환 후 GET를 기다린다. 테스트가 추가 invalidate/refetch를 만들지 않는다.
    await mockClient.getQueryCache().find({ queryKey: key, exact: true })?.promise;
    expect(mockClient.getQueryData(key)).toBe(newValue);
    finishOld('전환 이전 값');
    await oldRequest;
    expect(mockClient.getQueryData(key)).toBe(newValue);
  },
);
