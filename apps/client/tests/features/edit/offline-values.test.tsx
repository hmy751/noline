import React from 'react';
import { Alert, Button } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { DatePicker, TimePicker } from '@/shared/components';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { UpdateExpenseDrawer } from '@/features/expense/update-expense/UpdateExpenseDrawer';
import { useUpdateSchedule } from '@/entities/schedule';
import { useUpdateExpense } from '@/entities/expense/data/useUpdateExpense';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore, useNetworkStore } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import NetInfo from '@react-native-community/netinfo';

let mockValidationGate: Promise<void> | null = null;
jest.mock('@hookform/resolvers/zod', () => {
  const actual = jest.requireActual<typeof import('@hookform/resolvers/zod')>('@hookform/resolvers/zod');
  return {
    zodResolver: (...args: Parameters<typeof actual.zodResolver>) => {
      const resolve = actual.zodResolver(...args);
      return async (...values: Parameters<typeof resolve>) => {
        await mockValidationGate;
        return resolve(...values);
      };
    },
  };
});

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip', () => ({ useGetTrips: () => ({ data: [{ id: 'trip', timeZone: 'UTC' }] }) }));
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
  return {
    Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }),
    TimeField: jest.requireActual<typeof import('@/shared/components/Form/TimeField')>(
      '@/shared/components/Form/TimeField',
    ).TimeField,
  };
});
jest.mock('@/shared/components/Form/Field', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@/shared/components/TimePicker/TimePicker', () => ({
  __esModule: true,
  default: jest.requireMock<typeof import('@/shared/components')>('@/shared/components').TimePicker,
}));
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

let user: ReturnType<typeof userEvent.setup>;
const saveSchedule = jest.fn<(variables: { data: { scheduledAt?: string } }) => Promise<{ scheduledAt: string }>>();
const saveExpense = jest.fn<(variables: unknown) => Promise<void>>();
beforeEach(() => {
  user = userEvent.setup();
  mockValidationGate = null;
  saveExpense.mockResolvedValue(undefined);
  saveSchedule.mockImplementation(async ({ data }) => ({ scheduledAt: data.scheduledAt ?? '2026-09-21T10:00:00Z' }));
  useNetworkStore.setState({ realStatus: 'offline', checkStatus: 'idle', overrideStatus: null });
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  jest
    .mocked(useUpdateSchedule)
    .mockReturnValue({ mutateAsync: saveSchedule } as unknown as ReturnType<typeof useUpdateSchedule>);
  jest
    .mocked(useUpdateExpense)
    .mockReturnValue({ mutateAsync: saveExpense } as unknown as ReturnType<typeof useUpdateExpense>);
});

afterEach(() => {
  act(() => networkStore.cleanup());
  jest.useRealTimers();
});

it('오프라인 일정 수정은 장소 검색을 숨기고 값이 같으면 저장하지 않는다', async () => {
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

  await user.press(view.getByText('저장'));
  expect(saveSchedule).not.toHaveBeenCalled();
});

it('오프라인 경비 수정은 연결된 일정과 입력값을 표시하고 값이 같으면 저장하지 않는다', async () => {
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

  await user.press(view.getByText('저장'));
  expect(saveExpense).not.toHaveBeenCalled();
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
  if (!Array.isArray(buttons)) {
    throw new Error('제목 변경 확인 버튼이 없습니다');
  }
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('작성 중 제목'));
  act(() => useAuthStore.setState({ status: 'signed-out' }));
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  expect(view.getByText('저장')).toBeTruthy();

  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  expect(view.getByText('작성 중 제목')).toBeTruthy();

  await user.press(view.getByText('저장'));
  await waitFor(() => expect(saveExpense).toHaveBeenCalled());
  expect(saveExpense.mock.calls[0][0]).toMatchObject({ data: { title: '작성 중 제목' } });
  prompt.mockRestore();
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
  if (!Array.isArray(buttons)) {
    throw new Error('제목 변경 확인 버튼이 없습니다');
  }
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('재확인 중 보존할 제목'));
  const listener = jest.mocked(NetInfo.addEventListener).mock.calls.at(-1)?.[0];
  if (!listener) {
    throw new Error('네트워크 구독이 없습니다');
  }
  act(() => listener({ isConnected: null, isInternetReachable: null } as Parameters<typeof listener>[0]));
  act(() => jest.advanceTimersByTime(10_000));
  jest
    .mocked(NetInfo.refresh)
    .mockResolvedValueOnce({ isConnected: true, isInternetReachable: true } as Awaited<
      ReturnType<typeof NetInfo.refresh>
    >);
  await user.press(view.getAllByRole('button', { name: '다시 확인' })[0]);
  expect(view.getByText('재확인 중 보존할 제목')).toBeTruthy();
  expect(saveExpense).not.toHaveBeenCalled();

  await user.press(view.getByText('저장'));
  expect(saveExpense.mock.calls[0][0]).toMatchObject({
    data: { title: '재확인 중 보존할 제목' },
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
  await user.press(view.getByText('저장'));
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
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect(view.getByText('마지막 저장 실패: 경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.')).toBeTruthy();
  expect(view.getByText('기존 경비')).toBeTruthy();
  expect(view.queryByText(/SQLITE_FULL/)).toBeNull();
  expect(saveExpense).toHaveBeenCalledTimes(1);

  await user.press(view.getByText('저장'));
  expect(saveExpense).toHaveBeenCalledTimes(2);
});

