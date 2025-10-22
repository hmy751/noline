import { Modal, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import { useState } from 'react';

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

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    onSelectTime(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  return (
    <Modal animationType='slide' transparent visible={visible} onRequestClose={onClose}>
      <View className='flex-1 justify-end bg-black/60'>
        <View className='rounded-t-2xl bg-card p-lg'>
          <View className='flex-row items-center justify-between pb-md'>
            <Text className='text-title-large'>시간 선택</Text>
            <Pressable variant='ghost' onPress={onClose}>
              <X size={24} className='text-muted-foreground' />
            </Pressable>
          </View>

          <View className='flex-row items-center justify-center py-md'>
            {/* Hour Picker */}
            <ScrollView className='h-48 w-20' showsVerticalScrollIndicator={false}>
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setSelectedHour(h)}
                  className='items-center justify-center py-sm'
                >
                  <Text
                    className={`text-title-medium ${selectedHour === h ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className='text-title-large text-foreground px-xs'>:</Text>

            {/* Minute Picker */}
            <ScrollView className='h-48 w-20' showsVerticalScrollIndicator={false}>
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMinute(m)}
                  className='items-center justify-center py-sm'
                >
                  <Text
                    className={`text-title-medium ${selectedMinute === m ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Pressable variant='default' onPress={handleConfirm} className='mt-md'>
            확인
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
