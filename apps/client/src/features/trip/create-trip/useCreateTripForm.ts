import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTrip } from '@/entities/trip';
import { useRouter } from 'expo-router';
import { City } from './geonames.api';

// Zod 스키마로 폼 검증 정의
const tripFormSchema = z
  .object({
    startDate: z.string().min(1, '시작일을 선택해주세요'),
    endDate: z.string().min(1, '종료일을 선택해주세요'),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: '종료일은 시작일 이후여야 합니다',
      path: ['endDate'],
    },
  );

type TripFormData = z.infer<typeof tripFormSchema>;

export const useCreateTripForm = (city: City) => {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    },
    mode: 'onChange',
  });

  const { mutate: createTrip, isPending } = useCreateTrip();

  const startDate = form.watch('startDate');

  const handleShowPicker = (pickerType: 'start' | 'end') => {
    setCurrentPicker(pickerType);
    setPickerVisible(true);
  };

  const handleSelectDate = (date: string) => {
    if (currentPicker === 'start') {
      form.setValue('startDate', date, { shouldValidate: true });
    } else {
      form.setValue('endDate', date, { shouldValidate: true });
    }
    setPickerVisible(false);
  };

  const handleClosePicker = () => {
    setPickerVisible(false);
  };

  const onValid = (data: TripFormData) => {
    createTrip(
      {
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
          router.push('/(tabs)');
        },
      },
    );
  };

  const onInvalid = () => {
    console.log('Form validation failed');
  };

  return {
    form,
    isPending,
    pickerVisible,
    currentPicker,
    startDate,
    handleShowPicker,
    handleSelectDate,
    onSubmit: form.handleSubmit(onValid, onInvalid),
    onClosePicker: handleClosePicker,
  };
};
