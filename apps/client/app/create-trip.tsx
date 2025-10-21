import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { Container } from '@/shared/components/layout/Container';
import { Stack } from '@/shared/components/layout/Stack';
import { MobileHeader } from '@/shared/components';
import { Input } from '@repo/ui';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { City, searchCities } from '@/features/trip/create/geonames.api';

export default function AddTripScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchQuery) {
      const fetchCities = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const results = await searchCities(debouncedSearchQuery);
          setCities(results);
        } catch (err) {
          setError('Failed to fetch cities. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [debouncedSearchQuery]);

  const handleSelectCity = (city: City) => {
    console.log('Selected city:', city);
    // TODO: Navigate to the next step of trip creation
    // router.push({ pathname: '/add-trip-details', params: { city: JSON.stringify(city) } });
  };

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
          <Text className='text-body text-destructive text-center'>{error}</Text>
        </View>
      );
    }

    if (debouncedSearchQuery && cities.length === 0) {
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

  return (
    <Container className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='여행지 선택'
        leftIcon={<ArrowLeft size={20} color='#1F1F1F' />}
        onLeftPress={() => router.back()}
      />

      {/* Search Bar */}
      <View className='px-4 py-4'>
        <View className='relative w-full justify-center'>
          <View className='absolute left-4 z-10'>
            <Search size={20} color='hsl(0, 0%, 50%)' />
          </View>
          <Input
            placeholder='도시 또는 국가 검색 (예: 파리, 도쿄)'
            value={searchQuery}
            onChangeText={setSearchQuery}
            className='pl-12'
            autoCapitalize='none'
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView className='flex-1 px-4'>{renderContent()}</ScrollView>
    </Container>
  );
}