it('경비 수정은 저장 완료까지 중복 제출과 닫기를 막고 완료 후 한 번 닫는다', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
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
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  await user.press(view.getByText('저장 중...'));
  await waitFor(() => expect(saveExpense).toHaveBeenCalledTimes(1));
  expect(view.getByText('저장 중...')).toBeTruthy();
  expect(view.getByText('취소')).toBeEnabled();

  await user.press(view.getByText('취소'));
  expect(alert).toHaveBeenCalledWith('저장 중입니다', '저장이 끝난 뒤 닫을 수 있어요.');
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
    await user.press(view.getByText('저장'));
    if (revert) {
      expect(saveExpense).not.toHaveBeenCalled();
    } else {
      expect(saveExpense.mock.calls[0][0]).toMatchObject({ data: { date: '2026-09-22' } });
    }
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
  await user.press(view.getByText('저장'));
  expect(saveExpense).not.toHaveBeenCalled();
});

it('경비 저장 성공으로 닫고 다시 열면 저장된 날짜로 새 편집을 시작한다', async () => {
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
  const Screen = () => {
    const [selected, setSelected] = React.useState<typeof expense | null>(expense);
    return (
      <>
        <Button title='다시 수정' onPress={() => setSelected({ ...expense, date: '2026-09-22' })} />
        <UpdateExpenseDrawer isOpen={selected !== null} onClose={() => setSelected(null)} expenseData={selected} />
      </>
    );
  };
  const view = render(<Screen />);
  await user.press(view.getByText('2026-09-21'));
  await user.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect((saveExpense.mock.calls[0][0] as { data: object }).data).toHaveProperty('date', '2026-09-22');
  expect(view.queryByText('저장')).toBeNull();

  await user.press(view.getByText('다시 수정'));
  expect(view.getByText('2026-09-22')).toBeTruthy();

  await user.press(view.getByText('저장'));
  expect(saveExpense).toHaveBeenCalledTimes(1);
  expect(view.queryByText('저장')).toBeNull();
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
    await user.press(view.getByText('저장'));
    if (change === 'unchanged' || change === 'reverted') {
      expect(saveSchedule).not.toHaveBeenCalled();
    } else {
      const data = (saveSchedule.mock.calls[0][0] as { data: { scheduledAt?: string } }).data;
      if (!data.scheduledAt) {
        throw new Error('변경한 시각이 요청에 없습니다');
      }
      const saved = new Date(data.scheduledAt);
      expect(saved.getUTCDate()).toBe(change === 'date' ? 22 : 21);
      expect(saved.getUTCHours()).toBe(change === 'time' ? 11 : 10);
    }
  },
);

it('일정 저장 성공으로 닫고 다시 열면 저장된 시각으로 새 편집을 시작한다', async () => {
  const schedule = { id: 's', tripId: 'trip', title: '기존 일정', date: '2026-09-21', time: '10:00' };
  const Screen = () => {
    const [selected, setSelected] = React.useState<typeof schedule | null>(schedule);
    return (
      <>
        <Button title='다시 수정' onPress={() => setSelected({ ...schedule, date: '2026-09-22' })} />
        <UpdateScheduleDrawer
          timeZone='UTC'
          isOpen={selected !== null}
          onClose={() => setSelected(null)}
          scheduleData={selected}
        />
      </>
    );
  };
  const view = render(<Screen />);
  await user.press(view.getByText('2026-09-21'));
  await user.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect(saveSchedule).toHaveBeenCalledTimes(1);
  expect(view.queryByText('저장')).toBeNull();

  await user.press(view.getByText('다시 수정'));
  expect(view.getByText('2026-09-22')).toBeTruthy();

  await user.press(view.getByText('저장'));
  expect(saveSchedule).toHaveBeenCalledTimes(1);
  expect(view.queryByText('저장')).toBeNull();
});

