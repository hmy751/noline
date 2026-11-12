import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { routeQueryKeys } from '@/entities/route/data/keys';

import { scheduleQueryKeys } from './keys';
import { ScheduleRepository } from '../repository/schedule-repository';

/**
 * 일정 삭제 Mutation Hook (Soft Delete)
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteSchedule();
 * mutate({ id: 'schedule-id', tripId: 'trip-id' });
 * ```
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tripId }: { id: string; tripId: string }) => ScheduleRepository.delete(id, tripId),
    onSuccess: async () => {
      await Promise.all([
        cancelAndInvalidateQueries(queryClient, { queryKey: scheduleQueryKeys.base }),
        cancelAndInvalidateQueries(queryClient, { queryKey: routeQueryKeys.base }),
        // 삭제한 일정과 연결되어 있던 경비도 다시 조회한다.
        cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.base }),
      ]);
    },
    onError: (error) => {
      console.error('[Schedule] Failed to delete schedule', error);
    },
  });
};
