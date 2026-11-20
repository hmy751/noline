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
 * 오프라인 지도 pack을 받는 스타일이자 Mapbox 지도를 그리는 스타일.
 * 받은 pack과 그리는 스타일이 같아야 오프라인에서 지도가 그려진다.
 * `MapboxGL.StyleURL.Street`는 native SDK 기본값을 따르므로 쓰지 않는다(Mapbox v10은 streets-v11, v11은 streets-v12).
 * 바꾸면 이미 받은 pack과 맞지 않게 되므로 기존 사용자의 지도 처리와 함께 바꾼다.
 */
export const OFFLINE_MAP_STYLE_URL = 'mapbox://styles/mapbox/streets-v11';

/**
 * 좌표 배열을 Polyline6 문자열로 인코딩
 * - 디버깅 또는 테스트용
 *
 * @param coordinates - 좌표 배열 [[lng, lat], ...]
 * @returns polyline6 압축 문자열
 */
export function encodePolyline(coordinates: [number, number][]): string {
  // Mapbox 형식 [[lng, lat]] → polyline 형식 [[lat, lng]]
  const converted = coordinates.map(([lng, lat]): [number, number] => [lat, lng]);

  return polyline.encode(converted, 6);
}
