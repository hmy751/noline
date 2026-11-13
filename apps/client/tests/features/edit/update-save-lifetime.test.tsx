import React from 'react';
import { Alert, Modal, TouchableWithoutFeedback } from 'react-native';

import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';

import { useUpdateSchedule, useGetSchedules } from '@/entities/schedule';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip', () => ({ useGetTrips: () => ({ data: [{ id: 'trip', timeZone: 'UTC' }] }) }));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: jest.fn(),
}));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: mockDownloadRoutes }) }));
jest.mock('@/entities/schedule', () => ({
  useUpdateSchedule: jest.fn(),
  useGetSchedules: jest.fn(() => ({
    isSuccess: true,
    data: [{ id: 'linked', title: '기존 연결 일정', scheduledAt: '2026-09-21T10:00:00Z' }],
  })),
}));
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
  return {
    Drawer: jest.requireActual<Pick<typeof import('@repo/ui'), 'Drawer'>>(
      '../../../../../packages/ui/src/components/Drawer',
    ).Drawer,
    Pressable: jest.requireActual<Pick<typeof import('@repo/ui'), 'Pressable'>>(
      '../../../../../packages/ui/src/components/Pressable',
    ).Pressable,
  };
});

let user: ReturnType<typeof userEvent.setup>;
const saveSchedule = jest.fn<() => Promise<unknown>>();
const mockDownloadRoutes = jest.fn();
beforeEach(() => {
  jest.useFakeTimers();
  user = userEvent.setup();
  jest.mocked(useGetSchedules).mockReturnValue({
    isSuccess: true,
    data: [{ id: 'linked', title: '기존 연결 일정', scheduledAt: '2026-09-21T10:00:00Z' }],
  } as unknown as ReturnType<typeof useGetSchedules>);
  useNetworkStore.setState({ realStatus: 'offline', checkStatus: 'idle', overrideStatus: null });
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  jest
    .mocked(useUpdateSchedule)
    .mockReturnValue({ mutateAsync: saveSchedule } as unknown as ReturnType<typeof useUpdateSchedule>);
});

jest.mock('@/entities/schedule/repository/schedule-repository', () => ({ ScheduleRepository: { update: jest.fn() } }));
const firstSchedule = { id: 'first', tripId: 'trip', title: '첫 일정', date: '2026-09-21', time: '10:00' };
const secondSchedule = { ...firstSchedule, id: 'second', tripId: 'other-trip', title: '둘째 일정' };

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('실제 mutation 저장 중 재제출을 막고 취소 시 안내하며 완료 후 한 번 닫는다', async () => {
  jest.useFakeTimers();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { QueryClient, QueryClientProvider } =
    jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  const realHook = jest.requireActual<typeof import('@/entities/schedule/data/useUpdateSchedule')>(
    '@/entities/schedule/data/useUpdateSchedule',
  ).useUpdateSchedule;
  const { ScheduleRepository } = jest.requireMock<typeof import('@/entities/schedule/repository/schedule-repository')>(
    '@/entities/schedule/repository/schedule-repository',
  );
  jest.mocked(useUpdateSchedule).mockImplementation(realHook);
  let finish!: (value: Awaited<ReturnType<typeof ScheduleRepository.update>>) => void;
  jest.mocked(ScheduleRepository.update).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }) as ReturnType<typeof ScheduleRepository.update>,
  );
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: 0 }, queries: { retry: false, gcTime: 0 } },
  });
  const onClose = jest.fn();
  const content = (value: typeof firstSchedule | null, isOpen = true) => (
    <QueryClientProvider client={client}>
      <UpdateScheduleDrawer isOpen={isOpen} onClose={onClose} timeZone='UTC' scheduleData={value} />
    </QueryClientProvider>
  );
  const view = render(content(firstSchedule));
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  await waitFor(() => expect(ScheduleRepository.update).toHaveBeenCalledTimes(1));
  expect(view.getByText('저장 중...')).toBeTruthy();

  await user.press(view.getByText('저장 중...'));
  expect(view.getByText('취소')).toBeEnabled();

  await user.press(view.getByText('취소'));
  expect(Alert.alert).toHaveBeenCalledWith('저장 중입니다', '저장이 끝난 뒤 닫을 수 있어요.');
  expect(ScheduleRepository.update).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  await act(async () =>
    finish({
      ...firstSchedule,
      location: '',
      address: null,
      latitude: null,
      longitude: null,
      userId: 'a',
      createdAt: '2026-09-21T10:00:00Z',
      updatedAt: '2026-09-21T10:00:00Z',
      scheduledAt: '2026-09-22T10:00:00.000Z',
    }),
  );

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(Alert.alert).toHaveBeenCalledWith('성공', '일정이 수정되었습니다.');

  expect(mockDownloadRoutes).toHaveBeenCalledWith(expect.objectContaining({ tripId: firstSchedule.tripId }));
  view.unmount();
  client.clear();
});

