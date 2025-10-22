/**
 * 장소 검색 관련 타입 정의
 */

export type Location = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string; // Google Place ID (선택사항)
  photoUrl?: string; // 장소 사진 URL (선택사항)
  rating?: number; // 평점 (선택사항)
};

export type SearchResult = Location;
