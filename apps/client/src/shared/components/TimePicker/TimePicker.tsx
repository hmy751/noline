import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Drawer, Pressable } from '@repo/ui';
import { useState, useEffect } from 'react';

type TimePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  initialTime?: string;
};

export default function TimePicker({ visible, onClose, onSelectTime, initialTime = '09:00' }: TimePickerProps) {
  const [hour, minute] = initialTime.split(':');
  const [selectedHour, setSelectedHour] = useState(hour || '09');
  const [selectedMinute, setSelectedMinute] = useState(minute || '00');

  // initialTime이 변경되면 상태 업데이트
  useEffect(() => {
    const [h, m] = initialTime.split(':');
    setSelectedHour(h || '09');
    setSelectedMinute(m || '00');
  }, [initialTime]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    onSelectTime(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Drawer isOpen={visible} onClose={onClose} title='시간 선택'>
      <View className='flex-row items-center justify-center py-md'>
        {/* Hour Picker */}
        <ScrollView className='h-48 w-20' showsVerticalScrollIndicator={false} bounces={false}>
          {hours.map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => setSelectedHour(h)}
              className='items-center justify-center py-sm'
            >
              <Text
                className={`text-title-medium ${selectedHour === h ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                {h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className='text-title-large text-foreground px-xs'>:</Text>

        {/* Minute Picker */}
        <ScrollView className='h-48 w-20' showsVerticalScrollIndicator={false} bounces={false}>
          {minutes.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMinute(m)}
              className='items-center justify-center py-sm'
            >
              <Text
                className={`text-title-medium ${selectedMinute === m ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className='px-sm pb-xl pt-md'>
        <Pressable variant='default' onPress={handleConfirm} className='w-full'>
          확인
        </Pressable>
      </View>
    </Drawer>
  );
}
