/**
 * Mapbox 유틸리티 함수
 * - Polyline 디코딩
 * - 좌표 변환
 */

import polyline from '@mapbox/polyline';

/**
 * Polyline6 문자열을 좌표 배열로 디코딩
 * - Mapbox는 precision 6을 사용 (Google은 5)
 * - 결과는 [longitude, latitude] 형식 (Mapbox 표준)
 *
 * @param encoded - polyline6 압축 문자열
 * @returns 좌표 배열 [[lng, lat], ...]
 *
 * @example
 * const coords = decodePolyline('abcd123...');
 * // [[126.978, 37.566], [126.979, 37.567], ...]
 */
export function decodePolyline(encoded: string): [number, number][] {
  // Mapbox는 precision 6 사용
  const decoded = polyline.decode(encoded, 6);

  // polyline.decode 결과: [[lat, lng], [lat, lng], ...]
  // Mapbox 형식으로 변환: [[lng, lat], [lng, lat], ...]
  return decoded.map(([lat, lng]) => [lng, lat]);
}

/**
 * Polyline6 문자열을 react-native-maps용 좌표 배열로 디코딩
 * - react-native-maps는 {latitude, longitude} 객체 형식 사용
 *
 * @param encoded - polyline6 압축 문자열
 * @returns 좌표 객체 배열 [{latitude, longitude}, ...]
 *
 * @example
 * const coords = decodePolylineForReactNativeMaps('abcd123...');
 * // [{latitude: 37.566, longitude: 126.978}, ...]
 */
export function decodePolylineForReactNativeMaps(encoded: string): { latitude: number; longitude: number }[] {
  const decoded = polyline.decode(encoded, 6);

  return decoded.map(([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  }));
}

/**
 * 좌표 배열을 Polyline6 문자열로 인코딩
 * - 디버깅 또는 테스트용
 *
 * @param coordinates - 좌표 배열 [[lng, lat], ...]
 * @returns polyline6 압축 문자열
 */
export function encodePolyline(coordinates: [number, number][]): string {
  // Mapbox 형식 [[lng, lat]] → polyline 형식 [[lat, lng]]
  const converted = coordinates.map(([lng, lat]) => [lat, lng]);

  return polyline.encode(converted, 6);
}