it.each(['expense', 'schedule'] as const)(
  '%s는 저장 대기 중 추가 입력이 있어도 제출한 값의 저장 성공 후 닫는다',
  async (entity) => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    if (entity === 'expense') {
      saveExpense.mockReturnValueOnce(pending);
    } else {
      saveSchedule.mockImplementationOnce(async ({ data }) => {
        await pending;
        return { scheduledAt: data.scheduledAt ?? '2026-09-21T10:00:00Z' };
      });
    }
    const Screen = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      return entity === 'expense' ? (
        <UpdateExpenseDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          expenseData={{
            id: 'e',
            tripId: 'trip',
            title: '경비',
            amount: '25',
            currency: 'USD',
            category: 'food',
            date: '2026-09-21',
          }}
        />
      ) : (
        <UpdateScheduleDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          timeZone='UTC'
          scheduleData={{ id: 's', tripId: 'trip', title: '일정', date: '2026-09-21', time: '10:00' }}
        />
      );
    };
    const view = render(<Screen />);
    await user.press(view.getByText('2026-09-21'));
    await user.press(view.getByText('선택 2026-09-22'));
    await user.press(view.getByText('저장'));
    expect(view.getByText('저장 중...')).toBeDisabled();
    // DatePicker는 확인 콜백을 제공하는 mock이며 native picker 조작 검사는 아니다.

    await user.press(view.getByText('2026-09-22'));
    await user.press(view.getByText('선택 2026-09-21'));
    expect(view.getByText('2026-09-21')).toBeTruthy();

    await act(async () => finish());
    expect(view.queryByText('저장')).toBeNull();
    expect(view.queryByText('저장 중...')).toBeNull();
    if (entity === 'expense') {
      expect(saveExpense).toHaveBeenCalledTimes(1);
      expect(saveExpense).toHaveBeenCalledWith(expect.objectContaining({ data: { date: '2026-09-22' } }));
    } else {
      expect(saveSchedule).toHaveBeenCalledTimes(1);
      expect(saveSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { scheduledAt: '2026-09-22T10:00:00.000Z' },
        }),
      );
    }
  },
);

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

  await user.press(view.getByText('저장'));
  expect(saveSchedule).not.toHaveBeenCalled();
  expect(view.getByText('여행 시간대를 먼저 확인해주세요.')).toBeTruthy();
});

it('일정 수정은 확인한 현재 날짜·시간으로 picker를 다시 연다', async () => {
  const view = render(
    <UpdateScheduleDrawer
      isOpen
      onClose={jest.fn()}
      timeZone='UTC'
      scheduleData={{ id: 's', tripId: 'trip', title: '일정', date: '2026-09-21', time: '10:00' }}
    />,
  );
  fireEvent.press(view.getByText('2026-09-21'));
  expect(view.UNSAFE_getByType(DatePicker).props.selectedDate).toBe('2026-09-21');

  await act(async () => fireEvent.press(view.getByText('선택 2026-09-22')));
  fireEvent.press(view.getByText('2026-09-22'));
  expect(view.UNSAFE_getByType(DatePicker).props.selectedDate).toBe('2026-09-22');

  fireEvent(view.UNSAFE_getByType(DatePicker), 'close');
  fireEvent.press(view.getByText('10:00'));
  await act(async () => fireEvent.press(view.getByText('선택 11:00')));
  fireEvent.press(view.getByText('11:00'));
  expect(view.UNSAFE_getByType(TimePicker).props.initialTime).toBe('11:00');

  fireEvent(view.UNSAFE_getByType(TimePicker), 'close');
  expect(view.getByText('11:00')).toBeTruthy();
  expect(saveSchedule).not.toHaveBeenCalled();
});

it('다른 일정으로 전환하거나 drawer를 닫으면 열린 시간 선택을 폐기한다', () => {
  const onClose = jest.fn();
  const first = { id: 'a', tripId: 'trip', title: '첫 일정', date: '2026-09-21', time: '10:00' };
  const second = { id: 'b', tripId: 'trip', title: '둘째 일정', date: '2026-09-22', time: '11:00' };
  const view = render(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={first} />);
  fireEvent.press(view.getByText('10:00'));
  expect(view.UNSAFE_getByType(TimePicker).props.visible).toBe(true);

  view.rerender(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={second} />);
  expect(view.UNSAFE_getByType(TimePicker).props.visible).toBe(false);
  expect(view.getByText('11:00')).toBeTruthy();

  fireEvent.press(view.getByText('11:00'));
  view.rerender(<UpdateScheduleDrawer isOpen={false} onClose={onClose} timeZone='UTC' scheduleData={second} />);
  view.rerender(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={second} />);
  expect(view.UNSAFE_getByType(TimePicker).props).toMatchObject({ visible: false, initialTime: '11:00' });
  expect(saveSchedule).not.toHaveBeenCalled();
});

