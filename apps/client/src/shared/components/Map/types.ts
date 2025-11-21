/**
 * Map 컴포넌트들의 공통 타입 정의
 */

export interface Schedule {
  id: string;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
  time: string;
}

export interface ScheduleMapViewProps {
  schedules: Schedule[];
  tripId: string;
  accommodationCoords?: { latitude: number; longitude: number };
  onSchedulePress?: (scheduleId: string) => void;
  selectedScheduleId?: string | null;
  onMarkerPress?: (scheduleId: string) => void;
}

export interface MapViewProps {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  onLocationSelect?: (location: { latitude: number; longitude: number }) => void;
  isSelectMode?: boolean;
  tripId?: string;
}

export type MapProvider = 'google' | 'mapbox' | 'none';
