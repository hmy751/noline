import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Stack } from '@/shared/components/layout/Stack';
import { City } from './geonames.api';

interface CitySearchResultsProps {
  cities: City[];
  isLoading: boolean;
  error: Error | null;
  debouncedSearchQuery: string;
  handleSelectCity: (city: City) => void;
}

export function CitySearchResults({
  cities,
  isLoading,
  error,
  debouncedSearchQuery,
  handleSelectCity,
}: CitySearchResultsProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <View className='flex-1 justify-center items-center py-20'>
          <ActivityIndicator size='large' color='#228B22' />
          <Text className='text-body text-muted-foreground mt-4'>Searching for cities...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className='flex-1 justify-center items-center py-20'>
          <Text className='text-body text-destructive text-center'>Failed to fetch cities. Please try again.</Text>
        </View>
      );
    }

    if (debouncedSearchQuery && !isLoading && cities && cities.length === 0) {
      return (
        <View className='flex-1 justify-center items-center py-20'>
          <Text className='text-body text-muted-foreground'>No cities found.</Text>
        </View>
      );
    }

    if (!debouncedSearchQuery) {
      return (
        <View className='flex-1 justify-center items-center py-20'>
          <View className='items-center mb-6'>
            <MapPin size={80} color='#228B22' strokeWidth={1.5} />
          </View>
          <Stack gap='4xs' className='items-center'>
            <Text className='text-body-large text-foreground text-center'>여행하고 싶은 도시를 검색해보세요</Text>
            <Text className='text-body text-muted-foreground text-center'>예: 파리, 도쿄, 뉴욕, 런던</Text>
          </Stack>
        </View>
      );
    }

    return cities.map((city) => (
      <TouchableOpacity
        key={city.id}
        className='flex-row items-center p-4 border-b border-gray-200'
        onPress={() => handleSelectCity(city)}
      >
        <MapPin size={20} color='hsl(0, 0%, 50%)' className='mr-4' />
        <View>
          <Text className='text-body-large text-foreground'>{city.name}</Text>
          <Text className='text-body text-muted-foreground'>{city.country}</Text>
        </View>
      </TouchableOpacity>
    ));
  };

  return <ScrollView className='flex-1 px-4'>{renderContent()}</ScrollView>;
}
