import React from 'react';
import { Alert } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { UpdateExpenseDrawer } from '@/features/expense/update-expense/UpdateExpenseDrawer';
import { useUpdateSchedule } from '@/entities/schedule';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore, useNetworkStore } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import NetInfo from '@react-native-community/netinfo';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: jest.fn(),
}));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: jest.fn() }) }));
jest.mock('@/entities/schedule', () => ({
  useUpdateSchedule: jest.fn(),
  useGetSchedules: () => ({
    isSuccess: true,
    data: [{ id: 'linked', title: '기존 연결 일정', scheduledAt: '2026-09-21T10:00:00Z' }],
  }),
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
  AlertCircle: () => null,
  WifiOff: () => null,
  Lock: () => null,
}));
jest.mock('@/shared/components', () => {
  return {
    DatePicker: ({ visible, onSelectDate }: { visible: boolean; onSelectDate: (date: string) => void }) => {
      const ReactRuntime = jest.requireActual<typeof import('react')>('react');
      const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
      return visible
        ? ReactRuntime.createElement(
            View,
            null,
            ...['2026-09-22', '2026-09-21'].map((date) =>
              ReactRuntime.createElement(
                Pressable,
                { key: date, onPress: () => onSelectDate(date) },
                ReactRuntime.createElement(Text, null, `선택 ${date}`),
              ),
            ),
          )
        : null;
    },
    TimePicker: ({ visible, onSelectTime }: { visible: boolean; onSelectTime: (time: string) => void }) => {
      const ReactRuntime = jest.requireActual<typeof import('react')>('react');
      const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
      return visible
        ? ReactRuntime.createElement(
            View,
            null,
            ...['11:00', '10:00'].map((time) =>
              ReactRuntime.createElement(
                Pressable,
                { key: time, onPress: () => onSelectTime(time) },
                ReactRuntime.createElement(Text, null, `선택 ${time}`),
              ),
            ),
          )
        : null;
    },
    PolicyErrorDisplay: jest.requireActual<typeof import('@/shared/components/ErrorBoundary/PolicyErrorDisplay')>(
      '@/shared/components/ErrorBoundary/PolicyErrorDisplay',
    ).PolicyErrorDisplay,
  };
});
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@repo/ui', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Drawer: View,
    Pressable: jest.requireActual<Pick<typeof import('@repo/ui'), 'Pressable'>>(
      '../../../../../packages/ui/src/components/Pressable',
    ).Pressable,
    Select: jest.requireActual<typeof import('../../../../../packages/ui/src/components/Select')>(
      '../../../../../packages/ui/src/components/Select',
    ).Select,
  };
});

const saveSchedule = jest.fn();
const saveExpense = jest.fn<(variables: unknown) => Promise<void>>();
beforeEach(() => {
  saveExpense.mockResolvedValue(undefined);
  useNetworkStore.setState({ realStatus: 'offline', checkStatus: 'idle', overrideStatus: null });
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  jest
    .mocked(useUpdateSchedule)
    .mockReturnValue({ mutate: saveSchedule } as unknown as ReturnType<typeof useUpdateSchedule>);
  jest
    .mocked(useUpdateExpense)
    .mockReturnValue({ mutateAsync: saveExpense } as unknown as ReturnType<typeof useUpdateExpense>);
});

it('오프라인 일정 수정은 장소 검색을 숨기고 저장 payload에서 기존 장소·좌표를 덮지 않는다', async () => {
  const view = render(
    <UpdateScheduleDrawer
      timeZone='UTC'
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
  const date = '2026-09-21';
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
  expect(view.getByText(/기존 연결 일정 · 2026-09-21/)).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(saveExpense).toHaveBeenCalled());
  expect(saveExpense.mock.calls[0][0]).toMatchObject({
    data: { title: '기존 경비', amount: '12', scheduleId: 'linked' },
  });
  expect((saveExpense.mock.calls[0][0] as { data: object }).data).not.toHaveProperty('date');
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
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  fireEvent.press(view.getByText('기존 경비'));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) throw new Error('제목 변경 확인 버튼이 없습니다');
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('작성 중 제목'));
  act(() => useAuthStore.setState({ status: 'signed-out' }));
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  expect(view.getByText('저장')).toBeTruthy();
  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(saveExpense).toHaveBeenCalled());
  expect(saveExpense.mock.calls[0][0]).toMatchObject({ data: { title: '작성 중 제목', scheduleId: 'linked' } });
  prompt.mockRestore();
});

