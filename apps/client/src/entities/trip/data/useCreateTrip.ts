import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripRepository } from '../repository/trip-repository';
import type { CreateTripRequest } from '../model';
import { tripQueryKeys } from './keys';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';

/**
 * 여행 생성 Mutation Hook
 *
 * - Repository를 통해 서버에 생성하고 목록 재조회
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
    onSuccess: () => cancelAndInvalidateQueries(queryClient, { queryKey: tripQueryKeys.all() }),
    onError: (error) => {
      console.error('❌ Failed to create trip:', error);
    },
  });
};
