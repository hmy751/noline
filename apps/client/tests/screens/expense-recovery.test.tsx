import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExpensesScreen from '@/screens/ExpensesScreen';
import ExpenseDetailScreen from '@/screens/ExpenseDetailScreen';
import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';
import { useTripStore } from '@/shared/store/useTripStore';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));
jest.mock('@/shared/store', () => jest.requireActual('@/shared/store/useTripStore'));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ tripId: 'trip', id: 'expense' }),
}));
jest.mock('lucide-react-native', () => ({
  MapPin: () => null,
  Tag: () => null,
  Calendar: () => null,
  Receipt: () => null,
  ChevronLeft: () => null,
  AlertCircle: () => null,
  WifiOff: () => null,
  Wifi: () => null,
  Lock: () => null,
}));
jest.mock('@repo/ui', () => ({
  ...jest.requireActual<Pick<typeof import('@repo/ui'), 'Pressable'>>(
    '../../../../packages/ui/src/components/Pressable',
  ),
  ...jest.requireActual<Pick<typeof import('@repo/ui'), 'cn'>>('../../../../packages/ui/src/lib/utils'),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Container: View,
    Stack: View,
    MobileHeader: jest.requireActual<typeof import('@/shared/components/Navigation/MobileHeader')>(
      '@/shared/components/Navigation/MobileHeader',
    ).MobileHeader,
    ExpenseCard: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
  };
});
jest.mock('@/entities/trip', () => ({
  TripSelector: () => null,
  useGetTrips: () => ({
    data: ['trip', 'other'].map((id) => ({ id, startDate: mockTripDates.start, endDate: mockTripDates.end, baseCurrency: 'USD' })),
  }),
}));
jest.mock('@/entities/expense/repository/expense-repository', () => ({
  ExpenseRepository: { getByTripId: jest.fn() },
}));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: { getByTripId: jest.fn() },
}));
jest.mock('@/entities/expense', () => ({
  useGetTripExpenses: jest.requireActual<typeof import('@/entities/expense/data/useGetTripExpenses')>(
    '@/entities/expense/data/useGetTripExpenses',
  ).useGetTripExpenses,
  useDeleteExpense: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/entities/schedule', () => ({
  useGetSchedules: jest.requireActual<typeof import('@/entities/schedule/data/useGetSchedules')>(
    '@/entities/schedule/data/useGetSchedules',
  ).useGetSchedules,
}));
jest.mock('@/features/expense/expense-menu', () => ({ ExpenseMenu: () => null }));
jest.mock('@/features/expense/update-expense', () => ({ UpdateExpenseDrawer: () => null }));

type Expenses = Awaited<ReturnType<typeof ExpenseRepository.getByTripId>>;
const fetchExpenses = jest.mocked(ExpenseRepository.getByTripId);
const fetchSchedules = jest.mocked(ScheduleRepository.getByTripId);
const clients: QueryClient[] = [];
let mockTripDates = { start: '2026-09-21', end: '2026-09-23' };

function rows(title: string, scheduleId: string | null = null): Expenses {
  return [
    {
      id: 'expense',
      tripId: 'trip',
      title,
      amount: '10',
      currency: 'USD',
      category: 'food',
      date: '2026-09-21',
      hasReceipt: false,
      scheduleId,
    },
  ] as Expenses;
}

