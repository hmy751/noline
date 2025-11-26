import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripRepository } from '../repository/trip-repository';
import { tripQueryKeys } from './keys';

/**
 * 여행 삭제 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - Soft Delete: deletedAt 설정
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteTrip();
 * mutate('trip-id');
 * ```
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TripRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete trip:', error);
    },
  });
};
