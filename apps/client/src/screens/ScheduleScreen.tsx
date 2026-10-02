import { PolicyErrorDisplay } from '@/shared/components/ErrorBoundary';
import { useState, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { MobileHeader } from '@/shared/components';
import { TripSelector } from '@/entities/trip';
import { useDeleteSchedule } from '@/entities/schedule';
import { useGetTrips } from '@/entities/trip';
import { useTripStore } from '@/shared/store';
import { Pressable } from '@repo/ui';
import { Map, List } from 'lucide-react-native';
import { ScheduleListView } from '@/features/schedule/schedule-list-view';
import { ScheduleMapViewContainer } from '@/features/schedule/schedule-map-view';
import { ScheduleMenu } from '@/features/schedule/schedule-menu';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule';
import { formatISOToLocalDate, formatISOToLocalTime, getUTCDateRange } from '@/shared/lib/datetime';
import { useAppPolicy } from '@/shared/policy';
import { useTripSchedulesReadQuery } from '@/features/schedule/read-schedules';
import { ScheduleQueryFeedback, ScheduleRefreshError } from './ScheduleQueryFeedback';

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
    address?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    expense?: string;
    expenseCount?: number;
  }>;
}

export default function ScheduleScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { selectedTripId } = useTripStore();
  const [mapSelection, setMapSelection] = useState<{
    tripId: string | null;
    date: string | null;
    scheduleId: string | null;
  }>({ tripId: selectedTripId, date: null, scheduleId: null });
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(false);
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    id: string;
    tripId: string;
    scheduledAt: string;
    time: string;
    title: string;
    location: string;
    address?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    expense?: string;
    expenseCount?: number;
  } | null>(null);
  const [buttonPosition, setButtonPosition] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

  const { data: trips = [] } = useGetTrips();
  const { access, actions, view } = useTripSchedulesReadQuery(selectedTripId);
  const { refetch } = actions;
  const visibleSchedules = view.kind === 'ready' ? view.data : undefined;
  const canShowContent = view.kind === 'ready';
  const { mutate: deleteSchedule } = useDeleteSchedule();
  const policy = useAppPolicy(selectedSchedule?.tripId ?? selectedTripId ?? undefined);

  // Pull-to-Refresh
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!access.canFetch) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [access.canFetch, refetch]);

  // 선택된 여행 정보
  const selectedTrip = trips.find((trip: { id: string }) => trip.id === selectedTripId);

  // Trip의 기존 UTC 날짜 기준을 두 목록 화면에서 동일하게 사용한다.
  const dateRange = selectedTrip
    ? getUTCDateRange(selectedTrip.startDate, selectedTrip.endDate)
    : [];

  // 일정 메뉴 핸들러
  const handleScheduleMenuPress = (
    schedule: {
      id: string;
      tripId: string;
      scheduledAt: string;
      time: string;
      title: string;
      location: string;
      address?: string | null;
      latitude?: string | null;
      longitude?: string | null;
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
    if (!policy.schedule.update.allowed) {
      Alert.alert('일정을 수정할 수 없습니다', policy.schedule.update.reason);
      return;
    }
    setIsUpdateDrawerOpen(true);
  };

  const handleDeleteSchedule = () => {
    if (!selectedSchedule) {
      return;
    }
    if (!policy.schedule.delete.allowed) {
      Alert.alert('일정을 삭제할 수 없습니다', policy.schedule.delete.reason);
      return;
    }

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
            deleteSchedule(
              { id: selectedSchedule.id, tripId: selectedSchedule.tripId },
              {
                onSuccess: () => {
                  Alert.alert('성공', '일정이 삭제되었습니다.');
                  setIsScheduleMenuOpen(false);
                  setSelectedSchedule(null);
                  setButtonPosition(undefined);
                },
                onError: () => {
                  Alert.alert('오류', '일정 삭제에 실패했습니다.');
                },
              },
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  // 날짜별로 일정 그룹화
  const schedulesByDate: ScheduleByDate[] =
    visibleSchedules !== undefined
      ? dateRange.map((date) => {
          const daySchedules = visibleSchedules
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
                address: schedule.address,
                latitude: schedule.latitude,
                longitude: schedule.longitude,
              };
            });

          return {
            date,
            dateLabel: date,
            schedules: daySchedules,
          };
        })
      : [];

  const selectedMapDate =
    mapSelection.date && dateRange.includes(mapSelection.date) ? mapSelection.date : (dateRange[0] ?? null);
  const selectedDaySchedules = schedulesByDate.find((day) => day.date === selectedMapDate)?.schedules ?? [];
  const selectedMapScheduleId = selectedDaySchedules.some((schedule) => schedule.id === mapSelection.scheduleId)
    ? mapSelection.scheduleId
    : (selectedDaySchedules[0]?.id ?? null);

  // 제한·로딩 중에는 사용자의 선택을 보존한다. 새 결과에서 사라진 선택만 보정한다.
  if (mapSelection.tripId !== selectedTripId) {
    setMapSelection({ tripId: selectedTripId, date: null, scheduleId: null });
  } else if (
    canShowContent &&
    (mapSelection.date !== selectedMapDate || mapSelection.scheduleId !== selectedMapScheduleId)
  ) {
    setMapSelection({ tripId: selectedTripId, date: selectedMapDate, scheduleId: selectedMapScheduleId });
  }

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
      <TripSelector className='border-b border-card-border bg-background px-md py-sm' />

      {/* Content */}
      {view.kind === 'ready' && view.refreshFailed && (
        <ScheduleRefreshError retry={access.canFetch ? onRefresh : undefined} />
      )}
      {view.kind === 'blocked' ? (
        <PolicyErrorDisplay policy={view.policy} variant='block' />
      ) : view.kind === 'error' ? (
        <ScheduleQueryFeedback status='error' retry={onRefresh} />
      ) : view.kind === 'loading' ? (
        <ScheduleQueryFeedback status='loading' />
      ) : viewMode === 'list' ? (
        <ScheduleListView
          schedulesByDate={schedulesByDate}
          selectedTripId={selectedTripId}
          hasTrip={!!selectedTrip}
          hasDates={!!(selectedTrip?.startDate && selectedTrip?.endDate)}
          onScheduleMenuPress={handleScheduleMenuPress}
          refreshing={refreshing}
          onRefresh={access.canFetch ? onRefresh : undefined}
        />
      ) : (
        <ScheduleMapViewContainer
          tripId={selectedTripId || ''}
          dateRange={dateRange}
          schedulesByDate={schedulesByDate}
          selectedDate={selectedMapDate}
          selectedScheduleId={selectedMapScheduleId}
          onDateChange={(date) => setMapSelection({ tripId: selectedTripId, date, scheduleId: null })}
          onScheduleChange={(scheduleId) => setMapSelection((previous) => ({ ...previous, scheduleId }))}
        />
      )}

      {/* Schedule Menu */}
      <ScheduleMenu
        isOpen={isScheduleMenuOpen && canShowContent}
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
                location: selectedSchedule.location,
                address: selectedSchedule.address,
                latitude: selectedSchedule.latitude,
                longitude: selectedSchedule.longitude,
              }
            : null
        }
      />
    </View>
  );
}
