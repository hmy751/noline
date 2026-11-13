import React from 'react';
import { Alert } from 'react-native';

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ExpenseRepository } from '@/entities/expense/repository/expense-repository';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { LegacyUpdateRecovery } from '@/features/sync-recovery/LegacyUpdateRecovery';
import { APIError } from '@/shared/api/errors';
import { ConfirmedDeletionError, ConfirmedUpdateError } from '@/shared/services/edit-stamp/errors';
import { clearLegacyHold } from '@/shared/services/sync/legacy-holds';

const LEGACY_HOLD = {
  id: 'hold',
  recordId: 'expense',
  tripId: 'trip',
  payload: { title: '택시', amount: '30', currency: 'USD', category: '교통' },
  current: { title: '택시', amount: '25', currency: 'USD', category: '기타' },
};
const mockCancelQueries = jest.fn(async () => undefined);
const mockInvalidateQueries = jest.fn(async () => undefined);
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [LEGACY_HOLD] }),
  useQueryClient: () => ({ cancelQueries: mockCancelQueries, invalidateQueries: mockInvalidateQueries }),
}));
jest.mock('@/shared/services/sync/legacy-holds', () => ({
  listLegacyHolds: jest.fn(),
  subscribeLegacyHolds: () => () => undefined,
  clearLegacyHold: jest.fn(),
}));
jest.mock('@/entities/expense/repository/expense-repository', () => ({
  ExpenseRepository: { getByTripId: jest.fn(), update: jest.fn() },
}));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: { getById: jest.fn(), update: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({}));
jest.mock('@repo/ui', () => {
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <View>{children}</View> : null,
    Pressable: ({ children, ...props }: { children: React.ReactNode }) => (
      <Pressable {...props}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  (ExpenseRepository.getByTripId as jest.Mock).mockResolvedValue([{ id: 'expense', ...LEGACY_HOLD.current }]);
  (ExpenseRepository.update as jest.Mock).mockResolvedValue({});
  (ScheduleRepository.getById as jest.Mock).mockResolvedValue({ id: 'expense', ...LEGACY_HOLD.current });
});

const openRecovery = async () => {
  const view = render(<LegacyUpdateRecovery table='expenses' tripId='trip' />);
  fireEvent.press(view.getByText('수정 확인 · 택시'));
  await waitFor(() => expect(view.getByText(/현재: 기타/)).toBeTruthy());
  return view;
};

it('closing keeps the full old request and sends no replacement', async () => {
  const view = await openRecovery();
  fireEvent.press(view.getByText('닫기'));
  expect(clearLegacyHold).not.toHaveBeenCalled();
  expect(ExpenseRepository.update).not.toHaveBeenCalled();
  expect(view.getByText('수정 확인 · 택시')).toBeTruthy();
});

it('saves only selected category and clears only after save safely finishes', async () => {
  let finish!: () => void;
  (ExpenseRepository.update as jest.Mock).mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const view = await openRecovery();
  fireEvent.press(view.getByText(/현재: 기타/));
  act(() => {
    fireEvent.press(view.getByText('선택한 항목 다시 저장'));
  });
  expect(ExpenseRepository.update).toHaveBeenCalledWith('expense', 'trip', { category: '교통' });
  expect(clearLegacyHold).not.toHaveBeenCalled();

  await act(async () => finish());
  expect(clearLegacyHold).toHaveBeenCalledWith('hold');
});

it('failed replacement retains old input, explicit keep-current clears without updating', async () => {
  (ExpenseRepository.update as jest.Mock).mockRejectedValue(new Error('full'));
  const view = await openRecovery();
  fireEvent.press(view.getByText(/현재: 기타/));
  await act(async () => fireEvent.press(view.getByText('선택한 항목 다시 저장')));
  expect(clearLegacyHold).not.toHaveBeenCalled();
  expect(view.getByText(/이전 입력은 보관/)).toBeTruthy();

  const prompt = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  fireEvent.press(view.getByText('현재 값 유지'));
  const buttons = prompt.mock.calls[0][2]!;
  await act(async () => buttons[1].onPress?.());
  expect(clearLegacyHold).toHaveBeenCalledWith('hold');
  expect(ExpenseRepository.update).toHaveBeenCalledTimes(1);
  prompt.mockRestore();
});

it('retains the old input and distinguishes server completion when device preparation fails', async () => {
  const failure = new ConfirmedUpdateError(new Error('keychain unavailable'));
  jest.mocked(ExpenseRepository.update).mockRejectedValue(failure);
  const view = await openRecovery();
  fireEvent.press(view.getByText(/현재: 기타/));

  await act(async () => fireEvent.press(view.getByText('선택한 항목 다시 저장')));

  expect(view.getByText(/서버가 수정 요청을 처리했지만/)).toBeTruthy();
  expect(view.queryByText(/저장하지 못했어요/)).toBeNull();
  expect(clearLegacyHold).not.toHaveBeenCalled();
  expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['expense'] });
  expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['expense'] });

  const [previous] = await ExpenseRepository.getByTripId('trip');
  jest.mocked(ExpenseRepository.getByTripId).mockResolvedValue([{ ...previous, ...LEGACY_HOLD.payload }]);
  fireEvent.press(view.getByText('닫기'));
  fireEvent.press(view.getByText('수정 확인 · 택시'));
  await waitFor(() => expect(view.getByText(/현재: 교통/)).toBeTruthy());
  expect(clearLegacyHold).not.toHaveBeenCalled();
});

