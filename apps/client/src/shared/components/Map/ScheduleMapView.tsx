import { StyleSheet, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import RNMapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Schedule {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  time: string;
}

interface ScheduleMapViewProps {
  schedules: Schedule[];
  onSchedulePress?: (scheduleId: string) => void;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 32,
  },
});

/**
 * 일정 목록을 지도에 표시하는 컴포넌트
 */
export function ScheduleMapView({ schedules, onSchedulePress }: ScheduleMapViewProps) {
  const mapRef = useRef<RNMapView>(null);

  // 좌표가 있는 일정만 필터링
  const schedulesWithCoords = schedules.filter(
    (s) => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude),
  );

  // 지도 영역 자동 조정
  useEffect(() => {
    if (mapRef.current && schedulesWithCoords.length > 0) {
      mapRef.current.fitToCoordinates(
        schedulesWithCoords.map((s) => ({
          latitude: s.latitude!,
          longitude: s.longitude!,
        })),
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        },
      );
    }
  }, [schedulesWithCoords]);

  // 좌표가 있는 일정이 없는 경우
  if (schedulesWithCoords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text className='text-title-large text-foreground mb-xs'>지도에 표시할 일정이 없어요</Text>
        <Text className='text-body text-muted-foreground text-center'>
          일정 추가 시 장소를 선택하면{'\n'}지도에서 위치를 확인할 수 있어요
        </Text>
      </View>
    );
  }

  // 첫 번째 일정을 중심으로
  const firstSchedule = schedulesWithCoords[0];

  return (
    <RNMapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={{
        latitude: firstSchedule.latitude!,
        longitude: firstSchedule.longitude!,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
      showsUserLocation
      showsMyLocationButton
    >
      {schedulesWithCoords.map((schedule, index) => (
        <Marker
          key={schedule.id}
          coordinate={{
            latitude: schedule.latitude!,
            longitude: schedule.longitude!,
          }}
          title={schedule.title}
          description={`${schedule.time} • ${schedule.location}`}
          pinColor='#228B22'
          onPress={() => onSchedulePress?.(schedule.id)}
        >
          {/* 커스텀 마커 (순서 번호 표시) */}
          <View className='items-center'>
            <View className='bg-primary rounded-full w-8 h-8 items-center justify-center border-2 border-white shadow-md'>
              <Text className='text-label text-primary-foreground font-semibold'>{index + 1}</Text>
            </View>
          </View>
        </Marker>
      ))}
    </RNMapView>
  );
}