function pending() {
  let resolve!: (value: Expenses) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Expenses>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(Screen: typeof ExpensesScreen, cached: Expenses | null = rows('기존 경비'), stale = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnReconnect: false } },
  });
  clients.push(client);
  if (cached)
    client.setQueryData(expenseQueryKeys.byTrip('trip'), cached, { updatedAt: Date.now() - (stale ? 360000 : 0) });
  const view = render(
    <QueryClientProvider client={client}>
      <Screen />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

function connect(status: 'online' | 'offline' | 'unknown') {
  act(() => useNetworkStore.setState({ realStatus: status, checkStatus: status === 'unknown' ? 'checking' : 'idle' }));
}

beforeEach(() => {
  mockTripDates = { start: '2026-09-21', end: '2026-09-23' };
  fetchExpenses.mockReset();
  fetchSchedules.mockReset();
  fetchSchedules.mockResolvedValue([]);
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  useAuthStore.setState({ status: 'signed-in', userId: 'a', sessionId: Symbol('session') });
  useTripStore.setState({ selectedTripId: 'trip' });
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
});

afterEach(async () => {
  cleanup();
  for (const client of clients.splice(0)) {
    await client.cancelQueries();
    client.clear();
  }
});

it.each([
  { name: '목록', Screen: ExpensesScreen },
  { name: '상세', Screen: ExpenseDetailScreen },
])('$name은 연결 복귀 직후 유효한 캐시를 표시하고 새 조회를 강제하지 않는다', ({ Screen }) => {
  const view = setup(Screen);
  connect('offline');
  expect(view.queryByText('기존 경비')).toBeNull();
  connect('online');
  expect(view.getByText('기존 경비')).toBeTruthy();
  expect(fetchExpenses).not.toHaveBeenCalled();
});

it.each([
  { name: '목록', Screen: ExpensesScreen },
  { name: '상세', Screen: ExpenseDetailScreen },
])('$name은 오래된 캐시를 먼저 보이고 Query 기준으로 갱신한다', async ({ Screen }) => {
  useNetworkStore.setState({ realStatus: 'offline' });
  const request = pending();
  fetchExpenses.mockReturnValueOnce(request.promise);
  const view = setup(Screen, rows('기존 경비'), true);
  connect('online');
  expect(view.getByText('기존 경비')).toBeTruthy();
  await waitFor(() => expect(fetchExpenses).toHaveBeenCalledTimes(1));
  await act(async () => request.resolve(rows('새 경비')));
  await waitFor(() => expect(view.getByText('새 경비')).toBeTruthy());
});

it.each([
  { name: '목록', Screen: ExpensesScreen, absent: '이 날의 경비를 추가해보세요' },
  { name: '상세', Screen: ExpenseDetailScreen, absent: '경비를 찾을 수 없습니다.' },
])('$name은 최초 조회 실패를 빈 결과로 표시하지 않고 재시도한다', async ({ Screen, absent }) => {
  const request = pending();
  fetchExpenses.mockReturnValueOnce(request.promise);
  const view = setup(Screen, null);
  expect(view.getByText('경비를 불러오고 있어요.')).toBeTruthy();
  expect(view.queryByText(absent)).toBeNull();
  await act(async () => request.reject(new Error('server unavailable')));
  await waitFor(() => expect(view.getByText('경비를 불러오지 못했어요.')).toBeTruthy());
  expect(view.queryByText(absent)).toBeNull();
  fetchExpenses.mockResolvedValueOnce([]);
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.getAllByText(absent)).toHaveLength(Screen === ExpensesScreen ? 3 : 1));
});

it('상세는 이전 여행 목록에 대상 경비가 없어도 재조회 중에는 부재를 확정하지 않는다', async () => {
  const request = pending();
  fetchExpenses.mockReturnValueOnce(request.promise);
  const view = setup(ExpenseDetailScreen, [], true);
  expect(view.getByText('경비를 불러오고 있어요.')).toBeTruthy();
  expect(view.queryByText('경비를 찾을 수 없습니다.')).toBeNull();
  await act(async () => request.resolve(rows('늦게 확인한 경비')));
  await waitFor(() => expect(view.getByText('늦게 확인한 경비')).toBeTruthy());
});

