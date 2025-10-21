import { useQuery } from '@tanstack/react-query';
import { fetchAllTrips } from '../api';

// Query Key Factory
export const tripQueryKeys = {
  base: ['trip'] as const,
  all: () => [...tripQueryKeys.base, 'all'] as const,
};

/**
 * 전체 여행을 조회하는 React Query 훅
 * 메인 여행과 다른 여행들을 반환합니다.
 */
export const useGetTrips = () => {
  return useQuery({
    queryKey: tripQueryKeys.all(),
    queryFn: async () => {
      const response = await fetchAllTrips();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
