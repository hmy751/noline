/**
 * PolicyBasedScheduleMapView - 정책 기반 지도 제공자 선택
 *
 * 정책에 따라 자동으로 지도 제공자를 선택:
 * - online (active/inactive): Google Maps
 * - offline_active: Mapbox (오프라인 지도)
 * - offline_inactive: 지도 사용 불가
 */

import { useAppPolicy } from '@/shared/policy';
import { GoogleScheduleMapView } from './GoogleScheduleMapView';
import { MapboxScheduleMapView } from './MapboxScheduleMapView';
import { MapUnavailableView } from './MapUnavailableView';
import type { ScheduleMapViewProps } from './types';

/**
 * 정책 기반으로 적절한 지도 제공자를 자동 선택
 * Policy Layer (v3.0)의 service.mapProvider 정책을 따름
 */
export function PolicyBasedScheduleMapView(props: ScheduleMapViewProps) {
  const { tripId, ...mapProps } = props;
  const policy = useAppPolicy(tripId);

  console.log('🗺️ Map Provider Policy:', policy.service.mapProvider);

  switch (policy.service.mapProvider) {
    case 'google':
      console.log('📍 Using Google Maps (Online)');
      return <GoogleScheduleMapView {...mapProps} tripId={tripId} />;

    case 'mapbox':
      console.log('📦 Using Mapbox (Offline-Ready)');
      return <MapboxScheduleMapView {...mapProps} tripId={tripId} />;

    case 'none':
      console.log('❌ Map unavailable (Offline + Inactive)');
      return (
        <MapUnavailableView
          message='오프라인 상태에서는 지도를 사용할 수 없습니다'
          hint='네트워크에 연결하거나 여행을 활성화해주세요'
        />
      );

    default:
      // Fallback to Google Maps
      console.warn('⚠️ Unknown map provider, falling back to Google Maps');
      return <GoogleScheduleMapView {...mapProps} tripId={tripId} />;
  }
}
