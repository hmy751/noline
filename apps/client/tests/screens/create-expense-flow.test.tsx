import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateExpenseScreen from '@/screens/CreateExpenseScreen';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';
import { createExpenseLocal } from '@/entities/expense/lib/expense-local';
import { fetchCreateExpense } from '@/entities/expense/api/expenses';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', date: mockExpenseDate, scheduleId: '01ARZ3NDEKTSV4RRFFQ69G5FAW' }),
  useRouter: () => ({ back: mockExit }),
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/shared/components/Navigation', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    MobileHeader: ({ onLeftPress }: { onLeftPress: () => void }) =>
      ReactRuntime.createElement(
        Pressable,
        { onPress: onLeftPress },
        ReactRuntime.createElement(Text, null, '뒤로 가기'),
      ),
  };
});
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    DatePicker: ({ visible, onSelectDate }: { visible: boolean; onSelectDate: (date: string) => void }) =>
      visible
        ? ReactRuntime.createElement(
            Pressable,
            { onPress: () => onSelectDate('2026-10-03') },
            ReactRuntime.createElement(Text, null, '다른 날짜 선택'),
          )
        : null,
    PolicyErrorDisplay: jest.requireActual<typeof import('@/shared/components/ErrorBoundary/PolicyErrorDisplay')>(
      '@/shared/components/ErrorBoundary/PolicyErrorDisplay',
    ).PolicyErrorDisplay,
  };
});
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@repo/ui', () => ({
  ...(jest.requireActual('../../../../packages/ui/src/components/Pressable') as object),
  ...(jest.requireActual('../../../../packages/ui/src/components/Select') as object),
}));
jest.mock('@/entities/trip', () => ({ useGetTrips: () => ({ data: [{ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', baseCurrency: 'USD' }] }) }));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: () => ({ data: mockActive ? { isActivated: true } : null }),
}));
jest.mock('@/shared/services/offline-prep/metadata', () => ({ getTripActivationStatus: async () => mockActive }));
jest.mock('@/entities/expense/lib/expense-local', () => ({ createExpenseLocal: jest.fn() }));
jest.mock('@/entities/expense/api/expenses', () => ({ fetchCreateExpense: jest.fn() }));
jest.mock('@/entities/expense', () => ({
  useCreateExpense: jest.requireActual<typeof import('@/entities/expense/data/useCreateExpense')>(
    '@/entities/expense/data/useCreateExpense',
  ).useCreateExpense,
  EXPENSE_CATEGORIES: ['food'],
  CURRENCIES: ['USD'],
  CURRENCY_SYMBOLS: { USD: '$' },
}));
jest.mock('@/entities/schedule', () => ({
  useGetSchedules: jest.requireActual<typeof import('@/entities/schedule/data/useGetSchedules')>(
    '@/entities/schedule/data/useGetSchedules',
  ).useGetSchedules,
}));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: {
    getByTripId: async () => [
      { id: '01ARZ3NDEKTSV4RRFFQ69G5FAW', tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', title: '첫날 일정', scheduledAt: '2026-10-01T10:00:00Z' },
      { id: '01ARZ3NDEKTSV4RRFFQ69G5FAX', tripId: '01ARZ3NDEKTSV4RRFFQ69G5FAV', title: '다음날 일정', scheduledAt: '2026-10-02T11:00:00Z' },
    ],
  },
}));
jest.mock('@/shared/services/id/ulid', () => ({
  generateId: () => {
    if (mockIdFails) throw new Error('internal id failure');
    return '01ARZ3NDEKTSV4RRFFQ69G5FAY';
  },
}));

let mockActive = true;
let mockExpenseDate = '2026-10-01';
let mockIdFails = false;
const mockExit = jest.fn();
const local = jest.mocked(createExpenseLocal);
const remote = jest.mocked(fetchCreateExpense);
const clients: QueryClient[] = [];
beforeEach(() => {
  jest.useFakeTimers();
  mockActive = true;
  mockExpenseDate = '2026-10-01';
  mockIdFails = false;
  useAuthStore.setState({ status: 'signed-in', userId: 'user' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  local.mockImplementation(async (data) => data as unknown as Awaited<ReturnType<typeof createExpenseLocal>>);
  remote.mockImplementation(async (data) => data as unknown as Awaited<ReturnType<typeof fetchCreateExpense>>);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.restoreAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});
function connect(realStatus: 'online' | 'offline' | 'unknown', overrideStatus: 'online' | null = null) {
  act(() => useNetworkStore.setState({ realStatus, overrideStatus, checkStatus: 'idle' }));
}
async function open() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  clients.push(client);
  const view = render(
    <QueryClientProvider client={client}>
      <CreateExpenseScreen />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(view.getByText(/첫날 일정 ·/)).toBeTruthy());
  fireEvent.changeText(view.getByPlaceholderText('예: 에펠탑 입장권'), '작성 중 경비');
  fireEvent.changeText(view.getByPlaceholderText('0.00'), '37');
  fireEvent.press(view.getByText('카테고리 선택'));
  fireEvent.press(view.getByText('food'));
  return view;
}

it('활성 offline 초안은 다른 날짜 일정으로 연결을 바꾸고 경비 날짜 변경에도 연결을 유지해 Local 저장한다', async () => {
  const view = await open();
  connect('offline');
  expect(view.getByDisplayValue('작성 중 경비')).toBeTruthy();
  fireEvent.press(view.getByText(/첫날 일정 ·/));
  expect(view.getByText('2026-10-02')).toBeTruthy();
  fireEvent.press(view.getByText('다음날 일정'));
  fireEvent.press(view.getByText('2026-10-01'));
  fireEvent.press(view.getByText('다른 날짜 선택'));
  expect(view.getByText(/다음날 일정 · 2026-10-02/)).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(local).toHaveBeenCalledTimes(1));
  expect(local).toHaveBeenCalledWith(
    expect.objectContaining({ title: '작성 중 경비', amount: '37', date: '2026-10-03', scheduleId: '01ARZ3NDEKTSV4RRFFQ69G5FAX' }),
  );
  expect(remote).not.toHaveBeenCalled();
});

it('활성 unknown에서도 연결 안 함을 명시하여 Local에 null을 저장한다', async () => {
  const view = await open();
  connect('unknown');
  fireEvent.press(view.getByText(/첫날 일정 ·/));
  fireEvent.press(view.getByText('연결 안 함'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(local).toHaveBeenCalledWith(expect.objectContaining({ scheduleId: null })));
  expect(remote).not.toHaveBeenCalled();
});

it('비활성 unknown은 초안과 연결을 표시하고 Router가 저장을 막으며 online 복구 후 명시적 재시도만 저장한다', async () => {
  mockActive = false;
  const view = await open();
  connect('unknown');
  fireEvent.changeText(view.getByPlaceholderText('예: 에펠탑 입장권'), '확인 중에도 수정');
  expect(view.getByText(/첫날 일정 ·/)).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText(/마지막 저장 실패: 인터넷 연결을 아직 확인하지 못했어요/)).toBeTruthy());
  expect(local).not.toHaveBeenCalled();
  expect(remote).not.toHaveBeenCalled();
  expect(mockExit).not.toHaveBeenCalled();
  connect('online');
  expect(view.getByDisplayValue('확인 중에도 수정')).toBeTruthy();
  expect(remote).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(remote).toHaveBeenCalledTimes(1));
  expect(remote).toHaveBeenCalledWith(expect.objectContaining({ title: '확인 중에도 수정', scheduleId: '01ARZ3NDEKTSV4RRFFQ69G5FAW' }));
});

