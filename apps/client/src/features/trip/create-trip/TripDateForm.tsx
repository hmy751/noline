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
import { getTimeZoneDayStartISO } from '@/shared/lib/datetime';
import { getCurrencyByCountryCode } from '@/shared/lib/country-currency';
import { useCityTimeZone } from './useCityTimeZone';
import { useAppPolicy } from '@/shared/policy';
import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary/PolicyErrorDisplay';
import { OfflineError } from '@/shared/services/offline-prep/errors';
import { AuthRequiredError } from '@/shared/store/auth';

type TripDateFormProps = {
  city: City;
};

export default function TripDateForm({ city }: TripDateFormProps) {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'start' | 'end' | null>(null);
  const cityTimeZone = useCityTimeZone(city, true);
  const { canResolveTimeZone } = cityTimeZone;
  const creationPolicy = useAppPolicy().trip.create;
  const canCreateTrip = creationPolicy.allowed;
  const timeZone = cityTimeZone.data;

  const { control, handleSubmit, setValue, setError, watch } = useForm<TripDateFormData>({
    resolver: zodResolver(tripDateFormSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
    },
    mode: 'onChange',
  });

  const { mutate: createTrip, isPending, error: createError } = useCreateTrip();
  const submitError = !createError
    ? null
    : createError instanceof OfflineError || createError instanceof AuthRequiredError
      ? createError.message
      : '여행을 만들지 못했어요. 입력한 날짜는 유지됩니다. 다시 시도해주세요.';

  const startDate = watch('startDate');
  const endDate = watch('endDate');

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
    if (isPending || !canCreateTrip || !timeZone) return;

    let startISO: string;
    let endISO: string;

    try {
      startISO = getTimeZoneDayStartISO(data.startDate, timeZone);
      endISO = getTimeZoneDayStartISO(data.endDate, timeZone);
    } catch (error) {
      setError('startDate', { message: error instanceof Error ? error.message : '날짜를 다시 선택해주세요.' });
      return;
    }

    createTrip(
      {
        id: generateId(), // ✅ 외부에서 ID 생성
        // userId는 인증 추가 시 설정 예정
        name: `${city.name} 여행`,
        destination: city.name,
        country: city.country,
        baseCurrency: getCurrencyByCountryCode(city.countryCode),
        latitude: city.latitude,
        longitude: city.longitude,
        cityId: city.id,
        timeZone,
        startDate: startISO,
        endDate: endISO,
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
      <View className='p-md gap-xl'>
        <View className='flex-row items-center gap-xs'>
          <MapPin size={24} className='text-foreground' />
          <Text className='text-title-large font-semibold'>{city.name}</Text>
        </View>

        {timeZone ? (
          <Text className='text-label text-muted-foreground'>{`${city.name} 현지 시간 (${timeZone})`}</Text>
        ) : (
          <Text className='text-label text-muted-foreground'>
            {cityTimeZone.isFetching
              ? '도시 시간대를 확인하고 있어요.'
              : !canResolveTimeZone
                ? '도시 시간대 확인에는 인터넷 연결이 필요해요. 입력한 날짜는 유지됩니다.'
                : cityTimeZone.isError
                  ? '도시 시간대를 확인하지 못했어요. 입력한 날짜는 유지됩니다.'
                  : '도시 시간대 확인을 기다리고 있어요.'}
          </Text>
        )}
        {!timeZone && cityTimeZone.isError && (
          <View className='gap-xs'>
            <Pressable
              variant='outline'
              onPress={() => cityTimeZone.refetch()}
              disabled={!canResolveTimeZone || cityTimeZone.isFetching}
            >
              시간대 다시 확인
            </Pressable>
          </View>
        )}

        <View className='gap-lg'>
          <View className='flex-row items-center gap-xs pb-xs'>
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
                    className='h-11 flex-row items-center gap-sm rounded-md border border-input bg-background px-4'
                  >
                    <Calendar size={16} color='hsl(0, 0%, 45%)' />
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
                    className='h-11 flex-row items-center gap-sm rounded-md border border-input bg-background px-4'
                  >
                    <Calendar size={16} color='hsl(0, 0%, 45%)' />
                    <Text className='text-body text-muted-foreground'>{value || '종료일을 선택하세요'}</Text>
                  </TouchableOpacity>
                </Field.ElementsBox>
                {error && <Field.Message>{error.message}</Field.Message>}
              </Field>
            )}
          />
        </View>

        <Pressable
          variant='default'
          onPress={handleSubmit(onValid, onInvalid)}
          disabled={isPending || !canCreateTrip || !timeZone}
        >
          {isPending ? '생성 중...' : '여행 생성'}
        </Pressable>

        {!canCreateTrip && <PolicyErrorDisplay policy={creationPolicy} variant='inline' />}
        {submitError && <Text className='text-small text-destructive'>{submitError}</Text>}
      </View>
      <DatePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectDate={handleSelectDate}
        selectedDate={currentPicker === 'start' ? startDate : endDate}
        minDate={currentPicker === 'end' && startDate ? startDate : undefined}
      />
    </>
  );
}
