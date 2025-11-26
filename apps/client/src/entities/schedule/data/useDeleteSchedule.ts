import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import { scheduleQueryKeys } from './keys';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { expenseQueryKeys } from '@/entities/expense/data/keys';

/**
 * 일정 삭제 Mutation Hook (Soft Delete)
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteSchedule();
 * mutate('schedule-id');
 * ```
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ScheduleRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.base,
      });
      // Route 캐시 무효화 (경로 재계산 필요)
      queryClient.invalidateQueries({
        queryKey: routeQueryKeys.base,
      });
      // 연관 Expense 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete schedule:', error);
    },
  });
};