afterEach(() => {
  act(() => networkStore.cleanup());
  jest.useRealTimers();
});

it('경비 수정의 재확인 전후에도 작성 중인 값과 일정 연결을 유지하고 자동 저장하지 않는다', async () => {
  jest.useFakeTimers();
  useAuthStore.setState({ status: 'signed-in' });
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  act(() => {
    networkStore.init();
    useNetworkStore.setState({ realStatus: 'online', checkStatus: 'idle' });
  });
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
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  fireEvent.press(view.getByText('기존 경비'));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) throw new Error('제목 변경 확인 버튼이 없습니다');
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('재확인 중 보존할 제목'));
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls.at(-1)?.[0];
  if (!listener) throw new Error('네트워크 구독이 없습니다');
  act(() => listener({ isConnected: null, isInternetReachable: null } as Parameters<typeof listener>[0]));
  act(() => jest.advanceTimersByTime(10_000));
  jest
    .mocked(NetInfo.refresh)
    .mockResolvedValueOnce({ isConnected: true, isInternetReachable: true } as Awaited<
      ReturnType<typeof NetInfo.refresh>
    >);
  await act(async () => fireEvent.press(view.getAllByRole('button', { name: '다시 확인' })[0]));
  expect(view.getByText('재확인 중 보존할 제목')).toBeTruthy();
  expect(saveExpense).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(saveExpense.mock.calls[0][0]).toMatchObject({
    data: { title: '재확인 중 보존할 제목', scheduleId: 'linked' },
  });
  prompt.mockRestore();
});

it('활성 오프라인 수정도 일정 연결 해제를 null payload로 명시한다', async () => {
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
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  fireEvent.press(view.getByText(/기존 연결 일정 ·/));
  fireEvent.press(view.getByText('연결 안 함'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(saveExpense).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ scheduleId: null }) }),
    ),
  );
});

it('수정 저장 실패는 입력과 연결을 유지하고 자동 재시도하지 않는다', async () => {
  saveExpense.mockRejectedValueOnce(new Error('SQLITE_FULL'));
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
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(view.getByText('마지막 저장 실패: 경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.')).toBeTruthy();
  expect(view.getByText('기존 경비')).toBeTruthy();
  expect(view.queryByText(/SQLITE_FULL/)).toBeNull();
  expect(saveExpense).toHaveBeenCalledTimes(1);
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(saveExpense).toHaveBeenCalledTimes(2);
});

it('경비 수정은 저장 완료까지 중복 제출과 닫기를 막고 완료 후 한 번 닫는다', async () => {
  let finish!: () => void;
  saveExpense.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const onClose = jest.fn();
  const view = render(
    <UpdateExpenseDrawer
      isOpen
      onClose={onClose}
      expenseData={{
        id: 'e',
        tripId: 'trip',
        title: '기존 경비',
        amount: '12',
        currency: 'USD',
        category: 'food',
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  const save = view.getByText('저장');
  act(() => {
    fireEvent.press(save);
    fireEvent.press(save);
  });
  await waitFor(() => expect(saveExpense).toHaveBeenCalledTimes(1));
  expect(view.getByText('저장 중...')).toBeTruthy();
  fireEvent.press(view.getByText('취소'));
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  '경비 날짜를 변경 후 원래 날짜로 복귀: %s — 실제 변경만 전송하고 연결은 유지한다',
  async (revert) => {
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
          date: '2026-09-21',
          scheduleId: 'linked',
        }}
      />,
    );
    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    if (revert) {
      fireEvent.press(view.getByText('2026-09-22'));
      fireEvent.press(view.getByText('선택 2026-09-21'));
    }
    await act(async () => fireEvent.press(view.getByText('저장')));
    const request = saveExpense.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(request.data.scheduleId).toBe('linked');
    if (revert) expect(request.data).not.toHaveProperty('date');
    else expect(request.data.date).toBe('2026-09-22');
  },
);

it('다른 경비를 열면 변경 비교의 기준 날짜도 새 경비로 바뀐다', async () => {
  const expense = {
    id: 'e',
    tripId: 'trip',
    title: '기존 경비',
    amount: '12',
    currency: 'USD',
    category: 'food',
    date: '2026-09-21',
    scheduleId: 'linked',
  };
  const view = render(<UpdateExpenseDrawer isOpen onClose={jest.fn()} expenseData={expense} />);
  view.rerender(
    <UpdateExpenseDrawer isOpen onClose={jest.fn()} expenseData={{ ...expense, id: 'next', date: '2026-09-22' }} />,
  );
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(saveExpense.mock.calls[0][0]).toMatchObject({ id: 'next' });
  expect((saveExpense.mock.calls[0][0] as { data: object }).data).not.toHaveProperty('date');
});

it('날짜 저장 성공 뒤 같은 경비를 다시 저장하면 방금 저장한 날짜를 재전송하지 않는다', async () => {
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
        date: '2026-09-21',
        scheduleId: 'linked',
      }}
    />,
  );
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect((saveExpense.mock.calls[0][0] as { data: object }).data).toHaveProperty('date', '2026-09-22');
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect((saveExpense.mock.calls[1][0] as { data: object }).data).not.toHaveProperty('date');
});

