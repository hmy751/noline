import React, { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Container } from '@/shared/components/layout/Container';
import { MobileHeader } from '@/shared/components';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { City } from '@/features/trip/create-trip/geonames.api';
import { useSearchCities, CitySearchBar, CitySearchResults, TripDateForm } from '@/features/trip/create-trip';
import { useStep } from '@/shared/hooks/useStep';

export default function CreateTripScreen() {
  const { currentStep, goToNextStep, goToPrevStep } = useStep({ maxStep: 2 });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const { data: cities = [], isLoading, error, isFetching } = useSearchCities(debouncedSearchQuery);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    goToNextStep();
  };

  const handleBackToSearch = () => {
    setSelectedCity(null);
    goToPrevStep();
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Step에 따른 헤더 설정
  const headerTitle = currentStep === 1 ? '여행지 선택' : '여행 일정 선택';
  const headerBackAction = currentStep === 1 ? handleBackPress : handleBackToSearch;

  return (
    <Container className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title={headerTitle}
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={headerBackAction}
      />

      {/* Content */}
      {currentStep === 1 ? (
        <>
          <CitySearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <CitySearchResults
            cities={cities}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            debouncedSearchQuery={debouncedSearchQuery}
            handleSelectCity={handleSelectCity}
          />
        </>
      ) : (
        selectedCity && <TripDateForm city={selectedCity} />
      )}
    </Container>
  );
}
