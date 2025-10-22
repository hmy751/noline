/**
 * 장소 검색 관련 타입 정의
 */

export type Location = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type SearchResult = Location;