it('실제 Drawer의 backdrop·native 닫기 콜백 계약은 저장 중 거부하고 실패 뒤 허용한다', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  let fail!: (error: Error) => void;
  saveSchedule.mockReturnValueOnce(
    new Promise((_, reject) => {
      fail = reject;
    }),
  );
  const onClose = jest.fn();
  const view = render(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={firstSchedule} />);
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));

  // native dismissal과 비접근성 backdrop의 연결 계약을 직접 주입한다. 사용자 탭 검사는 위 저장·취소가 맡는다.
  fireEvent(view.UNSAFE_getByType(Modal), 'requestClose');
  fireEvent.press(view.UNSAFE_getByType(TouchableWithoutFeedback));
  expect(onClose).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(Alert.alert).toHaveBeenLastCalledWith('저장 중입니다', '저장이 끝난 뒤 닫을 수 있어요.');

  await act(async () => fail(new Error('save failed')));
  expect(view.queryByText('저장 중...')).toBeNull();

  fireEvent(view.UNSAFE_getByType(Modal), 'requestClose');
  expect(onClose).toHaveBeenCalledTimes(1);

  fireEvent.press(view.UNSAFE_getByType(TouchableWithoutFeedback));
  expect(onClose).toHaveBeenCalledTimes(2);
});

it('검증 실패 뒤 입력을 보완해 사용자 재저장이 가능하다', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => undefined);
  saveSchedule.mockResolvedValueOnce({ ...firstSchedule, title: '보완한 일정', scheduledAt: '2026-09-21T10:00:00Z' });
  const onClose = jest.fn();
  const view = render(
    <UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={{ ...firstSchedule, title: '' }} />,
  );
  await user.press(view.getByText('저장'));
  expect(saveSchedule).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith('오류', '입력한 정보를 확인해주세요.');
  expect(view.queryByText('저장 중...')).toBeNull();
  expect(onClose).not.toHaveBeenCalled();

  // native Alert.prompt의 확인 결과만 전달하고, 재제출은 실제 버튼으로 수행한다.
  await user.press(view.getByText('제목을 입력하세요'));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) {
    throw new Error('제목 변경 확인 버튼이 없습니다');
  }
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('보완한 일정'));
  await user.press(view.getByText('저장'));
  expect(saveSchedule).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(alert).toHaveBeenCalledWith('성공', '일정이 수정되었습니다.');
});

