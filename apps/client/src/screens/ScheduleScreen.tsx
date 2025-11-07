import { useState, useMemo } from 'react';
import { View, Alert } from 'react-native';
import { MobileHeader } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useGetSchedules, useDeleteSchedule } from '@/entities/schedule';
import { useGetTrips } from '@/entities/trip';
import { useTripStore } from '@/shared/store';
import { Pressable } from '@repo/ui';
import { Map, List } from 'lucide-react-native';
import { ScheduleListView } from '@/features/schedule/schedule-list-view';
import { ScheduleMapViewContainer } from '@/features/schedule/schedule-map-view';
import { ScheduleMenu } from '@/features/schedule/schedule-menu';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule';
import { formatISOToLocalDate, formatISOToLocalTime } from '@/shared/lib/datetime';

type ViewMode = 'list' | 'map';

interface ScheduleByDate {
  date: string;
  dateLabel: string;
  schedules: Array<{
    id: string;
    tripId: string;
    scheduledAt: string;
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
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    id: string;
    tripId: string;
    scheduledAt: string;
    time: string;
    title: string;
    location: string;
    expense?: string;
    expenseCount?: number;
  } | null>(null);
  const [buttonPosition, setButtonPosition] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  const { data: trips = [] } = useGetTrips();
  const { data: schedules = [], isLoading } = useGetSchedules(selectedTripId || '');
  const { mutate: deleteSchedule } = useDeleteSchedule();

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

  // 일정 메뉴 핸들러
  const handleScheduleMenuPress = (
    schedule: {
      id: string;
      tripId: string;
      scheduledAt: string;
      time: string;
      title: string;
      location: string;
      expense?: string;
      expenseCount?: number;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) => {
    setSelectedSchedule(schedule);
    // 버튼 위치 측정
    event.currentTarget.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setButtonPosition({ x: pageX, y: pageY, width, height });
    });
    setIsScheduleMenuOpen(true);
  };

  const handleEditSchedule = () => {
    setIsUpdateDrawerOpen(true);
  };

  const handleDeleteSchedule = () => {
    if (!selectedSchedule) return;

    Alert.alert(
      '일정 삭제',
      `"${selectedSchedule.title}" 일정을 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteSchedule(selectedSchedule.id, {
              onSuccess: () => {
                Alert.alert('성공', '일정이 삭제되었습니다.');
                setIsScheduleMenuOpen(false);
                setSelectedSchedule(null);
                setButtonPosition(undefined);
              },
              onError: () => {
                Alert.alert('오류', '일정 삭제에 실패했습니다.');
              },
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

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
            tripId: schedule.tripId,
            scheduledAt: schedule.scheduledAt,
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
            {/* <Pressable
              variant='ghost'
              className='h-10 w-10 items-center justify-center rounded-full active:bg-muted'
              accessibilityRole='button'
              accessibilityLabel='메뉴 열기'
            >
              <Menu size={20} color='hsl(0, 0%, 12%)' strokeWidth={2} />
            </Pressable> */}
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
          onScheduleMenuPress={handleScheduleMenuPress}
        />
      ) : (
        <ScheduleMapViewContainer
          tripId={selectedTripId || ''}
          dateRange={dateRange}
          schedulesByDate={schedulesByDate}
          initialDate={dateRange[0] || null}
        />
      )}

      {/* Schedule Menu */}
      <ScheduleMenu
        isOpen={isScheduleMenuOpen}
        onClose={() => {
          setIsScheduleMenuOpen(false);
          setButtonPosition(undefined);
          // selectedSchedule는 드로어에서 사용하므로 여기서 초기화하지 않음
        }}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
        buttonPosition={buttonPosition}
      />

      {/* Update Schedule Drawer */}
      <UpdateScheduleDrawer
        isOpen={isUpdateDrawerOpen}
        onClose={() => {
          setIsUpdateDrawerOpen(false);
          setSelectedSchedule(null); // 드로어를 닫을 때 초기화
        }}
        scheduleData={
          selectedSchedule
            ? {
                id: selectedSchedule.id,
                tripId: selectedSchedule.tripId,
                title: selectedSchedule.title,
                date: formatISOToLocalDate(selectedSchedule.scheduledAt),
                time: selectedSchedule.time,
              }
            : null
        }
      />
    </View>
  );
}
