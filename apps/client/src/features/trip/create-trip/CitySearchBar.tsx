import React from 'react';
import { View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Input } from '@repo/ui';

interface CitySearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function CitySearchBar({ searchQuery, setSearchQuery }: CitySearchBarProps) {
  return (
    <View className='py-4'>
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
  );
}
