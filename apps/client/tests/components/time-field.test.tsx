import React from 'react';
import { Modal, Text, TouchableOpacity } from 'react-native';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimeField } from '@/shared/components/Form/TimeField';

jest.mock('@repo/ui', () => ({
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Drawer'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Pressable'),
}));
jest.mock('@/shared/components/Form/Field', () => {
  const { View, Text: NativeText } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: NativeText, ElementsBox: View, Message: NativeText }) };
});

type Values = { time: string };
let form: UseFormReturn<Values>;

function Harness() {
  form = useForm<Values>({
    resolver: zodResolver(
      z.object({
        time: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간 오류')
          .refine((time) => time !== '23:59', '선택할 수 없는 시간'),
      }),
    ),
    defaultValues: { time: '09:00' },
    mode: 'onChange',
  });
  return (
    <TimeField
      form={form}
      name='time'
      title='시간'
      renderTrigger={(value, open) => (
        <TouchableOpacity onPress={open}>
          <Text>{value}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('확인만 폼 값을 검증하고 오류를 표시·해제하며 dirty와 touched는 바꾸지 않는다', async () => {
  const view = render(<Harness />);
  fireEvent.press(view.getByText('09:00'));
  fireEvent.press(view.getByLabelText('23시'));
  fireEvent.press(view.getByLabelText('59분'));
  expect(form.getValues('time')).toBe('09:00');
  fireEvent.press(view.getByText('확인'));
  await waitFor(() => expect(view.getByText('선택할 수 없는 시간')).toBeTruthy());
  expect(form.getValues('time')).toBe('23:59');
  expect(form.getFieldState('time')).toMatchObject({ isDirty: false, isTouched: false, invalid: true });
  fireEvent.press(view.getByText('23:59'));
  fireEvent.press(view.getByLabelText('22시'));
  fireEvent.press(view.getByText('확인'));
  await waitFor(() => expect(view.queryByText('선택할 수 없는 시간')).toBeNull());
  expect(form.getValues('time')).toBe('22:59');
  expect(form.getFieldState('time')).toMatchObject({ isDirty: false, isTouched: false, invalid: false });
});

it('같은 폼을 reset해도 열린 draft는 유지하고 닫았다 다시 열면 현재 값을 쓴다', () => {
  const view = render(<Harness />);
  fireEvent.press(view.getByText('09:00'));
  fireEvent.press(view.getByLabelText('23시'));
  fireEvent.press(view.getByLabelText('59분'));
  act(() => form.reset({ time: '10:30' }));
  expect(view.getByText('10:30')).toBeTruthy();
  expect(view.getByLabelText('23시').props.accessibilityState.selected).toBe(true);
  fireEvent.press(view.getByText('확인'));
  expect(form.getValues('time')).toBe('23:59');
  fireEvent.press(view.getByText('23:59'));
  const setValue = jest.spyOn(form, 'setValue');
  fireEvent.press(view.getByLabelText('22시'));
  fireEvent(view.UNSAFE_getAllByType(Modal)[0], 'requestClose');
  expect(setValue).not.toHaveBeenCalled();
  expect(form.getValues('time')).toBe('23:59');
  expect(form.getFieldState('time')).toMatchObject({ isDirty: false, isTouched: false });
  fireEvent.press(view.getByText('23:59'));
  expect(view.getByLabelText('23시').props.accessibilityState.selected).toBe(true);
});
