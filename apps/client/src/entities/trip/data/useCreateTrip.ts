import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripRepository } from '../repository/trip-repository';
import type { CreateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 생성 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - Client-Side ID: 외부에서 ID 생성하여 전달
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTrip();
 * mutate({
 *   id: generateId(), // Client-Side ID: 외부에서 ID 생성
 *   name: 'Tokyo Trip',
 *   destination: 'Tokyo',
 *   country: 'Japan',
 *   // ...
 * });
 * ```
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTripRequest) => TripRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create trip:', error);
    },
  });
};
