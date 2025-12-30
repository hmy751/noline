/**
 * Mapbox Directions API 서비스
 * - 실제 도로 경로 계산
 * - polyline6 압축 형식으로 응답
 * - 오프라인 지도용 경로 데이터 제공
 */

// Mapbox 교통수단 프로필
export type MapboxProfile = 'walking' | 'cycling' | 'driving-traffic';

// 좌표 타입
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Directions API 응답
export interface DirectionsResponse {
  geometry: string; // polyline6 압축 문자열
  distance: number; // 미터 (meters)
  duration: number; // 초 (seconds)
}

/**
 * Mapbox Directions API 호출
 * @param from - 출발 좌표
 * @param to - 도착 좌표
 * @param profile - 교통수단 (기본: walking)
 * @returns 경로 데이터 (geometry, distance, duration)
 */
export async function getDirections({
  from,
  to,
  profile = 'walking',
}: {
  from: Coordinate;
  to: Coordinate;
  profile?: MapboxProfile;
}): Promise<DirectionsResponse> {
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('❌ EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN not found');
  }

  // Mapbox Directions API URL
  // 형식: /directions/v5/{profile}/{coordinates}
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?access_token=${accessToken}&geometries=polyline6&overview=full`;

  try {
    console.log(`🛣️ Fetching route (${profile}): ${from.latitude},${from.longitude} → ${to.latitude},${to.longitude}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Mapbox API 에러 체크
    if (data.code !== 'Ok') {
      throw new Error(`Mapbox API error: ${data.code} - ${data.message || 'Unknown error'}`);
    }

    // 경로 없음 (NoRoute)
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      geometry: route.geometry, // polyline6 문자열
      distance: Math.round(route.distance), // 미터 (반올림)
      duration: Math.round(route.duration), // 초 (반올림)
    };
  } catch (error) {
    console.error('❌ Failed to fetch directions:', error);
    throw error;
  }
}

/**
 * 거리를 인간 친화적 형식으로 변환
 * @param meters - 미터 단위 거리
 * @returns "1.2km" 또는 "350m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

/**
 * 소요 시간을 인간 친화적 형식으로 변환
 * @param seconds - 초 단위 시간
 * @returns "1시간 30분" 또는 "45분"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}
