import React from 'react';
import { Modal } from 'react-native';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react-native';
import DatePicker from '@/shared/components/DatePicker/DatePicker';
import { useCreateScheduleForm } from '@/features/schedule/create-schedule/useCreateScheduleForm';
import { Calendar } from '@repo/ui';

jest.mock('@repo/ui', () => ({
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Drawer'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Pressable'),
  // Calendar의 native 렌더링은 별도 시뮬레이터에서 확인한다. 여기서는 실제 picker의 전달·재장착 계약을 확인한다.
  Calendar: jest.fn(() => null),
}));

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('선택 날짜의 달과 강조를 전달하고 닫았다 열면 탐색 상태를 새로 시작한다', () => {
  const onClose = jest.fn();
  const onSelectDate = jest.fn();
  const props = { selectedDate: '2026-09-30', onClose, onSelectDate, minDate: '2026-09-01' };
  const view = render(<DatePicker visible {...props} />);
  expect(view.UNSAFE_getByType(Calendar).props).toMatchObject({
    current: '2026-09-30',
    minDate: '2026-09-01',
    markedDates: { '2026-09-30': { selected: true } },
  });
  fireEvent(view.UNSAFE_getByType(Modal), 'requestClose');
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSelectDate).not.toHaveBeenCalled();
  view.rerender(<DatePicker visible={false} {...props} />);
  expect(view.UNSAFE_queryByType(Calendar)).toBeNull();
  view.rerender(<DatePicker visible {...props} />);
  expect(view.UNSAFE_getByType(Calendar).props.current).toBe('2026-09-30');
  fireEvent(view.UNSAFE_getByType(Calendar), 'dayPress', { dateString: '2026-10-02' });
  expect(onSelectDate).toHaveBeenCalledWith('2026-10-02');
  view.rerender(<DatePicker visible {...props} selectedDate='2026-10-02' />);
  expect(view.UNSAFE_getByType(Calendar).props.markedDates).toEqual({ '2026-10-02': { selected: true } });
});

it('빈 날짜는 선택 표시를 만들지 않고 종료일 최소 날짜의 달에서 시작한다', () => {
  const view = render(
    <DatePicker visible selectedDate='' minDate='2027-02-01' onClose={jest.fn()} onSelectDate={jest.fn()} />,
  );
  expect(view.UNSAFE_getByType(Calendar).props.current).toBe('2027-02-01');
  expect(view.UNSAFE_getByType(Calendar).props.markedDates).toBeUndefined();
});

it('생성 폼의 날짜 단순 닫기는 값을 다시 쓰거나 검증하지 않는다', () => {
  const hook = renderHook(() => useCreateScheduleForm({ initialDate: '2026-09-30', timeZone: 'UTC' }));
  const setValue = jest.spyOn(hook.result.current.form, 'setValue');
  act(() => {
    hook.result.current.handleShowDatePicker();
  });
  act(() => {
    hook.result.current.handleCloseDatePicker();
  });
  expect(setValue).not.toHaveBeenCalled();
  expect(hook.result.current.datePickerVisible).toBe(false);
  expect(hook.result.current.form.getValues()).toMatchObject({ date: '2026-09-30', time: '09:00' });
});
