import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack, TripCard, ScheduleCard } from '@/shared/components';
import { Wifi, ChevronRight, Plus } from 'lucide-react-native';

export default function HomeScreen() {
  // TODO: Replace with real data
  const currentTrip = {
    destination: '파리',
    country: '프랑스',
    startDate: '3월 15일',
    endDate: '3월 20일',
    scheduleCount: 12,
    totalExpense: '1,250.00',
    currency: 'EUR',
  };

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
      <View className='h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm'>
        <Text className='text-title-large font-semibold text-foreground'>Noline</Text>
        <View className='flex-row items-center gap-3xs'>
          <Wifi size={14} color='hsl(140, 65%, 45%)' strokeWidth={2} />
          <Text className='text-body text-status-online'>온라인</Text>
        </View>
      </View>

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Current Trip Card */}
            <TripCard {...currentTrip} />

            {/* Add New Trip Button */}
            <Pressable
              className='flex-row items-center justify-center gap-2xs rounded-lg border border-card-border bg-card py-md active:bg-muted'
              onPress={() => {
                // TODO: Open add trip drawer
                console.log('Open add trip drawer');
              }}
            >
              <Plus size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              <Text className='text-body text-foreground'>새 여행 추가</Text>
            </Pressable>

            {/* Upcoming Schedule Section */}
            <View className='flex-col gap-sm'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-title-large text-foreground'>다가오는 일정</Text>
                <Pressable className='flex-row items-center gap-3xs'>
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
            </View>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
