import { View, Text, Keyboard, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MobileHeader, DatePicker, TimePicker } from '@/shared/components';
import { useGetTrips, type TripResponse } from '@/entities/trip';
import { useAppPolicy } from '@/shared/policy';
import { useCreateScheduleForm, ScheduleForm, type Location } from '@/features/schedule/create-schedule';
import { useCreateScheduleSearch } from '@/features/schedule/create-schedule/useCreateScheduleSearch';
import { useSubmitSchedule } from '@/features/schedule/create-schedule/useSubmitSchedule';
import { ScheduleSearchPanel } from '@/features/schedule/create-schedule/ScheduleSearchPanel';

function exitCreateSchedule() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/schedule');
}

export default function CreateScheduleScreen() {
  const { tripId = '', date } = useLocalSearchParams<{ tripId?: string; date?: string }>();
  return <CreateScheduleContent key={tripId} tripId={tripId} initialDate={date} />;
}

function CreateScheduleContent({ tripId, initialDate }: { tripId: string; initialDate?: string }) {
  const { data: trips, isLoading } = useGetTrips();
  const trip = trips?.find((item: TripResponse) => item.id === tripId);
  // 사용자 행동으로만 단계를 바꾼다. 연결 변화는 각 기능의 가용성에만 반영한다.
  const [step, setStep] = useState<'search' | 'form' | 'change-place'>('search');
  const draft = useCreateScheduleForm({ initialDate });
  const submission = useSubmitSchedule({ tripId, onSuccess: exitCreateSchedule });
  const policy = useAppPolicy(tripId);

  const search = useCreateScheduleSearch(
    trip
      ? {
          cityName: trip.destination,
          latitude: trip.latitude ? parseFloat(trip.latitude) : undefined,
          longitude: trip.longitude ? parseFloat(trip.longitude) : undefined,
        }
      : undefined,
    !!trip && step !== 'form',
  );

  const selectPlace = (place: Location) => {
    if (!search.canSelectPlace(place)) return;
    Keyboard.dismiss();
    draft.selectLocation(place);
    setStep('form');
  };

  const { form } = draft;

  const onSubmit = form.handleSubmit((values) => submission.submit(values, draft.selectedLocation));

  const back = () => {
    if (submission.isPending) return;
    if (step === 'change-place') setStep('form');
    else exitCreateSchedule();
  };

  return (
    <KeyboardAvoidingView className='flex-1 bg-background' behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <MobileHeader title='새 일정 추가' leftIcon={<ArrowLeft size={20} color='#1F1F1F' />} onLeftPress={back} />
      {!trip ? (
        <View className='flex-1 items-center justify-center p-md'>
          {isLoading && <ActivityIndicator />}
          <Text>{isLoading ? '여행 정보를 불러오는 중...' : '일정을 추가할 여행을 확인할 수 없어요.'}</Text>
        </View>
      ) : step !== 'form' ? (
        <ScheduleSearchPanel
          tripId={tripId}
          search={search}
          selectedLocation={draft.selectedLocation}
          returning={step === 'change-place'}
          onContinue={() => setStep('form')}
          onSelect={selectPlace}
        />
      ) : (
        <ScheduleForm
          form={form}
          location={{
            selectedLocation: draft.selectedLocation,
            searchAccess: search.policy,
            isPending: submission.isPending,
            onSearch: () => setStep('change-place'),
            onEditLocationManually: draft.editLocationManually,
          }}
          submission={{
            creationPolicy: policy.schedule.create,
            submitError: submission.submitError,
            isPending: submission.isPending,
            onSubmit,
            onCancel: exitCreateSchedule,
          }}
          onShowDatePicker={draft.handleShowDatePicker}
          onShowTimePicker={draft.handleShowTimePicker}
        />
      )}
      <DatePicker
        visible={draft.datePickerVisible}
        onClose={() => draft.handleSelectDate(form.getValues('date'))}
        onSelectDate={draft.handleSelectDate}
      />
      <TimePicker
        visible={draft.timePickerVisible}
        onClose={() => draft.handleSelectTime(form.getValues('time'))}
        onSelectTime={draft.handleSelectTime}
        initialTime={form.watch('time') || '09:00'}
      />
    </KeyboardAvoidingView>
  );
}
