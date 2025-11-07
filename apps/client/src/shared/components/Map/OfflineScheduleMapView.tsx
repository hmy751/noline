/**
 * OfflineScheduleMapView - Mapbox 기반 오프라인 지도
 * - 실제 도로 경로 표시 (저장된 경로)
 * - 직선 경로 표시 (미저장 경로)
 * - 순서 번호 마커
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRef, useEffect, useMemo, useState } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { useGetRoutes } from '@/entities/route';
import { decodePolyline } from '@/shared/lib/mapbox';
import type { MapboxProfile } from '@/shared/services/directions/mapbox';

interface Schedule {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  time: string;
}

interface OfflineScheduleMapViewProps {
  schedules: Schedule[];
  tripId: string;
  accommodationCoords?: { latitude: number; longitude: number };
  onSchedulePress?: (scheduleId: string) => void;
  selectedScheduleId?: string | null;
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
  profileSelector: {
    position: 'absolute',
    top: 60, // 날짜 선택 UI 아래로 이동
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonActive: {
    backgroundColor: '#4CAF50',
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  profileButtonTextActive: {
    color: 'white',
  },
});

/**
 * 일정 목록을 Mapbox 지도에 표시 (오프라인)
 * - 저장된 경로: 실제 도로 polyline (초록색 실선)
 * - 미저장 경로: 직선 (회색 점선)
 */
