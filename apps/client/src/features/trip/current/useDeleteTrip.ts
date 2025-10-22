import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeleteTrip } from '../api';
import { tripQueryKeys } from './useGetTrips';

/**
 * 여행을 삭제하는 React Query Mutation 훅
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetchDeleteTrip(id);
      return response;
    },
    onSuccess: () => {
      // 전체 여행 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('Failed to delete trip:', error);
      // TODO: 에러 토스트 추가
    },
  });
};
