import React from 'react';
import { Alert, Text as NativeText } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import ScheduleDetailScreen from '@/screens/ScheduleDetailScreen';
import { MainTripSection } from '@/screens/HomeScreen/MainTripSection';
import { ExpenseForm } from '@/features/expense/create-expense/ExpenseForm';
import type { CreateExpenseFormData } from '@/features/expense/create-expense/schema';
import { UpdateExpenseDrawer } from '@/features/expense/update-expense/UpdateExpenseDrawer';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { useSubmitSchedule } from '@/features/schedule/create-schedule/useSubmitSchedule';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ...(jest.requireActual('../../../../packages/ui/src/components/Pressable') as object),
    ...(jest.requireActual('../../../../packages/ui/src/lib/utils') as object),
    Card: View,
    Separator: View,
    Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? ReactRuntime.createElement(View, null, children) : null,
    Select: Object.assign(
      ({ children, value }: { children: React.ReactNode; value?: { label: string } }) =>
        ReactRuntime.createElement(View, null, value && ReactRuntime.createElement(Text, null, value.label), children),
      {
        Trigger: View,
        Value: () => null,
        Portal: () => null,
        Overlay: View,
        Content: View,
        Viewport: View,
        Item: View,
        ItemText: Text,
      },
    ),
  };
});
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Container: View,
    Stack: View,
    DatePicker: () => null,
    TimePicker: () => null,
    MobileHeader: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
    ExpenseCard: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
    PolicyErrorDisplay: jest.requireActual<typeof import('@/shared/components/ErrorBoundary/PolicyErrorDisplay')>(
      '@/shared/components/ErrorBoundary/PolicyErrorDisplay',
    ).PolicyErrorDisplay,
  };
});
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@/entities/trip', () => ({
  TripCard: jest.requireActual<typeof import('@/entities/trip/ui/TripCard')>('@/entities/trip/ui/TripCard').TripCard,
  useDeactivateTrip: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/shared/services/offline-prep/metadata', () => ({ getTripActivationStatusDetail: async () => 'online' }));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: { getByTripId: jest.fn(), getById: jest.fn() },
}));
jest.mock('@/entities/expense/repository/expense-repository', () => ({
  ExpenseRepository: { getByTripId: jest.fn(), getByScheduleId: jest.fn() },
}));
jest.mock('@/entities/schedule', () => ({
  useGetSchedules: jest.requireActual<typeof import('@/entities/schedule/data/useGetSchedules')>(
    '@/entities/schedule/data/useGetSchedules',
  ).useGetSchedules,
  useGetScheduleById: jest.requireActual<typeof import('@/entities/schedule/data/useGetScheduleById')>(
    '@/entities/schedule/data/useGetScheduleById',
  ).useGetScheduleById,
  useCreateSchedule: () => ({ mutate: mockSaveSchedule, isPending: false }),
  useUpdateSchedule: () => ({ mutate: mockSaveSchedule, isPending: false }),
}));
jest.mock('@/entities/schedule/data', () => ({
  useGetScheduleById: jest.requireActual<typeof import('@/entities/schedule/data/useGetScheduleById')>(
    '@/entities/schedule/data/useGetScheduleById',
  ).useGetScheduleById,
}));
jest.mock('@/entities/expense', () => ({
  useGetTripExpenses: jest.requireActual<typeof import('@/entities/expense/data/useGetTripExpenses')>(
    '@/entities/expense/data/useGetTripExpenses',
  ).useGetTripExpenses,
  useGetScheduleExpenses: jest.requireActual<typeof import('@/entities/expense/data/useGetScheduleExpenses')>(
    '@/entities/expense/data/useGetScheduleExpenses',
  ).useGetScheduleExpenses,
  EXPENSE_CATEGORIES: ['food'],
  CURRENCIES: ['USD'],
  CURRENCY_SYMBOLS: { USD: '$' },
}));
jest.mock('@/entities/expense/data/useUpdateExpense', () => ({
  useUpdateExpense: () => ({ mutate: mockSaveExpense, isPending: false }),
}));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: mockDownloadRoutes }) }));
jest.mock('@/features/schedule/update-schedule/LocationSearchModal', () => ({ LocationSearchModal: () => null }));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'new-schedule' }));

