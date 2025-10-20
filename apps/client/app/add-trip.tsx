import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { Container } from '@/shared/components/layout/Container';
import { Stack } from '@/shared/components/layout/Stack';
import { MobileHeader } from '@/shared/components';
import { Input } from '@repo/ui';

export default function AddTripScreen() {
  const [searchQuery, setSearchQuery] = useState('');

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
          />
        </View>
      </View>

      {/* Empty State */}
      <ScrollView className='flex-1 px-4'>
        <View className='flex-1 justify-center items-center py-20'>
          <View className='items-center mb-6'>
            <MapPin size={80} color='#228B22' strokeWidth={1.5} />
          </View>
          <Stack gap={2} className='items-center'>
            <Text className='text-body-large text-foreground text-center'>여행하고 싶은 도시를 검색해보세요</Text>
            <Text className='text-body text-muted-foreground text-center'>예: 파리, 도쿄, 뉴욕, 런던</Text>
          </Stack>
        </View>
      </ScrollView>
    </Container>
  );
}
