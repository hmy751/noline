import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { cleanup, fireEvent, render, within } from '@testing-library/react-native';
import TimePicker from '@/shared/components/TimePicker/TimePicker';

jest.mock('@repo/ui', () => ({
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Drawer'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Pressable'),
}));

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

// 실제 TimePicker/Drawer를 렌더하되, Jest에서는 viewport의 native pixels가 아닌 선택·scroll 명령을 검사한다.
function timeColumn(view: ReturnType<typeof render>, index: number) {
  return view.UNSAFE_getAllByType(ScrollView)[index + 1];
}
function expectSelected(view: ReturnType<typeof render>, hour: string, minute: string) {
  expect(within(timeColumn(view, 0)).getByText(hour).props.className).toContain('text-primary');
  expect(within(timeColumn(view, 1)).getByText(minute).props.className).toContain('text-primary');
}
function chooseLateTime(view: ReturnType<typeof render>) {
  fireEvent.press(within(timeColumn(view, 0)).getByText('23'));
  fireEvent.press(within(timeColumn(view, 1)).getByText('59'));
}

it.each(['09:00', '23:59'])('%s의 선택 상태와 목록 초기 위치를 연결한다', (time) => {
  const view = render(<TimePicker visible initialTime={time} onClose={jest.fn()} onSelectTime={jest.fn()} />);
  const [hour, minute] = time.split(':');
  expectSelected(view, hour, minute);
  [hour, minute].forEach((value, index) => {
    const list = timeColumn(view, index);
    expect(list.props.style).toEqual({ height: 220 });
    expect(list.props.snapToInterval).toBe(44);
    expect(list.props.nestedScrollEnabled).toBe(true);
    const spacers = within(list)
      .UNSAFE_getAllByType(View)
      .filter((item) => item.props.style?.height === 88);
    expect(spacers).toHaveLength(2);
    expect(list.props.contentOffset).toEqual({ x: 0, y: Number(value) * 44 });
    const scrollTo = jest.spyOn(list.instance, 'scrollTo');
    fireEvent(list, 'contentSizeChange', 80, (index === 0 ? 24 : 60) * 44);
    expect(scrollTo).toHaveBeenCalledWith({ y: Number(value) * 44, animated: false });
    scrollTo.mockClear();
    fireEvent(list, 'contentSizeChange', 80, (index === 0 ? 24 : 60) * 44);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

it('드래그·관성 스크롤의 가운데 행을 선택하고 확인에 같은 값을 전달한다', () => {
  const onSelectTime = jest.fn();
  const view = render(<TimePicker visible initialTime='09:00' onClose={jest.fn()} onSelectTime={onSelectTime} />);
  const hours = timeColumn(view, 0);
  const minutes = timeColumn(view, 1);
  fireEvent(hours, 'scroll', { nativeEvent: { contentOffset: { y: 21 * 44 + 8 } } });
  fireEvent(minutes, 'scroll', { nativeEvent: { contentOffset: { y: 58 * 44 + 30 } } });
  expectSelected(view, '21', '59');
  fireEvent.press(view.getByText('확인'));
  expect(onSelectTime).toHaveBeenCalledWith('21:59');
});

it('스크롤 종료 시 가장 가까운 행에 맞추고 행을 탭하면 그 행이 가운데로 이동한다', () => {
  const view = render(<TimePicker visible initialTime='09:00' onClose={jest.fn()} onSelectTime={jest.fn()} />);
  const hours = timeColumn(view, 0);
  const scrollTo = jest.spyOn(hours.instance, 'scrollTo');
  fireEvent(hours, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 23 * 44 - 10 } } });
  expect(scrollTo).toHaveBeenCalledWith({ y: 23 * 44, animated: false });
  expectSelected(view, '23', '00');
  scrollTo.mockClear();
  fireEvent.press(within(hours).getByText('00'));
  expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
  expectSelected(view, '00', '00');
});

it('확인 전 선택은 폼에 전달하지 않고 단순 닫기·재열기에서 버린다', () => {
  const onSelectTime = jest.fn();
  const onClose = jest.fn();
  const props = { initialTime: '09:00', onClose, onSelectTime };
  const view = render(<TimePicker visible {...props} />);
  chooseLateTime(view);
  expect(onSelectTime).not.toHaveBeenCalled();
  fireEvent(view.UNSAFE_getByType(Modal), 'requestClose');
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSelectTime).not.toHaveBeenCalled();
  view.rerender(<TimePicker visible={false} {...props} />);
  view.rerender(<TimePicker visible {...props} />);
  expectSelected(view, '09', '00');
  chooseLateTime(view);
  fireEvent.press(view.getByText('확인'));
  expect(onSelectTime).toHaveBeenCalledTimes(1);
  expect(onSelectTime).toHaveBeenCalledWith('23:59');
  view.rerender(<TimePicker visible={false} {...props} initialTime='23:59' />);
  view.rerender(<TimePicker visible {...props} initialTime='23:59' />);
  expectSelected(view, '23', '59');
});
