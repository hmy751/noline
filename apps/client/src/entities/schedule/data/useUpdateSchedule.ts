import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import type { UpdateScheduleRequest } from '../model';
import { scheduleQueryKeys } from './keys';
import { routeQueryKeys } from '@/entities/route/data/keys';

/**
 * 일정 수정 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateSchedule();
 * mutate({
 *   id: 'schedule-id',
 *   data: {
 *     title: 'Updated Schedule',
 *     scheduledAt: '2024-03-15T14:30:00.000Z',
 *   },
 * });
 * ```
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleRequest }) => ScheduleRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.base,
      });
      // Route 캐시 무효화 (경로 재계산 필요)
      queryClient.invalidateQueries({
        queryKey: routeQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update schedule:', error);
    },
  });
};
