import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import ScheduleScreen from '@/screens/ScheduleScreen';
import ExpensesScreen from '@/screens/ExpensesScreen';
import ExpenseDetailScreen from '@/screens/ExpenseDetailScreen';
import { networkStore, useNetworkStore } from '@/shared/store/network';
import NetInfo from '@react-native-community/netinfo';
import { NetworkStatusIndicator } from '@/shared/components/Navigation/NetworkStatusIndicator';
import { useAuthStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store/useTripStore';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';

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
  Map: () => null,
  List: () => null,
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
jest.mock('@repo/ui', () => {
  const { Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Pressable };
});
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Container: View,
    Stack: View,
    MobileHeader: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
    ExpenseCard: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
  };
});
jest.mock('@/entities/trip', () => ({
  TripSelector: () => null,
  useGetTrips: () => ({ data: [{ id: 'trip', startDate: '2026-09-21', endDate: '2026-09-21', baseCurrency: 'USD' }] }),
}));
jest.mock('@/entities/schedule', () => ({
  useGetSchedules: () => ({
    data: [{ id: 'schedule', tripId: 'trip', title: '저장된 일정', scheduledAt: '2026-09-21T10:00:00Z' }],
    refetch: jest.fn(),
  }),
  useDeleteSchedule: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/entities/expense', () => ({
  useGetTripExpenses: () => ({
    data: [
      {
        id: 'expense',
        tripId: 'trip',
        title: '저장된 경비',
        amount: '10',
        currency: 'USD',
        date: '2026-09-21T10:00:00Z',
      },
    ],
    refetch: jest.fn(),
  }),
  useDeleteExpense: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/features/schedule/schedule-list-view', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ScheduleListView: () => ReactRuntime.createElement(Text, null, '저장된 일정') };
});
jest.mock('@/features/schedule/schedule-map-view', () => ({ ScheduleMapViewContainer: () => null }));
jest.mock('@/features/schedule/schedule-menu', () => ({ ScheduleMenu: () => null }));
jest.mock('@/features/schedule/update-schedule', () => ({ UpdateScheduleDrawer: () => null }));
jest.mock('@/features/expense/expense-menu', () => ({ ExpenseMenu: () => null }));
jest.mock('@/features/expense/update-expense', () => ({ UpdateExpenseDrawer: () => null }));

beforeEach(() => {
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  useAuthStore.setState({ status: 'signed-in', userId: 'a' });
  useTripStore.setState({ selectedTripId: 'trip' });
});

it.each([
  { name: '일정 목록', Screen: ScheduleScreen, content: '저장된 일정' },
  { name: '경비 목록', Screen: ExpensesScreen, content: '저장된 경비' },
  { name: '경비 상세', Screen: ExpenseDetailScreen, content: '저장된 경비' },
])('$name은 캐시가 남아 있어도 비활성 여행의 인증이 끊기면 내용을 가린다', ({ Screen, content }) => {
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: false } } as ReturnType<typeof useGetTripActivation>);
  const view = render(<Screen />);
  expect(view.queryAllByText(content).length).toBeGreaterThan(0);
  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  expect(view.queryAllByText(content)).toHaveLength(0);
  expect(view.getByText('다시 로그인한 뒤 사용할 수 있습니다')).toBeTruthy();
});

it('활성 여행은 재인증 대기 중에도 캐시된 로컬 일정을 계속 표시한다', () => {
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useAuthStore.setState({ status: 'reauth-required' });
  expect(render(<ScheduleScreen />).getByText('저장된 일정')).toBeTruthy();
});

it.each(['offline', 'unknown'] as const)('%s에서는 비활성 여행의 캐시 내용 대신 제한을 표시한다', (networkStatus) => {
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: false } } as ReturnType<typeof useGetTripActivation>);
  const view = render(<ExpensesScreen />);
  expect(view.getByText('저장된 경비')).toBeTruthy();
  act(() =>
    useNetworkStore.setState({
      realStatus: networkStatus,
      checkStatus: networkStatus === 'unknown' ? 'checking' : 'idle',
    }),
  );
  view.rerender(<ExpensesScreen />);
  expect(view.queryByText('저장된 경비')).toBeNull();
  expect(
    view.getByText(networkStatus === 'unknown' ? '인터넷 연결을 확인하고 있어요.' : /오프라인에서는 활성 여행/),
  ).toBeTruthy();
});

