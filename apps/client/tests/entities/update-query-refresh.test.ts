/** @jest-environment node */
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query';

import { useCreateExpense } from '@/entities/expense/data/useCreateExpense';
import { useDeleteExpense } from '@/entities/expense/data/useDeleteExpense';
import { useCreateSchedule } from '@/entities/schedule/data/useCreateSchedule';
import { useDeleteSchedule } from '@/entities/schedule/data/useDeleteSchedule';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { useUpdateSchedule } from '@/entities/schedule/data/useUpdateSchedule';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual<object>('@tanstack/react-query'),
  useQueryClient: () => mockClient,
  useMutation: (options: unknown) => options,
}));
jest.mock('@/entities/expense/repository/expense-repository', () => ({ ExpenseRepository: {} }));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({ ScheduleRepository: {} }));

let mockClient: QueryClient;
let unsubscribe: () => void;
let additionalUnsubscribes: (() => void)[];

beforeEach(() => {
  additionalUnsubscribes = [];
  mockClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 300000 } } });
});

afterEach(async () => {
  unsubscribe?.();
  additionalUnsubscribes.forEach((stop) => stop());
  await mockClient.cancelQueries();
  mockClient.clear();
  jest.restoreAllMocks();
});

it.each([
  ['expense', false],
  ['expense', true],
  ['schedule', false],
  ['schedule', true],
])('%s 저장 실패 여부 %s 에도 늦은 첫 조회 대신 새 조회를 반영한다', async (entity, failed) => {
  const key = entity === 'expense' ? ['expense', 'trip', 'trip'] : ['schedule', 'detail', 'item'];
  let finishOld!: (value: string) => void;
  let finishNew!: (value: string) => void;
  const read = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finishOld = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          finishNew = resolve;
        }),
    );
  const observer = new QueryObserver(mockClient, { queryKey: key, queryFn: read });
  unsubscribe = observer.subscribe(() => undefined);
  expect(read).toHaveBeenCalledTimes(1);
  const options = (entity === 'expense' ? useUpdateExpense() : useUpdateSchedule()) as unknown as {
    onSettled: (saved: unknown) => Promise<void>;
  };
  const invalidate = jest.spyOn(mockClient, 'invalidateQueries');

  // 새 조회는 지연된 채여도 저장 후처리는 완료된다.
  await options.onSettled(failed ? undefined : { id: 'item' });
  expect(read).toHaveBeenCalledTimes(2);
  expect(invalidate.mock.calls.some(([filters]) => filters?.queryKey?.[0] === 'routes')).toBe(
    entity === 'schedule' && !failed,
  );
  finishOld('pre-save value');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mockClient.getQueryData(key)).toBeUndefined();
  finishNew('saved value');
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mockClient.getQueryData(key)).toBe('saved value');
});

it('새 조회 실패가 저장 후처리의 성공을 실패로 바꾸지 않는다', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const observer = new QueryObserver(mockClient, {
    queryKey: ['expense', 'trip', 'trip'],
    queryFn: () => Promise.reject(new Error('read unavailable')),
  });
  unsubscribe = observer.subscribe(() => undefined);
  const options = useUpdateExpense() as unknown as { onSettled: () => Promise<void> };
  await expect(options.onSettled()).resolves.toBeUndefined();
});

const successCases = [
  {
    name: 'expense create',
    hook: useCreateExpense,
    keys: [
      ['expense', 'all'],
      ['expense', 'trip', 'trip'],
      ['expense', 'schedule', 'item'],
    ],
  },
  { name: 'expense delete', hook: useDeleteExpense, keys: [['expense', 'trip', 'trip']] },
  {
    name: 'schedule create',
    hook: useCreateSchedule,
    keys: [
      ['schedule', 'list', 'trip'],
      ['schedule', 'count', 'trip'],
      ['routes', 'trip', 'trip'],
    ],
  },
  {
    name: 'schedule delete',
    hook: useDeleteSchedule,
    keys: [
      ['schedule', 'detail', 'item'],
      ['routes', 'trip', 'trip'],
      ['expense', 'schedule', 'item'],
    ],
  },
];

it.each(successCases)('$name 성공 뒤 늦은 첫 조회를 버리고 영향받는 데이터를 다시 조회한다', async ({ hook, keys }) => {
  const reads = keys.map((key) => {
    let finishOld!: (value: string) => void;
    let finishNew!: (value: string) => void;
    const read = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            finishOld = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            finishNew = resolve;
          }),
      );
    const observer = new QueryObserver(mockClient, { queryKey: key, queryFn: read });
    additionalUnsubscribes.push(observer.subscribe(() => undefined));
    return { key, read, finishOld, finishNew: (value: string) => finishNew(value) };
  });
  const options = hook() as unknown as {
    onSuccess: (saved: unknown, variables: unknown) => Promise<void>;
  };

  await options.onSuccess({ id: 'item' }, { id: 'item', tripId: 'trip', scheduleId: 'item' });
  for (const { read, finishOld } of reads) {
    expect(read).toHaveBeenCalledTimes(2);
    finishOld('pre-save value');
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (const { key, finishNew } of reads) {
    expect(mockClient.getQueryData(key)).toBeUndefined();
    finishNew('saved value');
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (const { key } of reads) {
    expect(mockClient.getQueryData(key)).toBe('saved value');
  }
});

it.each(successCases)('$name 새 조회 실패가 저장 성공을 실패로 바꾸지 않는다', async ({ hook, keys }) => {
  let failRefresh!: (error: Error) => void;
  const read = jest
    .fn()
    .mockImplementationOnce(() => new Promise<string>(() => undefined))
    .mockImplementationOnce(
      () =>
        new Promise<string>((_, reject) => {
          failRefresh = reject;
        }),
    );
  const observer = new QueryObserver(mockClient, { queryKey: keys[0], queryFn: read });
  unsubscribe = observer.subscribe(() => undefined);
  const options = hook() as unknown as {
    onSuccess: (saved: unknown, variables: unknown) => Promise<void>;
  };
  const mutation = new MutationObserver(mockClient, {
    mutationFn: async () => 'saved',
    onSuccess: (saved) => options.onSuccess(saved, { id: 'item', tripId: 'trip', scheduleId: 'item' }),
  });

  await expect(mutation.mutate()).resolves.toBe('saved');
  expect(read).toHaveBeenCalledTimes(2);
  failRefresh(new Error('read unavailable'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(observer.getCurrentResult().isError).toBe(true);
  expect(mutation.getCurrentResult().isSuccess).toBe(true);
});
