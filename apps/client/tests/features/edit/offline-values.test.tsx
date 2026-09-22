import React from 'react';
import { Alert } from 'react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { UpdateExpenseDrawer } from '@/features/expense/update-expense/UpdateExpenseDrawer';
import { useUpdateSchedule } from '@/entities/schedule';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { useAuthStore } from '@/shared/store/auth';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@/shared/store/network', () => ({ useDisplayNetworkStatus: () => 'offline' }));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: () => ({ data: { isActivated: true } }),
}));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: jest.fn() }) }));
jest.mock('@/entities/schedule', () => ({
  useUpdateSchedule: jest.fn(),
  useGetSchedules: () => ({ data: [{ id: 'linked', title: '기존 연결 일정', scheduledAt: '2026-09-21T10:00:00Z' }] }),
}));
jest.mock('@/entities/expense', () => ({
  EXPENSE_CATEGORIES: ['food'],
  CURRENCIES: ['USD'],
  CURRENCY_SYMBOLS: { USD: '$' },
}));
jest.mock('@/entities/expense/data/useUpdateExpense', () => ({ useUpdateExpense: jest.fn() }));
jest.mock('@/features/schedule/update-schedule/LocationSearchModal', () => ({ LocationSearchModal: () => null }));
jest.mock('lucide-react-native', () => ({
  Calendar: () => null,
  Clock: () => null,
  MapPin: () => null,
  Wallet: () => null,
  ChevronDown: () => null,
}));
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    DatePicker: () => null,
    TimePicker: () => null,
    PolicyErrorDisplay: ({ policy }: { policy: { reason: string } }) =>
      ReactRuntime.createElement(Text, null, policy.reason),
  };
});
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Drawer: View,
    Pressable: ({ children, ...props }: React.ComponentProps<typeof Pressable>) =>
      ReactRuntime.createElement(
        Pressable,
        props,
        ReactRuntime.createElement(
          Text,
          null,
          typeof children === 'function' ? children({ pressed: false }) : children,
        ),
      ),
    Select: Object.assign(
      ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement(View, null, children),
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

const saveSchedule = jest.fn();
const saveExpense = jest.fn();
beforeEach(() => {
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  jest
    .mocked(useUpdateSchedule)
    .mockReturnValue({ mutate: saveSchedule } as unknown as ReturnType<typeof useUpdateSchedule>);
  jest
    .mocked(useUpdateExpense)
    .mockReturnValue({ mutate: saveExpense } as unknown as ReturnType<typeof useUpdateExpense>);
});

it('오프라인 일정 수정은 장소 검색을 숨기고 저장 payload에서 기존 장소·좌표를 덮지 않는다', async () => {
  const view = render(
    <UpdateScheduleDrawer
      isOpen
      onClose={jest.fn()}
      scheduleData={{
        id: 's',
        tripId: 'trip',
        title: '기존 제목',
        date: '2026-09-21',
        time: '10:00',
        location: '기존 장소',
        address: '기존 주소',
        latitude: null,
        longitude: null,
      }}
    />,
  );
  expect(view.getByText('기존 장소')).toBeTruthy();
  expect(view.queryByText('검색')).toBeNull();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(saveSchedule).toHaveBeenCalled());
  const request = saveSchedule.mock.calls[0][0] as { data: Record<string, unknown> };
  expect(request.data).toMatchObject({ title: '기존 제목' });
  expect(request.data).not.toHaveProperty('location');
  expect(request.data).not.toHaveProperty('latitude');
});

it('오프라인 경비 수정은 연결된 일정과 입력값을 표시하고 같은 연결을 저장한다', async () => {
  const date = '2026-09-21T10:00:00Z';
  const view = render(
    <UpdateExpenseDrawer
      isOpen
      onClose={jest.fn()}
      expenseData={{
        id: 'e',
        tripId: 'trip',
        title: '기존 경비',
        amount: '12',
        currency: 'USD',
        category: 'food',
        date,
        scheduleId: 'linked',
      }}
    />,
  );
  expect(view.getByText('기존 연결 일정 연결을 유지합니다.')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(saveExpense).toHaveBeenCalled());
  expect(saveExpense.mock.calls[0][0]).toMatchObject({
    data: { title: '기존 경비', amount: '12', date, scheduleId: 'linked' },
  });
});

it('수정 제한 안내가 나타났다 사라져도 작성 중인 값과 일정 연결을 유지한다', async () => {
  const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => undefined);
  const view = render(
    <UpdateExpenseDrawer
      isOpen
      onClose={jest.fn()}
      expenseData={{
        id: 'e',
        tripId: 'trip',
        title: '기존 경비',
        amount: '12',
        currency: 'USD',
        category: 'food',
        date: '2026-09-21T10:00:00Z',
        scheduleId: 'linked',
      }}
    />,
  );
  fireEvent.press(view.getByText('기존 경비'));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) throw new Error('제목 변경 확인 버튼이 없습니다');
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('작성 중 제목'));
  act(() => useAuthStore.setState({ status: 'signed-out' }));
  expect(view.queryByText('저장')).toBeNull();
  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(saveExpense).toHaveBeenCalled());
  expect(saveExpense.mock.calls[0][0]).toMatchObject({ data: { title: '작성 중 제목', scheduleId: 'linked' } });
  prompt.mockRestore();
});
