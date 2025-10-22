import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useGetSchedules } from '@/entities/schedule';
import { Pressable } from '@repo/ui';
import { Menu, Map, List } from 'lucide-react-native';

type ViewMode = 'list' | 'map';

interface ScheduleByDate {
  date: string;
  dateLabel: string;
  schedules: Array<{
    id: string;
    time: string;
    title: string;
    location: string;
    expense?: string;
    expenseCount?: number;
  }>;
}

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const { data: schedules = [], isLoading } = useGetSchedules(selectedTripId || '');

  const schedulesByDate: ScheduleByDate[] = schedules.reduce((acc, schedule) => {
    const scheduleDate = new Date(schedule.startTime);
    const dateString = scheduleDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = scheduleDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

    const existingGroup = acc.find((group) => group.date === dateString);

    if (existingGroup) {
      existingGroup.schedules.push({
        id: schedule.id,
        time,
        title: schedule.title,
        location: schedule.location || '',
      });
    } else {
      acc.push({
        date: dateString,
        dateLabel: dateString,
        schedules: [
          {
            id: schedule.id,
            time,
            title: schedule.title,
            location: schedule.location || '',
          },
        ],
      });
    }

    return acc;
  }, [] as ScheduleByDate[]);

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
          setSelectedTripId(trip.value);
          console.log('Selected trip:', trip);
        }}
        className='border-b border-card-border bg-background px-md py-sm'
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView className='flex-1'>
          <Container>
            {isLoading ? (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>일정을 불러오는 중...</Text>
              </View>
            ) : schedulesByDate.length === 0 ? (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>등록된 일정이 없습니다</Text>
                {selectedTripId && (
                  <Pressable
                    variant='default'
                    className='mt-md'
                    onPress={() => {
                      const today = new Date().toISOString().split('T')[0];
                      router.push(`/create-schedule?tripId=${selectedTripId}&date=${today}`);
                    }}
                  >
                    첫 일정 추가하기
                  </Pressable>
                )}
              </View>
            ) : (
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
                          if (selectedTripId) {
                            router.push(`/create-schedule?tripId=${selectedTripId}&date=${group.date}`);
                          }
                        }}
                      >
                        <Text className='text-label text-foreground'>추가</Text>
                      </Pressable>
                    </View>

                    {/* Schedules for this date */}
                    {group.schedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.id}
                        date={group.dateLabel}
                        {...schedule}
                        onPress={() => {
                          // TODO: Navigate to schedule detail
                          console.log('Navigate to schedule detail:', schedule.id);
                        }}
                      />
                    ))}
                  </View>
                ))}
              </Stack>
            )}
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
