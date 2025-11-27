import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { ChevronRight, Plus } from 'lucide-react-native';
import { TripsSection } from './TripsSection';
import { Alert } from 'react-native';
import { useNetworkStatus } from '@/shared/store/network';

export default function HomeScreen() {
  // 네트워크 상태
  const networkStatus = useNetworkStatus();
  const isOnline = networkStatus === 'online';

  const upcomingSchedules = [
    {
      time: '14:00',
      title: '에펠탑 방문',
      location: '파리, 프랑스',
      date: '3월 15일',
      expense: '41.50',
      expenseCount: 2,
    },
    {
      time: '10:00',
      title: '루브르 박물관',
      location: '파리, 프랑스',
      date: '3월 16일',
      expense: '17.00',
      expenseCount: 1,
    },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader title='NOLINE' />

      <ScrollView className='flex-1'>
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

            {/* To do 상황에 따른 UI 제공으로 추후 수정하기 */}
            {/* Upcoming Schedule Section */}
            {/* <View className='flex-col gap-sm'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-title-large text-foreground'>다가오는 일정</Text>
                <Pressable variant='ghost' className='flex-row items-center gap-3xs'>
                  <Text className='text-body text-primary'>전체보기</Text>
                  <ChevronRight size={16} color='hsl(120, 61%, 34%)' strokeWidth={2} />
                </Pressable>
              </View>

              {upcomingSchedules.map((schedule, index) => (
                <ScheduleCard
                  key={index}
                  {...schedule}
                  onPress={() => {
                    // TODO: Navigate to schedule detail
                    console.log('Navigate to schedule detail');
                  }}
                />
              ))}
            </View> */}
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
