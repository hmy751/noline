import { useState } from 'react';
import type { Location } from './types';

/**
 * 장소 검색 훅 (Mock 데이터)
 * TODO: 실제 Google Maps API 연동 시 교체 예정
 */
export const useLocationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock 데이터
  const mockLocations: Location[] = [
    {
      id: '1',
      name: '에펠타워',
      address: 'Gyeongui-ro, Paju, Gyeonggi-do, South Korea',
      latitude: 37.7749,
      longitude: 126.7749,
    },
    {
      id: '2',
      name: '에펠하우스',
      address: 'Mipyeong 11-gil, Yeosu, Jeollanam-do, South Korea',
      latitude: 34.7604,
      longitude: 127.6622,
    },
    {
      id: '3',
      name: '에펠조명랜드',
      address: 'Sinwol-ro, Yeosu, Jeollanam-do, South Korea',
      latitude: 34.7404,
      longitude: 127.7422,
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Mock 검색 (실제로는 API 호출)
    setTimeout(() => {
      const filtered = mockLocations.filter((location) => location.name.toLowerCase().includes(query.toLowerCase()));
      setResults(filtered);
      setIsSearching(false);
    }, 300);
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
