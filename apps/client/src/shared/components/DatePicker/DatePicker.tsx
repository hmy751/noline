import { View } from 'react-native';
import { Calendar, CalendarProps, Drawer, Pressable } from '@repo/ui';

type DatePickerProps = {
  visible?: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
} & CalendarProps;

export default function DatePicker({
  visible = true,
  onClose,
  onSelectDate,
  selectedDate,
  markedDates,
  ...props
}: DatePickerProps) {
  return (
    <Drawer isOpen={visible} onClose={onClose} title='날짜 선택'>
      {/* 다시 열면 탐색하던 달이 아니라 현재 폼 날짜에서 시작한다. */}
      {visible && (
        <Calendar
          {...props}
          current={selectedDate || props.current || props.minDate}
          markedDates={
            selectedDate
              ? { ...markedDates, [selectedDate]: { ...markedDates?.[selectedDate], selected: true } }
              : markedDates
          }
          onDayPress={(day) => onSelectDate(day.dateString)}
        />
      )}

      {/* Footer Button */}
      <View className='pt-lg pb-xl'>
        <Pressable variant='default' onPress={onClose} className='w-full'>
          확인
        </Pressable>
      </View>
    </Drawer>
  );
}