const mockSaveExpense = jest.fn();
const mockSaveSchedule = jest.fn();
const mockDownloadRoutes = jest.fn();
const date = '2026-09-21T10:00:00Z';
const schedule = {
  id: 's',
  tripId: 'trip',
  title: '기존 일정',
  location: '장소',
  scheduledAt: date,
  latitude: '37',
  longitude: '127',
} as Awaited<ReturnType<typeof ScheduleRepository.getByTripId>>[number];
const expense = {
  id: 'e',
  tripId: 'trip',
  scheduleId: 's',
  title: '기존 경비',
  amount: '12',
  currency: 'USD',
  category: 'food',
  date,
  hasReceipt: false,
} as Awaited<ReturnType<typeof ExpenseRepository.getByTripId>>[number];
const clients: QueryClient[] = [];
const detail = <ScheduleDetailScreen scheduleId='s' tripId='trip' scheduledAt={date} onBack={jest.fn()} />;
const trip = {
  id: 'trip',
  destination: '파리',
  country: '프랑스',
  startDate: '2026-09-21',
  endDate: '2026-09-23',
  baseCurrency: 'USD',
} as React.ComponentProps<typeof MainTripSection>['mainTripData'];
const home = (
  <MainTripSection
    mainTripData={trip}
    isLoading={false}
    isError={false}
    onEditPress={jest.fn()}
    onActivatePress={jest.fn()}
  />
);
const updateExpense = (isOpen = true) => (
  <UpdateExpenseDrawer isOpen={isOpen} onClose={jest.fn()} expenseData={{ ...expense, scheduleId: 's' }} />
);
const updateSchedule = (isOpen = true) => (
  <UpdateScheduleDrawer
    isOpen={isOpen}
    onClose={jest.fn()}
    scheduleData={{ id: 's', tripId: 'trip', title: '기존 일정', date: '2026-09-21', time: '10:00' }}
  />
);

