import { View } from 'react-native';
import { Calendar, CalendarProps, Drawer, Pressable } from '@repo/ui';

type DatePickerProps = {
  visible?: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
} & CalendarProps;

export default function DatePicker({ visible = true, onClose, onSelectDate, ...props }: DatePickerProps) {
  return (
    <Drawer isOpen={visible} onClose={onClose} title='날짜 선택'>
      {/* Calendar */}
      <View className='px-xs'>
        <Calendar
          onDayPress={(day) => {
            onSelectDate(day.dateString);
          }}
          {...props}
        />
      </View>

      {/* Footer Button */}
      <View className='px-sm pb-xl pt-md'>
        <Pressable variant='default' onPress={onClose} className='w-full'>
          확인
        </Pressable>
      </View>
    </Drawer>
  );
}
