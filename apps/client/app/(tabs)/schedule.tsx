import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Container, Stack, ScheduleCard, TripSelector, MobileHeader } from '@/shared/components';
import { Pressable } from '@repo/ui';
import { Menu, Map, List } from 'lucide-react-native';

type ViewMode = 'list' | 'map';

interface ScheduleByDate {
  date: string;
  dateLabel: string;
  schedules: Array<{
    time: string;
    title: string;
    location: string;
    expense?: string;
    expenseCount?: number;
  }>;
}

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // TODO: Replace with real data
  const schedulesByDate: ScheduleByDate[] = [
    {
      date: '2025-03-15',
      dateLabel: '2025-03-15',
      schedules: [
        {
          time: '09:00',
          title: '에펠탑 방문',
          location: '에펠탑',
        },
        {
          time: '14:00',
          title: '센강 유람선',
          location: '센강',
        },
        {
          time: '19:00',
          title: '상젤리제 거리 산책',
          location: '상젤리제',
        },
      ],
    },
    {
      date: '2025-03-16',
      dateLabel: '2025-03-16',
      schedules: [
        {
          time: '10:00',
          title: '루브르 박물관',
          location: '루브르',
        },
        {
          time: '15:00',
          title: '카페 런치',
          location: '카페 런치',
        },
      ],
    },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader
        title='일정'
        rightAction={
          <View className='flex-row items-center gap-2xs'>
            <Pressable
              variant='ghost'
              className='h-10 w-10 items-center justify-center rounded-full active:bg-muted'
              accessibilityRole='button'
              accessibilityLabel='메뉴 열기'
            >
              <Menu size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
            </Pressable>
            <Pressable
              variant='ghost'
              className='h-10 w-10 items-center justify-center rounded-full active:bg-muted'
              onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              accessibilityRole='button'
              accessibilityLabel={viewMode === 'list' ? '지도 보기로 전환' : '목록 보기로 전환'}
            >
              {viewMode === 'list' ? (
                <Map size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              ) : (
                <List size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
              )}
            </Pressable>
          </View>
        }
      />

      {/* Current Trip Selector - Sticky */}
      <TripSelector
        onTripChange={(trip) => {
          // TO DO 컨텍스트 또는 전역상태 정의
          console.log('Selected trip:', trip);
        }}
        className='border-b border-card-border bg-background px-md py-sm'
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView className='flex-1'>
          <Container>
            <Stack direction='vertical' gap='md' className='py-sm'>
              {/* Schedule Groups by Date */}
              {schedulesByDate.map((group) => (
                <View key={group.date} className='flex-col gap-sm'>
                  {/* Date Header with Count */}
                  <View className='flex-row items-center justify-between'>
                    <View className='flex-row items-center gap-2xs'>
                      <Text className='text-title-large text-foreground'>{group.dateLabel}</Text>
                      <View className='rounded-full bg-muted px-xs py-3xs'>
                        <Text className='text-label text-foreground'>{group.schedules.length}개</Text>
                      </View>
                    </View>
                    <Pressable
                      variant='outline'
                      className='flex-row items-center gap-3xs rounded-md border border-card-border bg-card px-xs py-3xs active:bg-muted'
                      onPress={() => {
                        // TODO: Open add schedule for this date
                        console.log('Add schedule for', group.date);
                      }}
                    >
                      <Text className='text-label text-foreground'>추가</Text>
                    </Pressable>
                  </View>

                  {/* Schedules for this date */}
                  {group.schedules.map((schedule, index) => (
                    <ScheduleCard
                      key={index}
                      date={group.dateLabel}
                      {...schedule}
                      onPress={() => {
                        // TODO: Navigate to schedule detail
                        console.log('Navigate to schedule detail');
                      }}
                    />
                  ))}
                </View>
              ))}
            </Stack>
          </Container>
        </ScrollView>
      ) : (
        <View className='flex-1 items-center justify-center bg-muted'>
          <Map size={48} color='hsl(120, 8%, 35%)' strokeWidth={1.5} />
          <Text className='mt-sm text-title-medium text-muted-foreground'>지도 뷰 (구현 예정)</Text>
        </View>
      )}
    </View>
  );
}
