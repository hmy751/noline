import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack, TripCard, ScheduleCard } from '@/shared/components';

export default function HomeScreen() {
  // TODO: Replace with real data
  const currentTrip = {
    destination: '파리',
    country: '프랑스',
    startDate: '2025.03.15',
    endDate: '2025.03.20',
    daysRemaining: 5,
  };

  const todaySchedules = [
    {
      order: 1,
      time: '09:00',
      title: '에펠탑 방문',
      location: '에펠탑',
      expense: '26.00',
    },
    {
      order: 2,
      time: '14:00',
      title: '루브르 박물관',
      location: '루브르',
      expense: '17.00',
    },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View className='h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm'>
        <Text className='text-display-large text-foreground'>🏠 Project</Text>
        <Pressable className='h-10 w-10 items-center justify-center'>
          <Text className='text-title-large'>👤</Text>
        </Pressable>
      </View>

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Current Trip Card */}
            <TripCard {...currentTrip} />

            {/* Total Expense Card */}
            <View className='rounded-lg bg-muted p-sm'>
              <Text className='text-label text-muted-foreground'>💰 총 경비</Text>
              <Text className='text-display-medium text-primary'>EUR 156.50</Text>
            </View>

            {/* Separator */}
            <View className='h-px w-full bg-border' />

            {/* Today's Schedule Section */}
            <View className='flex-col gap-sm'>
              <Text className='text-title-large text-foreground'>📅 오늘의 일정 (3월 15일)</Text>

              {todaySchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.order}
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

      {/* FAB (Floating Action Button) */}
      <Pressable
        className='absolute bottom-20 right-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg'
        onPress={() => {
          // TODO: Open add trip drawer
          console.log('Open add trip drawer');
        }}
      >
        <Text className='text-display-medium text-primary-foreground'>+</Text>
      </Pressable>
    </View>
  );
}
