/**
 * SmartScheduleMapView - 스마트 지도 전환
 * - 오프라인 지도 있음: Mapbox (실제 경로 표시)
 * - 오프라인 지도 없음: Google Maps (직선 표시)
 */

import { useOfflineCity } from '@/entities/offline-city';
import { ScheduleMapView } from './ScheduleMapView';
import { OfflineScheduleMapView } from './OfflineScheduleMapView';

interface Schedule {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  time: string;
}

interface SmartScheduleMapViewProps {
  schedules: Schedule[];
  tripId: string;
  accommodationCoords?: { latitude: number; longitude: number };
  onSchedulePress?: (scheduleId: string) => void;
  selectedScheduleId?: string | null;
  onMarkerPress?: (scheduleId: string) => void;
}

/**
 * 오프라인 지도 유무에 따라 자동으로 지도 전환
 * - 오프라인 지도 O: Mapbox (OfflineScheduleMapView)
 * - 오프라인 지도 X: Google Maps (ScheduleMapView)
 */
export function SmartScheduleMapView({
  schedules,
  tripId,
  accommodationCoords,
  onSchedulePress,
  selectedScheduleId,
  onMarkerPress,
}: SmartScheduleMapViewProps) {
  const { data: offlineCity } = useOfflineCity(tripId);

  // 오프라인 지도가 있으면 Mapbox 사용
  if (offlineCity) {
    console.log('🗺️ Using Mapbox (Offline)');
    return (
      <OfflineScheduleMapView
        schedules={schedules}
        tripId={tripId}
        accommodationCoords={accommodationCoords}
        onSchedulePress={onSchedulePress}
        selectedScheduleId={selectedScheduleId}
      />
    );
  }

  // 오프라인 지도 없으면 Google Maps 사용
  console.log('🗺️ Using Google Maps (Online)');
  return (
    <ScheduleMapView
      schedules={schedules}
      onSchedulePress={onSchedulePress}
      selectedScheduleId={selectedScheduleId}
      onMarkerPress={onMarkerPress}
    />
  );
}
