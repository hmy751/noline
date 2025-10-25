import { useState, useMemo } from 'react';
import { View } from 'react-native';
import { MobileHeader } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useGetSchedules } from '@/entities/schedule';
import { useGetTrips } from '@/entities/trip';
import { useTripStore } from '@/shared/store';
import { Pressable } from '@repo/ui';
import { Menu, Map, List } from 'lucide-react-native';
import { ScheduleListView } from '@/features/schedule/schedule-list-view';
import { ScheduleMapViewContainer } from '@/features/schedule/schedule-map-view';
import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';

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
  const { selectedTripId } = useTripStore();

  const { data: trips = [] } = useGetTrips();
  const { data: schedules = [], isLoading } = useGetSchedules(selectedTripId || '');

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

  // 날짜별로 일정 그룹화
  const schedulesByDate: ScheduleByDate[] = useMemo(() => {
    return dateRange.map((date) => {
      const daySchedules = schedules
        .filter((schedule) => {
          return formatISOToLocalDate(schedule.scheduledAt) === date;
        })
        .map((schedule) => {
          return {
            id: schedule.id,
            time: formatISOToLocalTime(schedule.scheduledAt),
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
      <TripSelector className='border-b border-card-border' />

      {/* Content */}
      {viewMode === 'list' ? (
        <ScheduleListView
          schedulesByDate={schedulesByDate}
          selectedTripId={selectedTripId}
          isLoading={isLoading}
          hasTrip={!!selectedTrip}
          hasDates={!!(selectedTrip?.startDate && selectedTrip?.endDate)}
        />
      ) : (
        <ScheduleMapViewContainer
          dateRange={dateRange}
          schedulesByDate={schedulesByDate}
          initialDate={dateRange[0] || null}
        />
      )}
    </View>
  );
}