function CreateExpense() {
  const form = useForm<CreateExpenseFormData>({
    defaultValues: { title: '작성 중 경비', amount: '12', currency: 'USD', category: 'food', date, scheduleId: 's' },
  });
  return (
    <ExpenseForm
      form={form}
      tripId='trip'
      onSubmit={form.handleSubmit(mockSaveExpense)}
      onCancel={jest.fn()}
      isPending={false}
    />
  );
}
function CreateSchedule() {
  useSubmitSchedule({ tripId: 'trip' });
  return <NativeText>일정 작성</NativeText>;
}
function setup(ui: React.ReactElement, cached = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnReconnect: false } },
  });
  clients.push(client);
  if (cached) {
    client.setQueryData(scheduleQueryKeys.detail('s'), schedule);
    client.setQueryData(scheduleQueryKeys.list('trip'), [schedule]);
    client.setQueryData(expenseQueryKeys.bySchedule('s'), [expense]);
    client.setQueryData(expenseQueryKeys.byTrip('trip'), [expense]);
  }
  const wrap = (node: React.ReactElement) => <QueryClientProvider client={client}>{node}</QueryClientProvider>;
  return { ...render(wrap(ui)), client, wrap };
}
function connect(realStatus: 'online' | 'offline' | 'unknown') {
  act(() => useNetworkStore.setState({ realStatus, checkStatus: realStatus === 'unknown' ? 'checking' : 'idle' }));
}
beforeEach(() => {
  jest.mocked(ScheduleRepository.getByTripId).mockReset().mockResolvedValue([schedule]);
  jest.mocked(ScheduleRepository.getById).mockReset().mockResolvedValue(schedule);
  jest.mocked(ExpenseRepository.getByTripId).mockReset().mockResolvedValue([expense]);
  jest.mocked(ExpenseRepository.getByScheduleId).mockReset().mockResolvedValue([expense]);
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  useAuthStore.setState({ status: 'signed-in', userId: 'a', sessionId: Symbol('session') });
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(async () => {
  cleanup();
  for (const client of clients.splice(0)) {
    await client.cancelQueries();
    client.clear();
  }
  jest.restoreAllMocks();
});

it('일정 상세는 비활성 여행의 캐시를 제한 중 숨기고 복귀 시 조회 없이 다시 표시한다', () => {
  const view = setup(detail);
  connect('offline');
  expect(view.queryByText('기존 일정')).toBeNull();
  expect(view.queryByText('기존 경비')).toBeNull();
  expect(view.client.getQueryData(scheduleQueryKeys.detail('s'))).toEqual(schedule);
  connect('online');
  expect(view.getByText('기존 일정')).toBeTruthy();
  expect(view.getByText('기존 경비')).toBeTruthy();
  expect(ScheduleRepository.getById).not.toHaveBeenCalled();
});
it('일정 상세는 단건 일정과 일정별 경비만 조회한다', async () => {
  const view = setup(detail, false);
  await waitFor(() => expect(view.getByText('기존 경비')).toBeTruthy());
  expect(ScheduleRepository.getById).toHaveBeenCalledWith('s', 'trip');
  expect(ExpenseRepository.getByScheduleId).toHaveBeenCalledWith('s', 'trip');
  expect(ScheduleRepository.getByTripId).not.toHaveBeenCalled();
  expect(ExpenseRepository.getByTripId).not.toHaveBeenCalled();
});
it('일정 상세 최초 오류를 부재와 구분하고 다시 조회한다', async () => {
  jest.mocked(ScheduleRepository.getById).mockRejectedValueOnce(new Error('server'));
  const view = setup(detail, false);
  await waitFor(() => expect(view.getByText('일정을 불러오지 못했어요.')).toBeTruthy());
  expect(view.queryByText('일정을 찾을 수 없습니다.')).toBeNull();
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.getByText('기존 일정')).toBeTruthy());
});
it('일정 상세의 경비만 실패하면 일정은 유지하고 빈 경비로 표시하지 않는다', async () => {
  jest.mocked(ExpenseRepository.getByScheduleId).mockRejectedValue(new Error('server'));
  const view = setup(detail, false);
  await waitFor(() => expect(view.getByText('경비를 불러오지 못했어요.')).toBeTruthy());
  expect(view.getByText('기존 일정')).toBeTruthy();
  expect(view.queryByText('경비 내역이 없습니다')).toBeNull();
  expect(view.queryByText('USD 0.00')).toBeNull();
});
it('홈은 비활성 요약을 숨기면서 여행 카드를 유지하고 복귀 시 캐시를 표시한다', () => {
  const view = setup(home);
  connect('offline');
  expect(view.getByText('파리, 프랑스')).toBeTruthy();
  expect(view.queryByText('1개')).toBeNull();
  expect(view.queryByText('USD 12.00')).toBeNull();
  expect(view.queryByText('USD 0.00')).toBeNull();
  connect('online');
  expect(view.getByText('1개')).toBeTruthy();
  expect(view.getByText('USD 12.00')).toBeTruthy();
  expect(ScheduleRepository.getByTripId).not.toHaveBeenCalled();
});
it('홈의 경비 최초 실패는 0원과 구분하고 정상 일정 요약을 유지한다', async () => {
  jest.mocked(ExpenseRepository.getByTripId).mockRejectedValue(new Error('server'));
  const view = setup(home, false);
  await waitFor(() => expect(view.getByText('경비를 불러오지 못했어요.')).toBeTruthy());
  expect(view.getByText('1개')).toBeTruthy();
  expect(view.queryByText('USD 0.00')).toBeNull();
});
it.each([
  { name: '경비 생성', ui: <CreateExpense /> },
  { name: '경비 수정', ui: updateExpense() },
  { name: '일정 생성', ui: <CreateSchedule /> },
  { name: '일정 수정', ui: updateSchedule() },
])('$name의 보조조회도 실제 연결 제한 중에는 시작하지 않고 복구 후 조회한다', async ({ ui }) => {
  connect('unknown');
  const view = setup(ui, false);
  await act(async () => undefined);
  expect(ScheduleRepository.getByTripId).not.toHaveBeenCalled();
  connect('online');
  await waitFor(() => expect(ScheduleRepository.getByTripId).toHaveBeenCalledTimes(1));
  expect(view.client.getQueryData(scheduleQueryKeys.list('trip'))).toEqual([schedule]);
  expect(mockSaveExpense).not.toHaveBeenCalled();
  expect(mockSaveSchedule).not.toHaveBeenCalled();
});
it('경비 생성의 조회 제한과 복귀에도 작성 값과 선택한 일정 ID를 유지한다', async () => {
  const view = setup(<CreateExpense />);
  fireEvent.changeText(view.getByDisplayValue('작성 중 경비'), '바꾼 제목');
  connect('offline');
  expect(view.getByDisplayValue('바꾼 제목')).toBeTruthy();
  connect('online');
  fireEvent.press(view.getByText('저장'));
  await waitFor(() => expect(mockSaveExpense).toHaveBeenCalled());
  expect(mockSaveExpense.mock.calls[0][0]).toMatchObject({ title: '바꾼 제목', scheduleId: 's' });
});
it.each([
  { name: '경비', ui: updateExpense },
  { name: '일정', ui: updateSchedule },
])('닫힌 $name 수정 폼은 무효화돼도 조회하지 않고 열면 조회한다', async ({ ui }) => {
  const view = setup(ui(false));
  await act(async () => {
    await view.client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  expect(ScheduleRepository.getByTripId).not.toHaveBeenCalled();
  view.rerender(view.wrap(ui(true)));
  await waitFor(() => expect(ScheduleRepository.getByTripId).toHaveBeenCalledTimes(1));
});