export function OfflineScheduleMapView({
  schedules,
  tripId,
  accommodationCoords,
  selectedScheduleId,
}: OfflineScheduleMapViewProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // 이동 수단 선택 상태 (기본값: walking)
  const [selectedProfile, setSelectedProfile] = useState<MapboxProfile>('walking');

  // 저장된 경로 조회
  const { data: savedRoutes = [] } = useGetRoutes({ tripId });

  // 디버깅: 저장된 경로 확인
  useEffect(() => {
    console.log(`📍 Saved routes count: ${savedRoutes.length}`);
    console.log(`📍 Selected profile: ${selectedProfile}`);
    savedRoutes.forEach((route) => {
      console.log(
        `  - ${route.fromScheduleId || 'accommodation'} → ${route.toScheduleId} (${route.profile}): ${route.distance}m`,
      );
    });
  }, [savedRoutes, selectedProfile]);

  // 좌표가 있는 일정만 필터링
  const schedulesWithCoords = schedules.filter(
    (s) => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude),
  );

  // 경로 데이터 계산 (저장 vs 미저장)
  const routeSegments = useMemo(() => {
    const segments: Array<{
      id: string;
      type: 'saved' | 'straight';
      coordinates: [number, number][]; // [lng, lat]
      color: string;
      width: number;
      dashed?: boolean;
    }> = [];

    // 1. 숙소 → 첫 일정 (있는 경우)
    if (accommodationCoords && schedulesWithCoords[0]) {
      const firstSchedule = schedulesWithCoords[0];
      const savedRoute = savedRoutes.find(
        (r) => r.fromScheduleId === null && r.toScheduleId === firstSchedule.id && r.profile === selectedProfile,
      );

      if (savedRoute) {
        // 저장된 경로 - 실제 도로
        console.log(`✅ Found saved route: accommodation → ${firstSchedule.id} (${selectedProfile})`);
        segments.push({
          id: `route-accommodation-${firstSchedule.id}`,
          type: 'saved',
          coordinates: decodePolyline(savedRoute.geometry),
          color: '#4CAF50', // 초록색
          width: 4,
        });
      } else {
        // 미저장 경로 - 직선
        console.log(`⚠️ No saved route: accommodation → ${firstSchedule.id} (${selectedProfile}), using straight line`);
        segments.push({
          id: `route-accommodation-${firstSchedule.id}`,
          type: 'straight',
          coordinates: [
            [accommodationCoords.longitude, accommodationCoords.latitude],
            [firstSchedule.longitude!, firstSchedule.latitude!],
          ],
          color: '#9E9E9E', // 회색
          width: 2,
          dashed: true,
        });
      }
    }

    // 2. 일정 → 일정 경로들
    for (let i = 0; i < schedulesWithCoords.length - 1; i++) {
      const currentSchedule = schedulesWithCoords[i];
      const nextSchedule = schedulesWithCoords[i + 1];

      const savedRoute = savedRoutes.find(
        (r) =>
          r.fromScheduleId === currentSchedule.id &&
          r.toScheduleId === nextSchedule.id &&
          r.profile === selectedProfile,
      );

      if (savedRoute) {
        // 저장된 경로 - 실제 도로
        console.log(`✅ Found saved route: ${currentSchedule.id} → ${nextSchedule.id} (${selectedProfile})`);
        segments.push({
          id: `route-${currentSchedule.id}-${nextSchedule.id}`,
          type: 'saved',
          coordinates: decodePolyline(savedRoute.geometry),
          color: '#4CAF50', // 초록색
          width: 4,
        });
      } else {
        // 미저장 경로 - 직선
        console.log(
          `⚠️ No saved route: ${currentSchedule.id} → ${nextSchedule.id} (${selectedProfile}), using straight line`,
        );
        segments.push({
          id: `route-${currentSchedule.id}-${nextSchedule.id}`,
          type: 'straight',
          coordinates: [
            [currentSchedule.longitude!, currentSchedule.latitude!],
            [nextSchedule.longitude!, nextSchedule.latitude!],
          ],
          color: '#9E9E9E', // 회색
          width: 2,
          dashed: true,
        });
      }
    }

    return segments;
  }, [schedulesWithCoords, savedRoutes, accommodationCoords, selectedProfile]);

  // 초기 카메라 설정
  const initialCamera = useMemo(() => {
    if (schedulesWithCoords.length === 1) {
      // 일정이 1개만 있으면 중심점 + 줌 레벨
      return {
        centerCoordinate: [schedulesWithCoords[0].longitude!, schedulesWithCoords[0].latitude!] as [number, number],
        zoomLevel: 15,
      };
    }

    // 일정이 여러 개면 bounds로 자동 조정
    const lngs = schedulesWithCoords.map((s) => s.longitude!);
    const lats = schedulesWithCoords.map((s) => s.latitude!);

    return {
      bounds: {
        ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
        sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
        paddingTop: 100,
        paddingRight: 50,
        paddingBottom: 300,
        paddingLeft: 50,
      },
    };
  }, [schedulesWithCoords]);

  // 선택된 일정으로 카메라 이동
  useEffect(() => {
    if (cameraRef.current && selectedScheduleId) {
      const selectedSchedule = schedulesWithCoords.find((s) => s.id === selectedScheduleId);
      if (selectedSchedule?.latitude && selectedSchedule?.longitude) {
        cameraRef.current.setCamera({
          centerCoordinate: [selectedSchedule.longitude, selectedSchedule.latitude],
          zoomLevel: 15,
          animationDuration: 300, // 애니메이션 짧게
        });
      }
    }
  }, [selectedScheduleId, schedulesWithCoords]);

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

  // 이동 수단 라벨 매핑
  const profileLabels: Record<MapboxProfile, string> = {
    walking: '도보',
    cycling: '자전거',
    'driving-traffic': '자동차',
  };

  return (
    <View style={styles.map}>
      <MapboxGL.MapView style={styles.map} styleURL='mapbox://styles/mapbox/streets-v11'>
        {/* 카메라 - 모든 일정을 포함하도록 자동 조정 */}
        <MapboxGL.Camera ref={cameraRef} {...initialCamera} animationDuration={0} />

        {/* 경로 선들 */}
        {routeSegments.map((segment) => (
          <MapboxGL.ShapeSource
            key={segment.id}
            id={segment.id}
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: segment.coordinates,
              },
              properties: {},
            }}
          >
            <MapboxGL.LineLayer
              id={`${segment.id}-layer`}
              style={{
                lineColor: segment.color,
                lineWidth: segment.width,
                lineDasharray: segment.dashed ? [2, 2] : undefined,
              }}
            />
          </MapboxGL.ShapeSource>
        ))}

        {/* 마커들 - 일정 */}
        {schedulesWithCoords.map((schedule, index) => {
          const isSelected = schedule.id === selectedScheduleId;
          return (
            <MapboxGL.PointAnnotation
              key={schedule.id}
              id={schedule.id}
              coordinate={[schedule.longitude!, schedule.latitude!]}
            >
              {/* 커스텀 마커 (순서 번호 표시) */}
              <View className='items-center'>
                <View
                  className={`rounded-full border-2 border-white shadow-md ${
                    isSelected ? 'h-10 w-10 bg-primary' : 'h-8 w-8 bg-primary/70'
                  }`}
                  style={{ justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text
                    className={`font-semibold ${
                      isSelected ? 'text-body text-primary-foreground' : 'text-label text-primary-foreground/80'
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    className='mt-1 h-2 w-2 rounded-full bg-primary'
                    style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2 }}
                  />
                )}
              </View>
            </MapboxGL.PointAnnotation>
          );
        })}

        {/* 숙소 마커 (있는 경우) */}
        {accommodationCoords && (
          <MapboxGL.PointAnnotation
            id='accommodation'
            coordinate={[accommodationCoords.longitude, accommodationCoords.latitude]}
          >
            <View className='items-center'>
              <View
                className='h-10 w-10 rounded-full border-2 border-white bg-blue-500 shadow-md'
                style={{ justifyContent: 'center', alignItems: 'center' }}
              >
                <Text className='text-body font-semibold text-white'>🏠</Text>
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* 이동 수단 선택 버튼 */}
      <View style={styles.profileSelector}>
        {(['walking', 'cycling', 'driving-traffic'] as MapboxProfile[]).map((profile) => (
          <TouchableOpacity
            key={profile}
            style={[styles.profileButton, selectedProfile === profile && styles.profileButtonActive]}
            onPress={() => setSelectedProfile(profile)}
          >
            <Text style={[styles.profileButtonText, selectedProfile === profile && styles.profileButtonTextActive]}>
              {profileLabels[profile]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
