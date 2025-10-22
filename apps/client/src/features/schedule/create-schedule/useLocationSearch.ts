import { useState } from 'react';
import { type PlacesSearchResponse, type PlaceDetail } from '@repo/schema';
import fetcher from '@/shared/api/fetcher';
import type { Location } from './types';

type CityContext = {
  cityName?: string;
  latitude?: number;
  longitude?: number;
};

/**
 * 장소 검색 훅 (Google Places API)
 */
export const useLocationSearch = (cityContext?: CityContext) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Google Places API 호출
      const response = (await fetcher.post('/places/search', {
        query: query.trim(),
        cityName: cityContext?.cityName,
        latitude: cityContext?.latitude,
        longitude: cityContext?.longitude,
        language: 'en', // 기본 영어 (필요시 설정 가능)
      })) as PlacesSearchResponse;

      // 서버 응답을 Location 타입으로 변환
      // placeId를 받아서 상세 정보를 추가로 가져와야 함
      const locations = await Promise.all(
        response.results.map(async (result) => {
          try {
            // Place Details API로 좌표 정보 가져오기
            const detailResponse = (await fetcher.get(`/places/${result.placeId}`, {
              params: { language: 'en' },
            })) as PlaceDetail;

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

      setResults(locations);
    } catch (error) {
      console.error('Places search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  return {
    searchQuery,
    results,
    isSearching,
    handleSearch,
    clearSearch,
  };
};