it('경비 수정 날짜 선택창은 현재 달력 날짜를 받는다', () => {
  const view = render(
    <UpdateExpenseDrawer
      isOpen
      onClose={jest.fn()}
      expenseData={{
        id: 'e',
        tripId: 'trip',
        title: '경비',
        amount: '12',
        currency: 'USD',
        category: 'food',
        date: '2026-09-21',
      }}
    />,
  );
  fireEvent.press(view.getByText('2026-09-21'));
  expect(view.UNSAFE_getByType(DatePicker).props.selectedDate).toBe('2026-09-21');
});

it('경비 서버 처리 뒤 기기 준비 실패는 저장 확인으로 안내하고 초안을 유지한다', async () => {
  const error = new ConfirmedUpdateError(new Error('device storage full'));
  saveExpense.mockRejectedValueOnce(error);
  const onClose = jest.fn();
  const expense = {
    id: 'e',
    tripId: 'trip',
    title: '기존 경비',
    amount: '25.00',
    currency: 'USD',
    category: 'food',
    date: '2026-09-21',
  };
  const view = render(<UpdateExpenseDrawer isOpen onClose={onClose} expenseData={expense} />);
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect(view.getByText(`저장 확인: ${error.message}`)).toBeTruthy();
  expect(view.queryByText(/마지막 저장 실패:/)).toBeNull();
  expect(view.getByText('2026-09-22')).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();
});

it('열린 경비의 배경 조회가 초안과 비교 기준을 바꾸지 않고 숫자 표현 차이도 새 편집으로 보내지 않는다', async () => {
  const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => undefined);
  const expense = {
    id: 'e',
    tripId: 'trip',
    title: '기존 경비',
    amount: '25.00',
    currency: 'USD',
    category: 'food',
    date: '2026-09-21',
  };
  const view = render(<UpdateExpenseDrawer isOpen onClose={jest.fn()} expenseData={expense} />);
  fireEvent.press(view.getByText('25.00'));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) {
    throw new Error('금액 변경 확인 버튼이 없습니다');
  }
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('25'));
  view.rerender(<UpdateExpenseDrawer isOpen onClose={jest.fn()} expenseData={{ ...expense, amount: '30.00' }} />);
  expect(view.getByText('25')).toBeTruthy();

  await user.press(view.getByText('저장'));
  expect(saveExpense).not.toHaveBeenCalled();
  prompt.mockRestore();
});

it.each(['success', 'error', 'confirmed'] as const)(
  '이전 경비 저장 %s 완료가 외부에서 연 다음 경비 초안과 안내를 침범하지 않는다',
  async (outcome) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    let succeed!: () => void;
    let finishSecond!: () => void;
    let fail!: (error: Error) => void;
    saveExpense.mockReturnValueOnce(
      new Promise<void>((resolve, reject) => {
        succeed = resolve;
        fail = reject;
      }),
    );
    saveExpense.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishSecond = resolve;
      }),
    );
    const onClose = jest.fn();
    const first = {
      id: 'first',
      tripId: 'trip',
      title: '첫 경비',
      amount: '25',
      currency: 'USD',
      category: 'food',
      date: '2026-09-21',
    };
    const second = { ...first, id: 'second', title: '둘째 경비', amount: '99' };
    const content = (expenseData: typeof first | null, isOpen = true) => (
      <UpdateExpenseDrawer isOpen={isOpen} onClose={onClose} expenseData={expenseData} />
    );
    const view = render(content(first));
    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    await user.press(view.getByText('저장'));
    expect(saveExpense).toHaveBeenCalledTimes(1);
    // 외부 prop로 닫고 다시 여는 수명 경계이며 사용자 탐색을 대신하지 않는다.

    view.rerender(content(null, false));
    view.rerender(content(second));
    expect(view.getByText('99')).toBeTruthy();
    expect(view.queryByText('저장 중...')).toBeNull();
    expect(view.getByText('저장')).toBeEnabled();

    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    await user.press(view.getByText('저장'));
    expect(saveExpense).toHaveBeenCalledTimes(2);
    expect(view.getByText('저장 중...')).toBeTruthy();

    await act(async () =>
      outcome === 'success'
        ? succeed()
        : fail(
            outcome === 'confirmed'
              ? new ConfirmedUpdateError(new Error('old device failure'))
              : new Error('old save failed'),
          ),
    );
    expect(view.getByText('99')).toBeTruthy();
    expect(view.getByText('2026-09-22')).toBeTruthy();
    expect(view.getByText('저장 중...')).toBeTruthy();
    expect(view.queryByText(/마지막 저장 실패|저장 확인:/)).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();

    await user.press(view.getByText('취소'));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => finishSecond());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('성공', '경비가 수정되었습니다.');
    alert.mockRestore();
  },
);

