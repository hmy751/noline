import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Container, Stack, ScheduleCard, MobileHeader, ScheduleMapView, MapScheduleCard } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useGetSchedules } from '@/entities/schedule';
import { useGetTrips, selectMainTrip } from '@/entities/trip';
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
    latitude?: number;
    longitude?: number;
  }>;
}

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const carouselRef = useRef<ScrollView>(null);

  const { data: trips = [] } = useGetTrips();
  const { data: schedules = [], isLoading } = useGetSchedules(selectedTripId || '');

  // 메인 여행 자동 선택
  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      const mainTrip = selectMainTrip(trips);
      if (mainTrip) {
        setSelectedTripId(mainTrip.id);
      }
    }
  }, [trips, selectedTripId]);

  // 선택된 여행 정보
  const selectedTrip = trips.find((trip: { id: string }) => trip.id === selectedTripId);

  // 여행 날짜 범위에서 모든 날짜 생성
  const generateDateRange = (): string[] => {
    if (!selectedTrip?.startDate || !selectedTrip?.endDate) return [];

    const dates: string[] = [];
    const start = new Date(selectedTrip.startDate);
    const end = new Date(selectedTrip.endDate);

    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const dateRange = generateDateRange();

  // 최초 날짜 선택
  useEffect(() => {
    if (dateRange.length > 0 && !selectedDate) {
      setSelectedDate(dateRange[0]);
    }
  }, [dateRange, selectedDate]);

  // 날짜별로 일정 그룹화
  const schedulesByDate: ScheduleByDate[] = useMemo(() => {
    return dateRange.map((date) => {
      const daySchedules = schedules
        .filter((schedule) => {
          return schedule.date === date;
        })
        .map((schedule) => {
          return {
            id: schedule.id,
            time: schedule.time,
            title: schedule.title,
            location: schedule.location || '',
            latitude: schedule.latitude ? parseFloat(schedule.latitude) : undefined,
            longitude: schedule.longitude ? parseFloat(schedule.longitude) : undefined,
          };
        });

      return {
        date,
        dateLabel: date,
        schedules: daySchedules,
      };
    });
  }, [dateRange, schedules]);

  const schedulesForMap = useMemo(() => {
    return schedulesByDate.find((group) => group.date === selectedDate)?.schedules || [];
  }, [schedulesByDate, selectedDate]);

  // 날짜 변경 시 캐러셀 초기화
  useEffect(() => {
    if (schedulesForMap.length > 0) {
      setSelectedScheduleId(schedulesForMap[0].id);
      carouselRef.current?.scrollTo({ x: 0, animated: false });
    } else {
      setSelectedScheduleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
          if (trip) {
            setSelectedTripId(trip.value);
            setSelectedDate(null); // 여행 변경 시 날짜 선택 초기화
          }
        }}
        className='border-b border-card-border'
      />

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView className='flex-1'>
          <Container>
            {!selectedTrip ? (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>여행을 선택해주세요</Text>
              </View>
            ) : !selectedTrip.startDate || !selectedTrip.endDate ? (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>여행 날짜를 설정해주세요</Text>
              </View>
            ) : isLoading ? (
              <View className='flex-1 items-center justify-center py-xl'>
                <Text className='text-body text-muted-foreground'>일정을 불러오는 중...</Text>
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
                    {group.schedules.length > 0 ? (
                      group.schedules.map((schedule) => (
                        <ScheduleCard
                          key={schedule.id}
                          date={group.dateLabel}
                          {...schedule}
                          onPress={() => router.push(`/schedules/${schedule.id}`)}
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
            )}
          </Container>
        </ScrollView>
      ) : (
        <View className='flex-1'>
          <ScheduleMapView
            schedules={schedulesForMap.map((schedule) => ({
              id: schedule.id,
              title: schedule.title,
              location: schedule.location || '',
              latitude: schedule.latitude,
              longitude: schedule.longitude,
              time: schedule.time,
            }))}
            onSchedulePress={(scheduleId: string) => router.push(`/schedules/${scheduleId}`)}
            selectedScheduleId={selectedScheduleId}
            onMarkerPress={(scheduleId) => {
              setSelectedScheduleId(scheduleId);
              const index = schedulesForMap.findIndex((s) => s.id === scheduleId);
              if (index > -1 && carouselRef.current) {
                // 카드 너비 340px + gap 16px = 356px
                carouselRef.current.scrollTo({ x: index * 356, animated: true });
              }
            }}
          />
          {/* 날짜 선택 UI */}
          <View className='absolute left-0 right-0 top-0'>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            >
              <View className='flex-row gap-2xs'>
                {dateRange.map((date) => (
                  <Pressable
                    key={date}
                    className={`rounded-full px-xs py-3xs ${
                      selectedDate === date ? 'bg-primary' : 'border border-white/20 bg-card/80 backdrop-blur-sm'
                    }`}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      className={`text-label ${selectedDate === date ? 'text-primary-foreground' : 'text-foreground'}`}
                    >
                      {date}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          {/* 하단 카드 캐러셀 */}
          {schedulesForMap.length > 0 && (
            <View className='absolute bottom-0 left-0 right-0'>
              <ScrollView
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                snapToInterval={356}
                decelerationRate='fast'
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / 356);
                  if (schedulesForMap[index]) {
                    setSelectedScheduleId(schedulesForMap[index].id);
                  }
                }}
              >
                {schedulesForMap.map((schedule, index) => (
                  <View key={schedule.id} className='mr-sm'>
                    <MapScheduleCard
                      index={index}
                      title={schedule.title}
                      location={schedule.location}
                      date={selectedDate || ''}
                      time={schedule.time}
                      onPressDetails={() => router.push(`/schedules/${schedule.id}`)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
