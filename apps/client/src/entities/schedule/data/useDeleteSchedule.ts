import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import { scheduleQueryKeys } from './keys';

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
    },
    onError: (error) => {
      console.error('❌ Failed to delete schedule:', error);
    },
  });
};
