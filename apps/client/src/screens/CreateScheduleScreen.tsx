import { View, ActivityIndicator, Text } from 'react-native';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Container, MobileHeader, DatePicker, TimePicker } from '@/shared/components';
import { useStep } from '@/shared/hooks/useStep';
import {
  useCreateScheduleForm,
  useLocationSearch,
  LocationSearchBar,
  LocationSearchResults,
  MapView,
  ScheduleForm,
  type Location,
} from '@/features/schedule/create-schedule';
import { useGetTrips, type TripResponse } from '@/entities/trip';

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
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/schedule');
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    clearSearch();
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
        <Container>
          <View className='flex-1 items-center justify-center'>
            <ActivityIndicator size='large' color='#228B22' />
            <Text className='text-body text-muted-foreground mt-md'>여행 정보 불러오는 중...</Text>
          </View>
        </Container>
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
      {currentStep === STEPS.SEARCH && (
        <Container>
          <LocationSearchBar value={searchQuery} onChangeText={handleSearch} onClear={clearSearch} autoFocus />
        </Container>
      )}

      {/* 지도 영역 + 결과/폼 */}
      <View className='flex-1 relative'>
        <MapView locations={results} selectedLocation={selectedLocation} />

        {/* 검색 결과 리스트 (검색 단계 + 검색 중이거나 결과 있을 때) */}
        {currentStep === STEPS.SEARCH && (isSearching || results.length > 0) && (
          <LocationSearchResults results={results} onSelectLocation={handleSelectLocation} isSearching={isSearching} />
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
      </View>

      {/* Date Picker (폼 단계에서만 활성) */}
      {currentStep === STEPS.FORM && (
        <DatePicker
          visible={datePickerVisible}
          onClose={() => handleSelectDate(watch('date') || '')}
          onSelectDate={handleSelectDate}
        />
      )}

      {/* Time Picker (폼 단계에서만 활성) */}
      {currentStep === STEPS.FORM && (
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