it.each(['ENTITY_DELETED', 'TRIP_DELETED'] as const)(
  '확정 %s 재저장은 삭제 안내 후 닫고 관련 조회만 갱신하며 보류를 다시 정리하지 않는다',
  async (code) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const failure = new ConfirmedDeletionError(code);
    jest.mocked(ExpenseRepository.update).mockRejectedValue(failure);
    const view = await openRecovery();
    fireEvent.press(view.getByText(/현재: 기타/));
    await act(async () => fireEvent.press(view.getByText('선택한 항목 다시 저장')));
    expect(alert).toHaveBeenCalledWith('삭제 확인', failure.message);
    expect(view.queryByText('선택한 항목 다시 저장')).toBeNull();
    expect(view.queryByText(/이전 입력은 보관/)).toBeNull();
    expect(clearLegacyHold).not.toHaveBeenCalled();
    await waitFor(() => expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['expense'] }));
    expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['legacy-update-holds', 'expenses', 'trip'] });
    expect(mockCancelQueries).not.toHaveBeenCalledWith();
    if (code === 'TRIP_DELETED') {
      expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['trip'] });
      expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['schedule'] });
      expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['routes'] });
    }
    alert.mockRestore();
  },
);

it.each(['ENTITY_DELETED', 'TRIP_DELETED'] as const)(
  '미검증 %s 원본 APIError만으로는 복구 입력을 정리하거나 삭제 확인으로 닫지 않는다',
  async (code) => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.mocked(ExpenseRepository.update).mockRejectedValue(new APIError('unverified deletion', 410, code, {}));
    const view = await openRecovery();
    fireEvent.press(view.getByText(/현재: 기타/));
    await act(async () => fireEvent.press(view.getByText('선택한 항목 다시 저장')));
    expect(view.getByText(/저장하지 못했어요. 이전 입력은 보관/)).toBeTruthy();
    expect(view.getByText('선택한 항목 다시 저장')).toBeTruthy();
    expect(clearLegacyHold).not.toHaveBeenCalled();
    expect(mockCancelQueries).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  },
);

it('일정 확정 삭제는 복구창을 닫고 일정·경비 연결·경로와 해당 보류 조회를 갱신한다', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.mocked(ScheduleRepository.update).mockRejectedValue(new ConfirmedDeletionError('ENTITY_DELETED'));
  const view = render(<LegacyUpdateRecovery table='schedules' tripId='trip' />);
  fireEvent.press(view.getByText('수정 확인 · 택시'));
  await waitFor(() => expect(view.getByText(/현재: 택시/)).toBeTruthy());
  fireEvent.press(view.getByText(/현재: 택시/));
  await act(async () => fireEvent.press(view.getByText('선택한 항목 다시 저장')));
  expect(view.queryByText('선택한 항목 다시 저장')).toBeNull();
  expect(clearLegacyHold).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledWith('삭제 확인', expect.any(String));
  await waitFor(() => expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['schedule'] }));
  expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['expense'] });
  expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['routes'] });
  expect(mockCancelQueries).toHaveBeenCalledWith({ queryKey: ['legacy-update-holds', 'schedules', 'trip'] });
  expect(mockCancelQueries).not.toHaveBeenCalledWith({ queryKey: ['trip'] });
  alert.mockRestore();
});
