import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreateTrip } from '../api';
import type { CreateTripRequest } from '../model';
import { tripQueryKeys } from './useGetTrips';

/**
 * 여행 생성 Mutation Hook
 * - 순수한 API 호출 및 캐시 무효화만 담당
 * - Navigation 등 feature 특화 로직은 컴포넌트에서 처리
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      const response = await fetchCreateTrip(data);
      return response.data;
    },
    onSuccess: () => {
      // 캐시 무효화 - 새 여행이 생성되었으므로 전체 여행 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('Failed to create trip:', error);
    },
  });
};
