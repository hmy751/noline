import { useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PolicyBasedScheduleMapView, MapScheduleCard } from '@/shared/components';
import { Pressable } from '@repo/ui';

interface Schedule {
  id: string;
  time: string;
  title: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  scheduledAt: string;
}

interface ScheduleMapViewContainerProps {
  tripId: string;
  dateRange: string[];
  schedulesByDate: Array<{ date: string; schedules: Schedule[] }>;
  selectedDate: string | null;
  selectedScheduleId: string | null;
  onDateChange: (date: string) => void;
  onScheduleChange: (scheduleId: string) => void;
}

// 좌표 파싱 헬퍼
const parseCoordinate = (schedule: Schedule) => {
  if (!schedule.latitude || !schedule.longitude) return null;
  return {
    latitude: parseFloat(schedule.latitude),
    longitude: parseFloat(schedule.longitude),
  };
};

export function ScheduleMapViewContainer({
  tripId,
  dateRange,
  schedulesByDate,
  selectedDate,
  selectedScheduleId,
  onDateChange,
  onScheduleChange,
}: ScheduleMapViewContainerProps) {
  const carouselRef = useRef<ScrollView>(null);
  const schedulesForMap = schedulesByDate.find((group) => group.date === selectedDate)?.schedules ?? [];
  const selectedIndex = schedulesForMap.findIndex((schedule) => schedule.id === selectedScheduleId);

  // 재표시·날짜 변경·목록 순서 변경 뒤에도 선택한 일정의 카드를 보여 준다.
  useEffect(() => {
    if (selectedIndex >= 0) carouselRef.current?.scrollTo({ x: selectedIndex * 346, animated: false });
  }, [selectedDate, selectedIndex]);

  return (
    <View className='flex-1'>
      <PolicyBasedScheduleMapView
        tripId={tripId}
        schedules={schedulesForMap
          .filter((schedule) => schedule.latitude && schedule.longitude)
          .map((schedule) => ({
            id: schedule.id,
            title: schedule.title,
            location: schedule.location || '',
            latitude: parseFloat(schedule.latitude!),
            longitude: parseFloat(schedule.longitude!),
            time: schedule.time,
          }))}
        onSchedulePress={(scheduleId: string) => {
          const schedule = schedulesForMap.find((s) => s.id === scheduleId);
          if (schedule) {
            router.push(
              `/schedules/${scheduleId}?tripId=${tripId}&scheduledAt=${encodeURIComponent(schedule.scheduledAt)}`,
            );
          }
        }}
        selectedScheduleId={selectedScheduleId}
        onMarkerPress={onScheduleChange}
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
                accessibilityRole='button'
                accessibilityState={{ selected: selectedDate === date }}
                onPress={() => onDateChange(date)}
              >
                <Text className={`text-label ${selectedDate === date ? 'text-primary-foreground' : 'text-foreground'}`}>
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
            snapToInterval={346}
            decelerationRate='fast'
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / 346);
              if (schedulesForMap[index]) {
                onScheduleChange(schedulesForMap[index].id);
              }
            }}
          >
            {schedulesForMap.map((schedule, index) => {
              const prevSchedule = index > 0 ? schedulesForMap[index - 1] : null;

              return (
                <View key={schedule.id} className='mr-sm'>
                  <MapScheduleCard
                    tripId={tripId}
                    index={index}
                    title={schedule.title}
                    location={schedule.location}
                    date={selectedDate || ''}
                    time={schedule.time}
                    coordinate={parseCoordinate(schedule)}
                    previousSchedule={
                      prevSchedule
                        ? {
                            title: prevSchedule.title,
                            coordinate: parseCoordinate(prevSchedule),
                          }
                        : null
                    }
                    onPressDetails={() =>
                      router.push(
                        `/schedules/${schedule.id}?tripId=${tripId}&scheduledAt=${encodeURIComponent(schedule.scheduledAt)}`,
                      )
                    }
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
