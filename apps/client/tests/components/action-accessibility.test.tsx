import React from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Drawer, DropdownMenu, DropdownMenuItem } from '@repo/ui';
import { ScheduleCard } from '@/shared/components/Card/ScheduleCard';

// 검토 대상 primitive는 실제 모듈을 사용하고 관계없는 UI package export는 로드하지 않는다.
jest.mock('@repo/ui', () => ({
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Drawer'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/DropdownMenu'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Card'),
  ...jest.requireActual<object>('../../../../packages/ui/src/components/Pressable'),
  ...jest.requireActual<object>('../../../../packages/ui/src/lib/utils'),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));
jest.mock('lucide-react-native', () => ({
  MapPin: () => null,
  Wallet: () => null,
  MoreVertical: () => null,
  AlertCircle: () => null,
}));

it('Drawer의 입력과 저장은 독립적으로 실행되며 배경 닫기를 실행하지 않는다', () => {
  const onClose = jest.fn();
  const onChange = jest.fn();
  const onSave = jest.fn();
  const view = render(
    <Drawer isOpen onClose={onClose} title='일정 편집'>
      <TextInput accessibilityLabel='일정 제목' onChangeText={onChange} />
      <Pressable accessibilityRole='button' onPress={onSave}>
        <Text>저장</Text>
      </Pressable>
    </Drawer>,
  );
  fireEvent.changeText(view.getByLabelText('일정 제목'), '수정한 일정');
  fireEvent.press(view.getByRole('button', { name: '저장' }));
  expect(onChange).toHaveBeenCalledWith('수정한 일정');
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});

it('드롭다운 항목은 이름으로 선택할 수 있는 개별 버튼이며 배경 닫기와 구별된다', () => {
  const onClose = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const view = render(
    <DropdownMenu isOpen onClose={onClose}>
      <DropdownMenuItem label='일정 수정' onPress={onEdit} />
      <DropdownMenuItem label='일정 삭제' onPress={onDelete} />
    </DropdownMenu>,
  );
  expect(view.getAllByRole('button')).toHaveLength(2);
  fireEvent.press(view.getByRole('button', { name: '일정 수정' }));
  expect(onEdit).toHaveBeenCalledTimes(1);
  expect(onDelete).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it('일정 카드의 메뉴와 상세 열기는 서로 다른 버튼으로 실행된다', () => {
  const onDetail = jest.fn();
  const onMenu = jest.fn();
  const view = render(
    <ScheduleCard
      title='박물관'
      time='10:00'
      location='Paris'
      latitude='48.86'
      onPress={onDetail}
      onMenuPress={onMenu}
    />,
  );
  const menu = view.getByRole('button', { name: '박물관 메뉴' });
  const detail = view.getAllByRole('button').find((button) => button !== menu);
  expect(detail).toBeDefined();
  fireEvent.press(menu, { stopPropagation: jest.fn() });
  expect(onMenu).toHaveBeenCalledTimes(1);
  expect(onDetail).not.toHaveBeenCalled();
  fireEvent.press(detail!);
  expect(onDetail).toHaveBeenCalledTimes(1);
  expect(onMenu).toHaveBeenCalledTimes(1);
});
