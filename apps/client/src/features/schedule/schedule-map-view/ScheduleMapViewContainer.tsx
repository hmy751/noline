import { useState, useEffect, useRef, useMemo } from 'react';
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
}

interface ScheduleMapViewContainerProps {
  tripId: string;
  dateRange: string[];
  schedulesByDate: Array<{ date: string; schedules: Schedule[] }>;
  initialDate: string | null;
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
  initialDate,
}: ScheduleMapViewContainerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const carouselRef = useRef<ScrollView>(null);

  // 초기 날짜 설정
  useEffect(() => {
    if (dateRange.length > 0 && !selectedDate) {
      setSelectedDate(dateRange[0]);
    }
  }, [dateRange, selectedDate]);

  // 선택된 날짜의 일정 목록
  const schedulesForMap = useMemo(
    () => schedulesByDate.find((group) => group.date === selectedDate)?.schedules || [],
    [schedulesByDate, selectedDate],
  );

  // 날짜 변경 시 캐러셀 초기화
  useEffect(() => {
    if (schedulesForMap.length > 0) {
      setSelectedScheduleId(schedulesForMap[0].id);
      carouselRef.current?.scrollTo({ x: 0, animated: false });
    } else {
      setSelectedScheduleId(null);
    }
  }, [selectedDate, schedulesForMap]);

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
        onSchedulePress={(scheduleId: string) => router.push(`/schedules/${scheduleId}`)}
        selectedScheduleId={selectedScheduleId}
        onMarkerPress={(scheduleId) => {
          setSelectedScheduleId(scheduleId);
          const index = schedulesForMap.findIndex((s) => s.id === scheduleId);
          if (index > -1 && carouselRef.current) {
            // 카드 너비 330px + gap 16px = 346px
            carouselRef.current.scrollTo({ x: index * 346, animated: true });
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
                setSelectedScheduleId(schedulesForMap[index].id);
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
                    onPressDetails={() => router.push(`/schedules/${schedule.id}`)}
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