it.each([
  { name: '목록', Screen: ExpensesScreen },
  { name: '상세', Screen: ExpenseDetailScreen },
])('$name은 재조회 실패에도 기존 내용을 유지하고 수동 재시도한다', async ({ Screen }) => {
  useNetworkStore.setState({ realStatus: 'offline' });
  fetchExpenses.mockRejectedValueOnce(new Error('server unavailable'));
  const view = setup(Screen, rows('기존 경비'), true);
  connect('online');
  await waitFor(() => expect(view.getByText('경비를 갱신하지 못했어요. 이전 내용을 표시하고 있어요.')).toBeTruthy());
  expect(view.getByText('기존 경비')).toBeTruthy();
  fetchExpenses.mockResolvedValueOnce(rows('재시도 경비'));
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.getByText('재시도 경비')).toBeTruthy());
});

it('상세는 제한 중 또는 연결된 일정이 없을 때 일정 조회를 시작하지 않는다', () => {
  const view = setup(ExpenseDetailScreen, rows('기존 경비', 'schedule'));
  expect(fetchSchedules).toHaveBeenCalledTimes(1);
  connect('unknown');
  expect(view.queryByText('기존 경비')).toBeNull();
  expect(fetchSchedules).toHaveBeenCalledTimes(1);
  view.unmount();
  setup(ExpenseDetailScreen, rows('기존 경비'));
  expect(fetchSchedules).toHaveBeenCalledTimes(1);
});

it('비활성 여행이 unknown이면 캐시 없는 목록·상세는 조회하지 않고 연결 확인 뒤 조회한다', async () => {
  useNetworkStore.setState({ realStatus: 'unknown', checkStatus: 'checking' });
  fetchExpenses.mockResolvedValue(rows('연결 뒤 경비'));
  const list = setup(ExpensesScreen, null);
  const detail = setup(ExpenseDetailScreen, null);
  expect(list.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  expect(detail.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  expect(fetchExpenses).not.toHaveBeenCalled();
  connect('online');
  await waitFor(() => expect(list.getByText('연결 뒤 경비')).toBeTruthy());
  await waitFor(() => expect(detail.getByText('연결 뒤 경비')).toBeTruthy());
  expect(fetchExpenses).toHaveBeenCalledTimes(2);
});

it('목록에서 다른 여행을 선택하면 이전 여행의 늦은 응답을 보여주지 않는다', async () => {
  const request = pending();
  fetchExpenses.mockImplementation((tripId) => (tripId === 'trip' ? request.promise : Promise.resolve([])));
  const view = setup(ExpensesScreen, null);
  act(() => useTripStore.setState({ selectedTripId: 'other' }));
  await act(async () => request.resolve(rows('이전 여행의 늦은 경비')));
  await waitFor(() => expect(view.getAllByText('이 날의 경비를 추가해보세요')).toHaveLength(3));
  expect(view.queryByText('이전 여행의 늦은 경비')).toBeNull();
  expect(useTripStore.getState().selectedTripId).toBe('other');
});

it.each([ExpensesScreen, ExpenseDetailScreen])(
  '강제 online·실제 offline에서는 캐시만 표시하고 조회하지 않는다',
  (Screen) => {
    useNetworkStore.setState({ realStatus: 'offline', overrideStatus: 'online' });
    const view = setup(Screen, rows('기존 경비'), true);
    expect(view.getByText('기존 경비')).toBeTruthy();
    expect(fetchExpenses).not.toHaveBeenCalled();
    expect(fetchSchedules).not.toHaveBeenCalled();
  },
);

it.each([ExpensesScreen, ExpenseDetailScreen])('활성 여행은 offline에서도 기존 Local 내용을 유지한다', (Screen) => {
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  const view = setup(Screen);
  connect('offline');
  expect(view.getByText('기존 경비')).toBeTruthy();
  expect(fetchExpenses).not.toHaveBeenCalled();
});


it.each([
  { start: '2026-03-07', end: '2026-03-10' },
  { start: '2026-10-31', end: '2026-11-03' },
])('경비 목록의 여행 날짜 범위 $start~$end는 DST에도 네 날짜를 한 번씩 표시한다', ({ start, end }) => {
  mockTripDates = { start, end };
  const view = setup(ExpensesScreen, []);
  expect(view.getAllByText('이 날의 경비를 추가해보세요')).toHaveLength(4);
});
