import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, CalendarDays, MapPin } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import DatePicker from '@/shared/components/DatePicker/DatePicker';
import { Field } from '@/shared/components/Form';
import { type City } from './geonames.api';
import { tripDateFormSchema, type TripDateFormData } from './schema';
import { useCreateTrip } from '@/entities/trip';
import { useRouter } from 'expo-router';
import { generateId } from '@/shared/services/id/ulid';

type TripDateFormProps = {
  city: City;
};

export default function TripDateForm({ city }: TripDateFormProps) {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<TripDateFormData>({
    resolver: zodResolver(tripDateFormSchema),
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

  const onValid = (data: TripDateFormData) => {
    createTrip(
      {
        id: generateId(), // ✅ 외부에서 ID 생성
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
          router.replace('/(tabs)');
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
            render={({ field: { value }, fieldState: { error } }) => (
              <Field>
                <Field.Title>시작일</Field.Title>
                <Field.ElementsBox>
                  <TouchableOpacity
                    onPress={() => handleShowPicker('start')}
                    className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                  >
                    <Calendar size={16} className='mr-sm text-muted-foreground' />
                    <Text className='text-body text-muted-foreground'>{value || '시작일을 선택하세요'}</Text>
                  </TouchableOpacity>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name='endDate'
            render={({ field: { value }, fieldState: { error } }) => (
              <Field>
                <Field.Title>종료일</Field.Title>
                <Field.ElementsBox>
                  <TouchableOpacity
                    onPress={() => handleShowPicker('end')}
                    className='h-11 flex-row items-center rounded-md border border-input bg-background px-4'
                  >
                    <Calendar size={16} className='mr-sm text-muted-foreground' />
                    <Text className='text-body text-muted-foreground'>{value || '종료일을 선택하세요'}</Text>
                  </TouchableOpacity>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
              </Field>
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