it.each([
  { name: '일정 목록', Screen: ScheduleScreen, content: '저장된 일정' },
  { name: '경비 목록', Screen: ExpensesScreen, content: '저장된 경비' },
  { name: '경비 상세', Screen: ExpenseDetailScreen, content: '저장된 경비' },
])('$name은 활성 정보의 최초 확인·실패를 구별하고 활성 확인 뒤 내용을 표시한다', ({ Screen, content }) => {
  const activation = jest.mocked(useGetTripActivation);
  useNetworkStore.setState({ realStatus: 'offline', checkStatus: 'idle' });
  activation.mockReturnValue({ data: undefined, isError: false } as ReturnType<typeof useGetTripActivation>);
  const view = render(<Screen />);
  expect(view.getByText('여행 활성 상태를 확인하고 있어요.')).toBeTruthy();
  expect(view.queryByText('작업을 수행할 수 없습니다')).toBeNull();
  expect(view.queryAllByText(content)).toHaveLength(0);
  expect(view.queryByText(/오프라인에서는 활성 여행/)).toBeNull();

  activation.mockReturnValue({ data: undefined, isError: true } as ReturnType<typeof useGetTripActivation>);
  view.rerender(<Screen />);
  expect(view.getByText('여행 활성 상태를 확인하지 못했어요.')).toBeTruthy();
  expect(view.queryAllByText(content)).toHaveLength(0);
  expect(view.queryByText(/오프라인에서는 활성 여행/)).toBeNull();

  activation.mockReturnValue({ data: { isActivated: true }, isError: false } as ReturnType<
    typeof useGetTripActivation
  >);
  view.rerender(<Screen />);
  expect(view.queryAllByText(content).length).toBeGreaterThan(0);
  expect(useTripStore.getState().selectedTripId).toBe('trip');

  activation.mockReturnValue({ data: { isActivated: true }, isError: true } as ReturnType<typeof useGetTripActivation>);
  view.rerender(<Screen />);
  expect(view.queryAllByText(content).length).toBeGreaterThan(0);
  expect(view.queryByText('여행 활성 상태를 확인하지 못했어요.')).toBeNull();
});

afterEach(() => {
  act(() => networkStore.cleanup());
  jest.useRealTimers();
});

it.each([
  { name: '일정 목록', Screen: ScheduleScreen, content: '저장된 일정' },
  { name: '경비 목록', Screen: ExpensesScreen, content: '저장된 경비' },
  { name: '경비 상세', Screen: ExpenseDetailScreen, content: '저장된 경비' },
])('$name의 unknown 안내와 헤더는 실제 Store의 10초 경과·늦은 관측을 따른다', ({ Screen, content }) => {
  jest.useFakeTimers();
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  act(() => networkStore.init());
  const view = render(
    <>
      <NetworkStatusIndicator />
      <Screen />
    </>,
  );
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  expect(view.getByText('확인 중')).toBeTruthy();
  expect(view.queryAllByText(content)).toHaveLength(0);
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls.at(-1)?.[0];
  if (!listener) throw new Error('네트워크 관측 구독이 등록되지 않았습니다');
  const emit = (isConnected: boolean | null, isInternetReachable: boolean | null) =>
    listener({ isConnected, isInternetReachable } as Parameters<typeof listener>[0]);
  act(() => {
    jest.advanceTimersByTime(9_000);
    emit(null, null);
  });
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  act(() => jest.advanceTimersByTime(1_000));
  expect(view.getByText('인터넷 연결을 확인할 수 없어요.')).toBeTruthy();
  expect(view.getByText('확인 불가')).toBeTruthy();
  expect(useNetworkStore.getState().realStatus).toBe('unknown');
  expect(view.queryAllByText(content)).toHaveLength(0);
  act(() => emit(false, false));
  expect(view.getByText('인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.')).toBeTruthy();
  expect(view.getByText('오프라인')).toBeTruthy();
  act(() => emit(true, true));
  expect(view.getByText('온라인')).toBeTruthy();
  expect(view.queryAllByText(content).length).toBeGreaterThan(0);
  expect(useTripStore.getState().selectedTripId).toBe('trip');
});

it('활성 여행은 연결 확인 중과 10초 후에도 Local 내용을 유지한다', () => {
  jest.useFakeTimers();
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  act(() => networkStore.init());
  const view = render(
    <>
      <NetworkStatusIndicator />
      <ScheduleScreen />
    </>,
  );
  expect(view.getByText('저장된 일정')).toBeTruthy();
  act(() => jest.advanceTimersByTime(10_000));
  expect(view.getByText('확인 불가')).toBeTruthy();
  expect(view.getByText('저장된 일정')).toBeTruthy();
  expect(view.queryByText('인터넷 연결을 확인할 수 없어요.')).toBeNull();
});
