import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { Plus } from 'lucide-react-native';
import { TripsSection } from './TripsSection';
import { Alert } from 'react-native';
import { useDisplayNetworkStatus } from '@/shared/store/network';
import { useGetTrips } from '@/entities/trip';
import { useState, useCallback } from 'react';

export default function HomeScreen() {
  // 네트워크 상태
  const networkStatus = useDisplayNetworkStatus();
  const isOnline = networkStatus === 'online';

  // Pull-to-Refresh
  const { refetch } = useGetTrips();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader title='NOLINE' />

      <ScrollView className='flex-1' refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Trips Section (Main + Other) */}
            <TripsSection />

            {/* Add New Trip Button */}
            <Pressable
              variant='outline'
              onPress={() => {
                if (!isOnline) {
                  Alert.alert('인터넷 연결 필요', '여행을 추가하려면 인터넷 연결이 필요합니다.');
                  return;
                }
                router.push('/create-trip');
              }}
            >
              <View className='flex-row items-center justify-center gap-2xs'>
                <Plus size={20} color='#1F1F1F' strokeWidth={2} />
                <Text className='text-body' style={{ color: '#1F1F1F' }}>
                  새 여행 추가
                </Text>
              </View>
            </Pressable>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
