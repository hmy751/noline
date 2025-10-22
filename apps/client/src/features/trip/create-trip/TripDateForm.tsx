import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Calendar, CalendarDays, MapPin } from 'lucide-react-native';
import { Pressable, Label } from '@repo/ui';
import DatePicker from '@/shared/components/DatePicker/DatePicker';
import { type City } from './geonames.api';
import { useCreateTrip } from '@/entities/trip';
import { useRouter } from 'expo-router';

type TripDateFormProps = {
  city: City;
};

type TripFormData = {
  startDate: string;
  endDate: string;
};

export default function TripDateForm({ city }: TripDateFormProps) {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<TripFormData>({
    defaultValues: {
      startDate: '',
      endDate: '',
    },
    mode: 'onChange',
  });

  const { mutate: createTrip, isPending } = useCreateTrip();

  const startDate = watch('startDate');

  const handleShowPicker = (pickerType: 'start' | 'end') => {
    setCurrentPicker(pickerType);
    setPickerVisible(true);
  };

  const handleSelectDate = (date: string) => {
    if (currentPicker === 'start') {
      setValue('startDate', date, { shouldValidate: true });
    } else {
      setValue('endDate', date, { shouldValidate: true });
    }
    setPickerVisible(false);
  };

  const onValid = (data: TripFormData) => {
    createTrip(
      {
        // userId는 인증 추가 시 설정 예정
        name: `${city.name} 여행`,
        destination: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        cityId: city.id,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      {
        onSuccess: () => {
          // 성공 시 홈 화면으로 이동 (feature-specific 로직)
          router.push('/(tabs)');
        },
      },
    );
  };

  const onInvalid = () => {
    console.log('Form validation failed');
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

          <Controller
            control={control}
            name='startDate'
            rules={{
              required: '시작일을 선택해주세요',
            }}
            render={({ field: { value }, fieldState: { error } }) => (
              <View className='space-y-sm'>
                <Label>시작일</Label>
                <TouchableOpacity
                  onPress={() => handleShowPicker('start')}
                  className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                >
                  <Calendar size={16} className='mr-sm text-muted-foreground' />
                  <Text className='text-body text-muted-foreground'>{value || '시작일을 선택하세요'}</Text>
                </TouchableOpacity>
                {error && <Text className='text-label text-destructive'>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name='endDate'
            rules={{
              required: '종료일을 선택해주세요',
              validate: (value) => {
                if (!startDate) return true;
                const start = new Date(startDate);
                const end = new Date(value);
                return end >= start || '종료일은 시작일 이후여야 합니다';
              },
            }}
            render={({ field: { value }, fieldState: { error } }) => (
              <View className='space-y-sm'>
                <Label>종료일</Label>
                <TouchableOpacity
                  onPress={() => handleShowPicker('end')}
                  className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                >
                  <Calendar size={16} className='mr-sm text-muted-foreground' />
                  <Text className='text-body text-muted-foreground'>{value || '종료일을 선택하세요'}</Text>
                </TouchableOpacity>
                {error && <Text className='text-label text-destructive'>{error.message}</Text>}
              </View>
            )}
          />
        </View>

        <Pressable variant='default' onPress={handleSubmit(onValid, onInvalid)} disabled={isPending}>
          {isPending ? '생성 중...' : '여행 생성'}
        </Pressable>
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
