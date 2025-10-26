import { Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Calendar, CalendarProps, Pressable } from '@repo/ui';

type DatePickerProps = {
  visible?: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
} & CalendarProps;

export default function DatePicker({ visible = true, onClose, onSelectDate, ...props }: DatePickerProps) {
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      {/* Background overlay */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* DatePicker Card */}
      <View className='bg-card rounded-2xl overflow-hidden' style={{ width: '85%', maxWidth: 380 }}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-lg pt-md pb-sm border-b border-border'>
          <Text className='text-title-large font-semibold'>날짜 선택</Text>
          <TouchableOpacity onPress={onClose} className='p-xs'>
            <X size={22} className='text-muted-foreground' />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View className='px-sm py-md'>
          <Calendar
            onDayPress={(day) => {
              onSelectDate(day.dateString);
            }}
            {...props}
          />
        </View>

        {/* Footer Button */}
        <View className='px-lg pb-lg pt-xs'>
          <Pressable variant='default' onPress={onClose} className='w-full'>
            확인
          </Pressable>
        </View>
      </View>
    </View>
  );
}
