import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack, ScheduleCard } from '@/shared/components';

type ViewMode = 'list' | 'map';

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState('3/15');

  // TODO: Replace with real data
  const dates = ['3/15', '3/16', '3/17', '3/18', '3/19', '3/20'];

  const schedules = [
    {
      order: 1,
      time: '09:00',
      title: '에펠탑 방문',
      location: '에펠탑',
      expense: '26.00',
      expenseCount: 1,
    },
    {
      order: 2,
      time: '14:00',
      title: '루브르 박물관',
      location: '루브르',
      expense: '17.00',
      expenseCount: 2,
    },
    {
      order: 3,
      time: '19:00',
      title: '저녁식사',
      location: '샹젤리제 거리',
      expense: undefined,
      expenseCount: 0,
    },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View
        className='flex-row items-center justify-between border-b border-card-border bg-background px-sm'
        style={{ height: 56 }}
      >
        <Pressable className='flex-row items-center gap-xs'>
          <Text className='text-title-large text-foreground'>▼ 파리, 프랑스</Text>
        </Pressable>
        <View className='flex-row items-center gap-xs'>
          <Pressable className='h-10 w-10 items-center justify-center'>
            <Text className='text-body'>≡</Text>
          </Pressable>
          <Pressable
            className='h-10 w-10 items-center justify-center'
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <Text className='text-body'>{viewMode === 'list' ? '🗺️' : '📋'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Date Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className='border-b border-card-border bg-background'
        contentContainerClassName='px-sm'
        style={{ maxHeight: 48 }}
      >
        {dates.map((date) => (
          <Pressable
            key={date}
            className={`mr-2xs rounded-md px-sm py-2xs ${selectedDate === date ? 'bg-primary' : 'bg-transparent'}`}
            onPress={() => setSelectedDate(date)}
          >
            <Text className={`text-body ${selectedDate === date ? 'text-primary-foreground' : 'text-foreground'}`}>
              {date}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView className='flex-1'>
          <Container>
            <Stack direction='vertical' gap='md' className='py-sm'>
              <Text className='text-title-large text-foreground'>📅 2025년 3월 15일</Text>

              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.order}
                  {...schedule}
                  onPress={() => {
                    // TODO: Navigate to schedule detail
                    console.log('Navigate to schedule detail');
                  }}
                />
              ))}
            </Stack>
          </Container>
        </ScrollView>
      ) : (
        <View className='flex-1 items-center justify-center bg-muted'>
          <Text className='text-title-large text-muted-foreground'>🗺️ 지도 뷰 (구현 예정)</Text>
        </View>
      )}

      {/* FAB (Floating Action Button) */}
      <Pressable
        className='absolute bottom-20 right-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg'
        onPress={() => {
          // TODO: Open add schedule drawer
          console.log('Open add schedule drawer');
        }}
      >
        <Text className='text-display-medium text-primary-foreground'>+</Text>
      </Pressable>
    </View>
  );
}
