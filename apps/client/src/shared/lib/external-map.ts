import * as Linking from 'expo-linking';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DirectionsParams {
  origin?: Coordinate;
  destination: Coordinate;
}

/**
 * 장소명을 최대 글자 수로 truncate
 * @param name 장소명
 * @param maxLength 최대 글자 수 (기본 5)
 * @returns truncate된 장소명
 */
export function truncateLocationName(name: string, maxLength: number = 5): string {
  if (name.length <= maxLength) {
    return name;
  }
  return `${name.slice(0, maxLength)}...`;
}

/**
 * Google Maps 길찾기 URL 생성
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */
function buildGoogleMapsDirectionsUrl(params: DirectionsParams): string {
  const { origin, destination } = params;

  const queryParams = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: 'walking',
  });

  if (origin) {
    queryParams.set('origin', `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${queryParams.toString()}`;
}

/**
 * Google Maps 앱에서 길찾기 열기
 * - origin 생략 시 현재 위치에서 출발
 * - 앱이 없으면 웹 브라우저로 fallback
 */
export async function openGoogleMapsDirections(params: DirectionsParams): Promise<void> {
  const url = buildGoogleMapsDirectionsUrl(params);

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open Google Maps:', error);
  }
}
