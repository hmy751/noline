import { View, ActivityIndicator, Text, Keyboard } from 'react-native';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MobileHeader, DatePicker, TimePicker, PolicyBasedMapView, PolicyErrorDisplay } from '@/shared/components';
import { useStep } from '@/shared/hooks/useStep';
import {
  useCreateScheduleForm,
  useLocationSearch,
  LocationSearchBar,
  LocationSearchResults,
  ScheduleForm,
  ManualScheduleForm,
  type Location,
} from '@/features/schedule/create-schedule';
import { useGetTrips, type TripResponse } from '@/entities/trip';
import { useAppPolicy } from '@/shared/policy';

const STEPS = {
  SEARCH: 1, // 장소 검색 단계
  FORM: 2, // 일정 입력 폼 단계
} as const;

export default function CreateScheduleScreen() {
  const params = useLocalSearchParams<{ tripId?: string; date?: string }>();
  const tripId = params.tripId || '';
  const prefilledDate = params.date;

  // Trip 정보 조회
  const { data: tripsData, isLoading: isLoadingTrips } = useGetTrips();
  const currentTrip = tripsData?.find((trip: TripResponse) => trip.id === tripId);

  // ✅ Policy 체크: 모든 정책 조회
  const policy = useAppPolicy(tripId);

  // 단계 관리
  const { currentStep, goToNextStep, goToPrevStep } = useStep({
    initialStep: STEPS.SEARCH,
    maxStep: STEPS.FORM,
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // 여행 도시 정보를 검색에 전달
  const cityContext = currentTrip
    ? {
        cityName: currentTrip.destination,
        latitude: currentTrip.latitude ? parseFloat(currentTrip.latitude) : undefined,
        longitude: currentTrip.longitude ? parseFloat(currentTrip.longitude) : undefined,
      }
    : undefined;

  const { searchQuery, results, isSearching, handleSearch, clearSearch } = useLocationSearch(cityContext);

  const {
    form,
    isPending,
    datePickerVisible,
    timePickerVisible,
    handleShowTimePicker,
    handleSelectDate,
    handleSelectTime,
    onSubmit,
  } = useCreateScheduleForm({
    tripId,
    selectedLocation,
    onSuccess: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/schedule');
      }
    },
  });

  const { watch } = form;

  // prefilledDate가 있으면 초기값으로 설정
  if (prefilledDate && !watch('date')) {
    form.setValue('date', prefilledDate);
  }

  const handleBackPress = () => {
    if (currentStep === STEPS.FORM) {
      handleClearLocation();
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/schedule');
    }
  };

  const handleSelectLocation = (location: Location) => {
    Keyboard.dismiss();
    setSelectedLocation(location);
    // clearSearch(); // 검색 결과를 바로 지우지 않도록 주석 처리
    goToNextStep(); // 검색 → 폼 단계로 이동
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    form.reset();
    goToPrevStep(); // 폼 → 검색 단계로 이동
  };

  const handleCancel = () => {
    handleClearLocation();
  };

  // Trip 로딩 중
  if (isLoadingTrips) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='새 일정 추가'
          leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
          onLeftPress={handleBackPress}
        />
        <View className='flex-1 items-center justify-center px-sm'>
          <ActivityIndicator size='large' color='#228B22' />
          <Text className='text-body text-muted-foreground mt-md'>여행 정보 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // ✅ Policy 체크: Schedule 생성이 허용되지 않는 경우
  if (!policy.schedule.create.allowed) {
    return (
      <View className='flex-1 bg-background'>
        <MobileHeader
          title='새 일정 추가'
          leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
          onLeftPress={handleBackPress}
        />
        <PolicyErrorDisplay permission={policy.schedule.create} variant='block' />
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='새 일정 추가'
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={handleBackPress}
      />

      {/* 검색창 (검색 단계에만 표시) */}
      {/* ⚠️ Policy: manual-only mode에서는 검색창 숨김 */}
      {currentStep === STEPS.SEARCH && policy.schedule.create.mode !== 'manual-only' && (
        <LocationSearchBar value={searchQuery} onChangeText={handleSearch} onClear={clearSearch} autoFocus />
      )}

      {/* ⚠️ Policy: manual-only mode 안내 메시지 */}
      {policy.schedule.create.mode === 'manual-only' && (
        <PolicyErrorDisplay permission={policy.schedule.create} variant='banner' />
      )}

      {/* 지도 영역 + 결과/폼 */}
      <View className='flex-1 relative' onTouchStart={() => Keyboard.dismiss()}>
        <PolicyBasedMapView tripId={tripId} locations={results} selectedLocation={selectedLocation} />

        {/* 검색 결과 리스트 (검색 단계 + 검색 중이거나 결과 있을 때) */}
        {/* ⚠️ Policy: manual-only mode에서는 검색 결과 숨김 */}
        {currentStep === STEPS.SEARCH &&
          policy.schedule.create.mode !== 'manual-only' &&
          (isSearching || results.length > 0) && (
            <LocationSearchResults
              results={results}
              onSelectLocation={handleSelectLocation}
              isSearching={isSearching}
            />
          )}

        {/* 일정 입력 폼 (폼 단계일 때) */}
        {currentStep === STEPS.FORM && selectedLocation && (
          <ScheduleForm
            selectedLocation={selectedLocation}
            form={form}
            onClearLocation={handleClearLocation}
            onShowTimePicker={handleShowTimePicker}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isPending={isPending}
          />
        )}

        {/* Manual Input 폼 (manual-only 모드일 때) */}
        {policy.schedule.create.mode === 'manual-only' && (
          <ManualScheduleForm
            form={form}
            onShowTimePicker={handleShowTimePicker}
            onSubmit={onSubmit}
            onCancel={handleBackPress}
            isPending={isPending}
          />
        )}
      </View>

      {/* Date Picker (폼 단계 또는 manual-only 모드에서 활성) */}
      {(currentStep === STEPS.FORM || policy.schedule.create.mode === 'manual-only') && (
        <DatePicker
          visible={datePickerVisible}
          onClose={() => handleSelectDate(watch('date') || '')}
          onSelectDate={handleSelectDate}
        />
      )}

      {/* Time Picker (폼 단계 또는 manual-only 모드에서 활성) */}
      {(currentStep === STEPS.FORM || policy.schedule.create.mode === 'manual-only') && (
        <TimePicker
          visible={timePickerVisible}
          onClose={() => handleSelectTime(watch('time') || '09:00')}
          onSelectTime={handleSelectTime}
          initialTime={watch('time') || '09:00'}
        />
      )}
    </View>
  );
}
