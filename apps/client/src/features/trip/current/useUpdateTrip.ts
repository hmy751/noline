import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUpdateTrip, UpdateTripRequest } from '../api';
import { tripQueryKeys } from './useGetTrips';

/**
 * 여행 정보를 수정하는 React Query Mutation 훅
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTripRequest }) => {
      const response = await fetchUpdateTrip(id, data);
      return response.data;
    },
    onSuccess: () => {
      // 전체 여행 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('Failed to update trip:', error);
      // TODO: 에러 토스트 추가
    },
  });
};
