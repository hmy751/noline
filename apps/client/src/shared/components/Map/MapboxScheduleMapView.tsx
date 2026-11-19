/**
 * MapboxScheduleMapView - Mapbox 기반 오프라인 지도
 *
 * 사용 시나리오:
 * - offline_active: 오프라인 활성화된 여행의 일정을 Mapbox 지도에 표시
 * - 실제 도로 경로 표시 (저장된 경로)
 * - 직선 경로 표시 (미저장 경로)
 * - 순서 번호 마커
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRef, useEffect, useMemo, useState } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { useGetRoutes } from '@/entities/route';
import { decodePolyline, OFFLINE_MAP_STYLE_URL } from '@/shared/lib/mapbox';
import { formatDistance, formatDuration, type MapboxProfile } from '@/shared/services/directions/mapbox';
import { buildRouteSegments, findSavedRoute, getScheduleCoordinate } from '@/shared/services/directions/route-plan';
import type { ScheduleMapViewProps } from './types';

/**
 * 일정 목록을 Mapbox 지도에 표시 (오프라인)
 * - 저장된 경로: 실제 도로 polyline (초록색 실선)
 * - 미저장 경로: 직선 (회색 점선)
 */
export function MapboxScheduleMapView({
  schedules,
  tripId,
  accommodationCoords,
  selectedScheduleId,
}: ScheduleMapViewProps) {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // 이동 수단 선택 상태 (기본값: walking)
  const [selectedProfile, setSelectedProfile] = useState<MapboxProfile>('walking');

  // 저장된 경로 조회
  const { data: savedRoutes = [] } = useGetRoutes({ tripId });

  const schedulesWithCoords = schedules.flatMap((schedule) => {
    const coordinate = getScheduleCoordinate(schedule);
    return coordinate ? [{ ...schedule, ...coordinate }] : [];
  });

  const routeSegments = useMemo(
    () =>
      buildRouteSegments(schedules, accommodationCoords).map((segment) => {
        const savedRoute = findSavedRoute(savedRoutes, segment, selectedProfile);
        const coordinates: [number, number][] = savedRoute
          ? decodePolyline(savedRoute.geometry)
          : [
              [segment.from.longitude, segment.from.latitude],
              [segment.to.longitude, segment.to.latitude],
            ];

        return {
          id: `route-${segment.fromScheduleId ?? 'accommodation'}-${segment.toScheduleId}`,
          type: savedRoute ? 'saved' : 'straight',
          coordinates,
          color: savedRoute ? '#4CAF50' : '#9E9E9E',
          width: savedRoute ? 4 : 2,
          dashed: !savedRoute,
          distance: savedRoute?.distance,
          duration: savedRoute?.duration,
        };
      }),
    [schedules, savedRoutes, accommodationCoords, selectedProfile],
  );

  // 총 거리/시간 계산 (저장된 경로만)
  const routeSummary = useMemo(() => {
    const savedSegments = routeSegments.filter((s) => s.type === 'saved' && s.distance && s.duration);
    const totalDistance = savedSegments.reduce((sum, s) => sum + (s.distance || 0), 0);
    const totalDuration = savedSegments.reduce((sum, s) => sum + (s.duration || 0), 0);

    return { totalDistance, totalDuration, savedCount: savedSegments.length };
  }, [routeSegments]);

  // 카메라가 보여 줄 곳: 좌표가 있는 선택 일정이면 그 일정을, 아니면 그날 좌표가 있는 일정 전체를 담는다.
  // 일정 배열은 렌더마다 새로 만들어지므로 값으로 만든 key가 바뀔 때만 카메라를 옮긴다.
  // 그래야 이동 수단 변경이나 경로 조회 갱신 같은 재렌더가 사용자가 옮겨 둔 지도를 되돌리지 않는다.
  const cameraTargetKey = JSON.stringify(
    getCameraTarget(
      schedulesWithCoords.map((s) => ({ id: s.id, longitude: s.longitude, latitude: s.latitude })),
      selectedScheduleId,
    ),
  );
  const cameraTarget = useMemo(() => JSON.parse(cameraTargetKey) as CameraTarget | null, [cameraTargetKey]);

  // 처음 위치는 지도가 준비될 때 한 번만 쓰는 defaultSettings로 넘긴다. Camera의 일반 prop(bounds 등)은 값이 바뀔
  // 때마다 카메라 이동으로 다시 보내진다. 일반 prop으로 넘기던 때 New Architecture·rnmapbox 10.3 빌드의 실기기에서
  // 지도가 선택한 일정 대신 전체 범위로 열렸다.
  useEffect(() => {
    if (!cameraRef.current || !cameraTarget) return;
    if ('centerCoordinate' in cameraTarget) {
      cameraRef.current.setCamera({ ...cameraTarget, animationDuration: 300 });
    } else {
      const { ne, sw, paddingTop, paddingRight, paddingBottom, paddingLeft } = cameraTarget.bounds;
      cameraRef.current.fitBounds(ne, sw, [paddingTop, paddingRight, paddingBottom, paddingLeft], 300);
    }
  }, [cameraTarget]);

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
      <MapboxGL.MapView style={styles.map} styleURL={OFFLINE_MAP_STYLE_URL}>
        <MapboxGL.Camera ref={cameraRef} defaultSettings={cameraTarget ?? undefined} />

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

        {/* 마커들 - 일정. PointAnnotation은 자식 뷰를 처음 한 번 이미지로 찍어 쓴다. New Architecture·rnmapbox 10.3
            빌드의 실기기에서 순서 번호가 빠진 채 찍혔고 선택이 바뀌어도 다시 찍지 않는다. MarkerView는 뷰를 그대로 그린다. */}
        {schedulesWithCoords.map((schedule, index) => {
          const isSelected = schedule.id === selectedScheduleId;
          return (
            <MapboxGL.MarkerView key={schedule.id} coordinate={[schedule.longitude!, schedule.latitude!]} allowOverlap>
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
            </MapboxGL.MarkerView>
          );
        })}

        {/* 숙소 마커 (있는 경우) */}
        {accommodationCoords && (
          <MapboxGL.MarkerView coordinate={[accommodationCoords.longitude, accommodationCoords.latitude]} allowOverlap>
            <View className='items-center'>
              <View
                className='h-10 w-10 rounded-full border-2 border-white bg-blue-500 shadow-md'
                style={{ justifyContent: 'center', alignItems: 'center' }}
              >
                <Text className='text-body font-semibold text-white'>🏠</Text>
              </View>
            </View>
          </MapboxGL.MarkerView>
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

      {/* 경로 정보 (거리 / 예상 시간) */}
      {routeSegments.length > 0 && (
        <View style={styles.routeInfo}>
          {routeSummary.savedCount > 0 ? (
            <>
              <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>총 거리</Text>
                <Text style={styles.routeInfoValue}>{formatDistance(routeSummary.totalDistance)}</Text>
              </View>
              <View style={styles.routeInfoDivider} />
              <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>예상 시간</Text>
                <Text style={styles.routeInfoValue}>{formatDuration(routeSummary.totalDuration)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.routeInfoNoRoute}>경로 없음</Text>
          )}
        </View>
      )}
    </View>
  );
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
  routeInfo: {
    position: 'absolute',
    top: 104, // 프로필 선택기 아래
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeInfoItem: {
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  routeInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
  },
  routeInfoNoRoute: {
    fontSize: 13,
    color: '#999',
  },
});

type CameraTarget =
  | { centerCoordinate: [number, number]; zoomLevel: number }
  | {
      bounds: {
        ne: [number, number];
        sw: [number, number];
        paddingTop: number;
        paddingRight: number;
        paddingBottom: number;
        paddingLeft: number;
      };
    };

/** 좌표가 있는 선택 일정이면 그 일정, 아니면 좌표가 있는 일정 전체(한 곳이면 그 일정)를 보여 줄 카메라 위치. */
function getCameraTarget(
  schedules: { id: string; longitude: number; latitude: number }[],
  selectedScheduleId: string | null | undefined,
): CameraTarget | null {
  if (schedules.length === 0) return null;
  const focused = schedules.find((s) => s.id === selectedScheduleId) ?? (schedules.length === 1 ? schedules[0] : null);
  if (focused) return { centerCoordinate: [focused.longitude, focused.latitude], zoomLevel: 15 };

  const lngs = schedules.map((s) => s.longitude);
  const lats = schedules.map((s) => s.latitude);
  return {
    bounds: {
      ne: [Math.max(...lngs), Math.max(...lats)],
      sw: [Math.min(...lngs), Math.min(...lats)],
      paddingTop: 100,
      paddingRight: 50,
      paddingBottom: 300,
      paddingLeft: 50,
    },
  };
}
