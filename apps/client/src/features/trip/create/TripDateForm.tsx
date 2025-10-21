import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar, CalendarDays, MapPin } from 'lucide-react-native';
import { Button, Label } from '@repo/ui';
import DatePicker from '@/shared/components/DatePicker/DatePicker';
import { type City } from './geonames.api';

type TripDateFormProps = {
  city: City;
};

export default function TripDateForm({ city }: TripDateFormProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);

  const handleShowPicker = (pickerType: 'start' | 'end') => {
    setCurrentPicker(pickerType);
    setPickerVisible(true);
  };

  const handleSelectDate = (date: string) => {
    if (currentPicker === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setPickerVisible(false);
  };

  const handleCreateTrip = () => {
    // console.log('Create trip with', { city, startDate, endDate });
  };

  return (
    <>
      <View className='p-md space-y-lg'>
        <View className='flex-row items-center space-x-xs'>
          <MapPin size={20} className='text-foreground' />
          <Text className='text-title-large'>{city.name}</Text>
        </View>

        <View className='space-y-md'>
          <View className='flex-row items-center space-x-xs'>
            <CalendarDays size={20} className='text-muted-foreground' />
            <Text className='text-title-medium text-muted-foreground'>여행 일정</Text>
          </View>

          <View className='space-y-sm'>
            <Label>시작일</Label>
            <TouchableOpacity
              onPress={() => handleShowPicker('start')}
              className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
            >
              <Calendar size={16} className='mr-sm text-muted-foreground' />
              <Text className='text-body text-muted-foreground'>{startDate || '시작일을 선택하세요'}</Text>
            </TouchableOpacity>
          </View>

          <View className='space-y-sm'>
            <Label>종료일</Label>
            <TouchableOpacity
              onPress={() => handleShowPicker('end')}
              className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
            >
              <Calendar size={16} className='mr-sm text-muted-foreground' />
              <Text className='text-body text-muted-foreground'>{endDate || '종료일을 선택하세요'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Button onPress={handleCreateTrip}>여행 생성</Button>
      </View>
      <DatePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectDate={handleSelectDate}
        minDate={currentPicker === 'end' && startDate ? startDate : undefined}
      />
    </>
  );
}