it('서버 처리 뒤 기기 준비 실패는 확인 안내와 초안을 유지하고 다시 닫을 수 있다', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const error = new ConfirmedUpdateError(new Error('device storage full'));
  saveSchedule.mockRejectedValueOnce(error);
  const onClose = jest.fn();
  const view = render(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={firstSchedule} />);
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect(alert).toHaveBeenCalledWith('수정 확인', error.message);
  expect(view.getByText('2026-09-22')).toBeTruthy();
  expect(onClose).not.toHaveBeenCalled();

  await user.press(view.getByText('취소'));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each(['success', 'error', 'confirmed'] as const)(
  '외부 prop 전환 뒤 이전 일정의 %s 결과는 다음 폼의 초안과 저장 진행에 영향을 주지 않는다',
  async (outcome) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    let finishFirst!: () => void;
    let rejectFirst!: (error: Error) => void;
    let finishSecond!: () => void;
    saveSchedule
      .mockReturnValueOnce(
        new Promise((resolve, reject) => {
          finishFirst = () => resolve({ ...firstSchedule, scheduledAt: '2026-09-22T10:00:00.000Z' });
          rejectFirst = reject;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishSecond = () => resolve({ ...secondSchedule, scheduledAt: '2026-09-22T10:00:00.000Z' });
        }),
      );
    const onClose = jest.fn();
    const view = render(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={firstSchedule} />);
    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    await user.press(view.getByText('저장'));
    expect(saveSchedule).toHaveBeenCalledTimes(1);

    // 사용자 탐색을 재현하는 대신 외부 prop 교체의 수명 경계를 검사한다.
    view.rerender(
      <UpdateScheduleDrawer isOpen onClose={onClose} timeZone='Asia/Tokyo' scheduleData={secondSchedule} />,
    );
    expect(view.queryByText('저장 중...')).toBeNull();
    expect(view.getByText('저장')).toBeEnabled();

    fireEvent.press(view.getByText('2026-09-21'));
    fireEvent.press(view.getByText('선택 2026-09-22'));
    await user.press(view.getByText('저장'));
    expect(saveSchedule).toHaveBeenCalledTimes(2);
    expect(view.getByText('저장 중...')).toBeTruthy();

    await act(async () => {
      if (outcome === 'success') {
        finishFirst();
      } else {
        rejectFirst(
          outcome === 'confirmed' ? new ConfirmedUpdateError(new Error('old failure')) : new Error('old failure'),
        );
      }
    });
    expect(view.getByText('둘째 일정')).toBeTruthy();
    expect(view.getByText('2026-09-22')).toBeTruthy();
    expect(view.getByText('여행 현지 시간 (Asia/Tokyo)')).toBeTruthy();
    expect(view.getByText('저장 중...')).toBeTruthy();
    expect(alert).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await user.press(view.getByText('취소'));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => finishSecond());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('성공', '일정이 수정되었습니다.');
  },
);

it('시각 저장 후 여행 ID로 경로 준비를 요청하고 폼에서 목록을 조립하지 않는다', async () => {
  jest.useFakeTimers();
  const saved = {
    id: 'linked',
    tripId: 'trip',
    title: '기존 연결 일정',
    scheduledAt: '2026-09-22T10:00:00.000Z',
    latitude: '0',
    longitude: '2.294',
  };
  jest.mocked(useGetSchedules).mockReturnValue({
    isSuccess: true,
    data: [
      { id: 'linked', scheduledAt: '2026-09-21T10:00:00Z', latitude: '48', longitude: '1' },
      { id: 'later', scheduledAt: '2026-09-22T09:00:00Z', latitude: null, longitude: null },
    ],
  } as unknown as ReturnType<typeof useGetSchedules>);
  saveSchedule.mockResolvedValueOnce(saved);
  const view = render(
    <UpdateScheduleDrawer
      isOpen
      onClose={jest.fn()}
      timeZone='UTC'
      scheduleData={{ ...firstSchedule, id: 'linked' }}
    />,
  );
  fireEvent.press(view.getByText('2026-09-21'));
  fireEvent.press(view.getByText('선택 2026-09-22'));
  await user.press(view.getByText('저장'));
  expect(mockDownloadRoutes).toHaveBeenCalledWith({ tripId: 'trip' });
});

it('제목만 저장하면 경로 준비를 요청하지 않고 성공 후 닫는다', async () => {
  const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => undefined);
  const onClose = jest.fn();
  saveSchedule.mockResolvedValueOnce({ ...firstSchedule, title: '새 제목' });
  const view = render(<UpdateScheduleDrawer isOpen onClose={onClose} timeZone='UTC' scheduleData={firstSchedule} />);
  await user.press(view.getByText(firstSchedule.title));
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) {
    throw new Error('제목 확인 버튼이 없습니다');
  }
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('새 제목'));
  await user.press(view.getByText('저장'));
  expect(saveSchedule).toHaveBeenCalledTimes(1);
  expect(saveSchedule).toHaveBeenCalledWith(expect.objectContaining({ data: { title: '새 제목' } }));
  expect(mockDownloadRoutes).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalledTimes(1);
});