it('비활성의 실제 offline/display online 캐시도 새 후보 선택을 제한하지만 연결 해제는 가능하다', async () => {
  mockActive = false;
  const view = await open();
  connect('offline', 'online');
  expect(view.getByText(/첫날 일정 ·/)).toBeTruthy();
  expect(view.queryByText('다음날 일정')).toBeNull();
  await act(async () => fireEvent.press(view.getByText('연결 안 함')));
  expect(view.getByText('연결된 일정이 없습니다.')).toBeTruthy();
  expect(view.getByDisplayValue('작성 중 경비')).toBeTruthy();
});

it('pending 중 연속 저장과 닫기를 막고 실패 후 입력을 보존해 명시적으로 재시도한다', async () => {
  let reject!: (error: Error) => void;
  local.mockImplementationOnce(
    () =>
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
  );
  const view = await open();
  await act(async () => {
    fireEvent.press(view.getByText('저장'));
    fireEvent.press(view.getByText('저장'));
  });
  await waitFor(() => expect(local).toHaveBeenCalledTimes(1));
  fireEvent.press(view.getByText('뒤로 가기'));
  expect(mockExit).not.toHaveBeenCalled();
  await act(async () => reject(new Error('로컬 저장 공간이 부족해요')));
  await waitFor(() =>
    expect(
      view.getByText('마지막 저장 실패: 경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.'),
    ).toBeTruthy(),
  );
  expect(view.getByDisplayValue('작성 중 경비')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(local).toHaveBeenCalledTimes(2));
});

it('입력 검증 실패도 제출 잠금을 풀고 수정 후 한 번만 저장한다', async () => {
  const view = await open();
  fireEvent.changeText(view.getByPlaceholderText('예: 에펠탑 입장권'), '');
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(view.getByText('제목을 입력해주세요')).toBeTruthy();
  expect(view.getByText('저장')).toBeTruthy();
  expect(local).not.toHaveBeenCalled();
  fireEvent.changeText(view.getByPlaceholderText('예: 에펠탑 입장권'), '수정한 제목');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(local).toHaveBeenCalledTimes(1));
});

it('제출 준비의 동기 예외도 잠금을 풀고 내부 진단을 숨겨 다시 저장할 수 있다', async () => {
  const view = await open();
  mockIdFails = true;
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(
      view.getByText('마지막 저장 실패: 경비를 저장하지 못했어요. 입력은 유지되니 다시 시도해주세요.'),
    ).toBeTruthy(),
  );
  expect(view.getByText('저장')).toBeTruthy();
  expect(view.queryByText(/internal id failure/)).toBeNull();
  expect(local).not.toHaveBeenCalled();
  mockIdFails = false;
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(local).toHaveBeenCalledTimes(1));
});


it('잘못된 초기 날짜도 렌더에서 예외를 내지 않고 날짜를 다시 선택해 저장한다', async () => {
  mockExpenseDate = '2026-02-30';
  const view = await open();
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(local).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('날짜 선택'));
  fireEvent.press(view.getByText('다른 날짜 선택'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(local).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-10-03' }));
});
