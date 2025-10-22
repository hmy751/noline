import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { type PlacesSearchResponse, type PlaceDetail } from '@repo/schema';
import fetcher from '@/shared/api/fetcher';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { Location } from './types';

type CityContext = {
  cityName?: string;
  latitude?: number;
  longitude?: number;
};

// Query Key Factory
export const placeQueryKeys = {
  base: ['places'] as const,
  search: (query: string, cityContext?: CityContext) => [...placeQueryKeys.base, 'search', query, cityContext] as const,
};

/**
 * 장소 검색 API 함수
 */
const searchPlaces = async (query: string, cityContext?: CityContext): Promise<Location[]> => {
  // Google Places API 호출
  const response = (await fetcher.post('/api/places/search', {
    query: query.trim(),
    cityName: cityContext?.cityName,
    latitude: cityContext?.latitude,
    longitude: cityContext?.longitude,
    language: 'en', // 기본 영어 (필요시 설정 가능)
  })) as PlacesSearchResponse;

  // 서버 응답을 Location 타입으로 변환
  // placeId를 받아서 상세 정보를 추가로 가져와야 함
  const locations = await Promise.all(
    response.results.map(async (result: PlacesSearchResponse['results'][0]) => {
      try {
        // Place Details API로 좌표 정보 가져오기
        // Query string으로 language 전달
        const detailResponse = (await fetcher.get(`/api/places/${result.placeId}?language=en`)) as PlaceDetail;

        return {
          id: detailResponse.id,
          name: detailResponse.name,
          address: detailResponse.address,
          latitude: detailResponse.latitude,
          longitude: detailResponse.longitude,
          placeId: detailResponse.placeId,
          photoUrl: detailResponse.photoUrl,
          rating: detailResponse.rating,
        };
      } catch (error) {
        console.error('Failed to fetch place details:', error);
        // 실패 시 기본값 사용
        return {
          id: result.id,
          name: result.name,
          address: result.address,
          latitude: 0,
          longitude: 0,
        };
      }
    }),
  );

  return locations;
};

/**
 * 장소 검색 훅 (Google Places API with React Query)
 */
export const useLocationSearch = (cityContext?: CityContext) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 500ms debounce 적용
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // React Query로 검색 실행
  const { data, isFetching: isSearching } = useQuery({
    queryKey: placeQueryKeys.search(debouncedSearchQuery, cityContext),
    queryFn: () => searchPlaces(debouncedSearchQuery, cityContext),
    enabled: !!debouncedSearchQuery.trim(),
    staleTime: 1000 * 60 * 5, // 5분
    placeholderData: keepPreviousData, // 이전 데이터 유지
  });

  // 검색어가 비어있으면 빈 배열, 아니면 데이터 반환
  const results = debouncedSearchQuery.trim() ? data || [] : [];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    results,
    isSearching,
    handleSearch,
    clearSearch,
  };
};
