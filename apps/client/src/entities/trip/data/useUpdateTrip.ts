import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripRepository } from '../repository/trip-repository';
import type { UpdateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 수정 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateTrip();
 * mutate({
 *   id: 'trip-id',
 *   data: {
 *     name: 'Updated Trip Name',
 *     destination: 'New Destination',
 *   },
 * });
 * ```
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripRequest }) => TripRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update trip:', error);
    },
  });
};