it.each(['unchanged', 'date', 'time', 'reverted'])(
  '일정 수정 %s: 날짜·시간의 실제 변경만 scheduledAt으로 전송한다',
  async (change) => {
    const view = render(
      <UpdateScheduleDrawer
        timeZone='UTC'
        isOpen
        onClose={jest.fn()}
        scheduleData={{
          id: 's',
          tripId: 'trip',
          title: '기존 일정',
          date: '2026-09-21',
          time: '10:00',
        }}
      />,
    );
    if (change === 'date' || change === 'reverted') {
      fireEvent.press(view.getByText('2026-09-21'));
      fireEvent.press(view.getByText('선택 2026-09-22'));
      if (change === 'reverted') {
        fireEvent.press(view.getByText('2026-09-22'));
        fireEvent.press(view.getByText('선택 2026-09-21'));
      }
    }
    if (change === 'time') {
      fireEvent.press(view.getByText('10:00'));
      fireEvent.press(view.getByText('선택 11:00'));
    }
    await act(async () => fireEvent.press(view.getByText('저장')));
    const data = (saveSchedule.mock.calls[0][0] as { data: { scheduledAt?: string } }).data;
    if (change === 'unchanged' || change === 'reverted') expect(data).not.toHaveProperty('scheduledAt');
    else {
      if (!data.scheduledAt) throw new Error('변경한 시각이 요청에 없습니다');
      const saved = new Date(data.scheduledAt);
      expect(saved.getUTCDate()).toBe(change === 'date' ? 22 : 21);
      expect(saved.getUTCHours()).toBe(change === 'time' ? 11 : 10);
    }
  },
);

it('일정 저장 성공 뒤 같은 입력으로 다시 저장하면 시각을 재전송하지 않는다', async () => {
  const view = render(
    <UpdateScheduleDrawer
      timeZone='UTC'
      isOpen
      onClose={jest.fn()}
      scheduleData={{
        id: 's',
        tripId: 'trip',
        title: '기존 일정',
        date: '2026-09-21',
        time: '10:00',
      }}
    />,
  );
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  const [request, callbacks] = saveSchedule.mock.calls[0] as [
    { data: { scheduledAt: string } },
    { onSuccess: (saved: { scheduledAt: string }) => void },
  ];
  act(() => callbacks.onSuccess({ scheduledAt: request.data.scheduledAt }));
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect((saveSchedule.mock.calls[1][0] as { data: object }).data).not.toHaveProperty('scheduledAt');
});

it('수정 중 여행 시간대가 조회로 바뀌어도 처음 연 입력의 시간대를 재해석하지 않는다', async () => {
  const scheduleData = { id: 's', tripId: 'trip', title: '기존 일정', date: '2026-09-21', time: '10:00' };
  const view = render(<UpdateScheduleDrawer isOpen onClose={jest.fn()} timeZone={null} scheduleData={scheduleData} />);
  fireEvent.press(view.getByText('10:00'));
  fireEvent.press(view.getByText('선택 11:00'));
  view.rerender(
    <UpdateScheduleDrawer
      isOpen
      onClose={jest.fn()}
      timeZone='Asia/Tokyo'
      scheduleData={{ ...scheduleData, time: '19:00' }}
    />,
  );
  expect(view.getByText('11:00')).toBeTruthy();
  expect(view.getByText(/시간대 확인 필요 · UTC 기준/)).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(saveSchedule).not.toHaveBeenCalled();
  expect(view.getByText('여행 시간대를 먼저 확인해주세요.')).toBeTruthy();
});