it.each<{ entity: 'expense' | 'schedule'; invalid: boolean }>([
  { entity: 'expense', invalid: false },
  { entity: 'expense', invalid: true },
  { entity: 'schedule', invalid: false },
  { entity: 'schedule', invalid: true },
])(
  '$entity 비동기 검증 실패 여부 $invalid 중 편집 회차가 바뀌면 이전 초안을 저장하거나 안내하지 않는다',
  async ({ entity, invalid }) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onClose = jest.fn();
    const expense = {
      id: 'first',
      tripId: 'trip',
      title: invalid ? '' : '첫 경비',
      amount: '25',
      currency: 'USD',
      category: 'food',
      date: '2026-09-21',
    };
    const schedule = {
      id: 'first',
      tripId: 'trip',
      title: invalid ? '' : '첫 일정',
      date: '2026-09-21',
      time: '10:00',
    };
    const content = (second: boolean) =>
      entity === 'expense' ? (
        <UpdateExpenseDrawer
          isOpen
          onClose={onClose}
          expenseData={second ? { ...expense, id: 'second', title: '다음 경비' } : expense}
        />
      ) : (
        <UpdateScheduleDrawer
          isOpen
          onClose={onClose}
          timeZone='UTC'
          scheduleData={second ? { ...schedule, id: 'second', title: '다음 일정' } : schedule}
        />
      );
    const view = render(content(false));
    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    let finishValidation!: () => void;
    mockValidationGate = new Promise<void>((resolve) => {
      finishValidation = resolve;
    });
    await user.press(view.getByText('저장'));
    expect(view.getByText('저장 중...')).toBeTruthy();
    // 지연된 실제 resolver가 완료되기 전에 외부 prop로 다음 대상을 장착한다.

    view.rerender(content(true));
    expect(view.queryByText('저장 중...')).toBeNull();

    await act(async () => finishValidation());
    expect(saveExpense).not.toHaveBeenCalled();
    expect(saveSchedule).not.toHaveBeenCalled();
    expect(view.getByText(entity === 'expense' ? '다음 경비' : '다음 일정')).toBeTruthy();
    expect(view.getByText('2026-09-21')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  },
);

it.each(['expense', 'schedule'] as const)(
  '%s 빈 대상으로 시작해 열고 닫아 다시 열면 새 입력과 닫힌 날짜 선택창으로 시작한다',
  async (entity) => {
    const expense = {
      id: 'e',
      tripId: 'trip',
      title: '경비',
      amount: '12',
      currency: 'USD',
      category: 'food',
      date: '2026-09-21',
    };
    const schedule = { id: 's', tripId: 'trip', title: '일정', date: '2026-09-21', time: '10:00' };
    const content = (open: boolean, date: string, hasTarget = true) =>
      entity === 'expense' ? (
        <UpdateExpenseDrawer isOpen={open} onClose={jest.fn()} expenseData={hasTarget ? { ...expense, date } : null} />
      ) : (
        <UpdateScheduleDrawer
          isOpen={open}
          onClose={jest.fn()}
          timeZone='Asia/Tokyo'
          scheduleData={hasTarget ? { ...schedule, date } : null}
        />
      );
    const view = render(content(false, '2026-09-21', false));
    expect(view.queryByText('저장')).toBeNull();

    view.rerender(content(true, '2026-09-21'));
    if (entity === 'schedule') {
      expect(view.getByText('여행 현지 시간 (Asia/Tokyo)')).toBeTruthy();
    }
    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    fireEvent.press(view.getByText('2026-09-22'));
    expect(view.getByText('선택 2026-09-22')).toBeTruthy();

    view.rerender(content(false, '2026-09-21'));
    view.rerender(content(true, '2026-09-21'));
    expect(view.getByText('2026-09-21')).toBeTruthy();
    expect(view.queryByText('선택 2026-09-22')).toBeNull();

    await user.press(view.getByText('저장'));
    expect(saveExpense).not.toHaveBeenCalled();
    expect(saveSchedule).not.toHaveBeenCalled();
  },
);
