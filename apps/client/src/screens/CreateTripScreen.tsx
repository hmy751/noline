import React, { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Container } from '@/shared/components/layout/Container';
import { MobileHeader } from '@/shared/components';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { City } from '@/features/trip/create/geonames.api';
import { useSearchCities } from '@/features/trip/create/useSearchCities';
import { CitySearchBar } from '@/features/trip/create/CitySearchBar';
import { CitySearchResults } from '@/features/trip/create/CitySearchResults';

export default function CreateTripScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: cities = [], isLoading, error, isFetching } = useSearchCities(debouncedSearchQuery);

  const handleSelectCity = (city: City) => {
    console.log('Selected city:', city);
    // TODO: Navigate to the next step of trip creation
    // router.push({ pathname: '/add-trip-details', params: { city: JSON.stringify(city) } });
  };

  return (
    <Container className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='여행지 선택'
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={() => router.back()}
      />

      {/* Search Bar */}
      <CitySearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Content */}
      <CitySearchResults
        cities={cities}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        debouncedSearchQuery={debouncedSearchQuery}
        handleSelectCity={handleSelectCity}
      />
    </Container>
  );
}
