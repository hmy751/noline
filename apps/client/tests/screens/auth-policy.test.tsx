import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import ScheduleScreen from '@/screens/ScheduleScreen';
import ExpensesScreen from '@/screens/ExpensesScreen';
import ExpenseDetailScreen from '@/screens/ExpenseDetailScreen';
import { useDisplayNetworkStatus } from '@/shared/store/network';
import { useAuthStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store/useTripStore';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/store/network', () => ({ useDisplayNetworkStatus: jest.fn(() => 'online') }));
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
  jest.mocked(useDisplayNetworkStatus).mockReturnValue('online');
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
  jest.mocked(useDisplayNetworkStatus).mockReturnValue(networkStatus);
  view.rerender(<ExpensesScreen />);
  expect(view.queryByText('저장된 경비')).toBeNull();
  expect(view.getByText(/오프라인에서는 활성 여행/)).toBeTruthy();
});
