import { Modal, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Calendar, CalendarProps, Pressable } from '@repo/ui';

type DatePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
} & CalendarProps;

export default function DatePicker({ visible, onClose, onSelectDate, ...props }: DatePickerProps) {
  return (
    <Modal animationType='slide' transparent visible={visible} onRequestClose={onClose}>
      <View className='flex-1 justify-end bg-black/60'>
        <View className='rounded-t-2xl bg-card p-lg'>
          <View className='flex-row items-center justify-between pb-md'>
            <Text className='text-title-large'>날짜 선택</Text>
            <Pressable variant='ghost' onPress={onClose}>
              <X size={24} className='text-muted-foreground' />
            </Pressable>
          </View>

          <Calendar
            onDayPress={(day) => {
              onSelectDate(day.dateString);
            }}
            {...props}
          />
          <Pressable variant='default' onPress={onClose} className='mt-md'>
            확인
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
