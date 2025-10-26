import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard } from '@/shared/components';
import { Pressable } from '@repo/ui';

interface Schedule {
  id: string;
  tripId: string;
  scheduledAt: string;
  time: string;
  title: string;
  location: string;
  expense?: string;
  expenseCount?: number;
}

interface ScheduleByDate {
  date: string;
  dateLabel: string;
  schedules: Schedule[];
}

interface ScheduleListViewProps {
  schedulesByDate: ScheduleByDate[];
  selectedTripId: string | null;
  isLoading: boolean;
  hasTrip: boolean;
  hasDates: boolean;
}

export function ScheduleListView({
  schedulesByDate,
  selectedTripId,
  isLoading,
  hasTrip,
  hasDates,
}: ScheduleListViewProps) {
  if (!hasTrip) {
    return (
      <ScrollView className='flex-1'>
        <Container>
          <View className='flex-1 items-center justify-center py-xl'>
            <Text className='text-body text-muted-foreground'>여행을 선택해주세요</Text>
          </View>
        </Container>
      </ScrollView>
    );
  }

  if (!hasDates) {
    return (
      <ScrollView className='flex-1'>
        <Container>
          <View className='flex-1 items-center justify-center py-xl'>
            <Text className='text-body text-muted-foreground'>여행 날짜를 설정해주세요</Text>
          </View>
        </Container>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <ScrollView className='flex-1'>
        <Container>
          <View className='flex-1 items-center justify-center py-xl'>
            <Text className='text-body text-muted-foreground'>일정을 불러오는 중...</Text>
          </View>
        </Container>
      </ScrollView>
    );
  }

  return (
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
                    if (selectedTripId) {
                      router.push(`/create-schedule?tripId=${selectedTripId}&date=${group.date}`);
                    }
                  }}
                >
                  <Text className='text-label text-foreground'>추가</Text>
                </Pressable>
              </View>

              {/* Schedules for this date */}
              {group.schedules.length > 0 ? (
                group.schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    date={group.dateLabel}
                    {...schedule}
                    onPress={() =>
                      router.push(
                        `/schedules/${schedule.id}?tripId=${schedule.tripId}&scheduledAt=${encodeURIComponent(schedule.scheduledAt)}`,
                      )
                    }
                  />
                ))
              ) : (
                <View className='rounded-lg border border-dashed border-card-border bg-muted/30 px-md py-lg'>
                  <Text className='text-body text-center text-muted-foreground'>이 날의 일정을 추가해보세요</Text>
                </View>
              )}
            </View>
          ))}
        </Stack>
      </Container>
    </ScrollView>
  );
}
