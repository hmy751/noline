import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScheduleRepository } from '../repository/schedule-repository';
import type { CreateScheduleRequest } from '../model';
import { scheduleQueryKeys } from './keys';

/**
 * 일정 생성 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - Echo Protocol: 외부에서 ID 생성하여 전달
 *
 * ⚠️ 주의: Policy 체크는 컴포넌트에서 useAppPolicy()로 수행
 *
 * @example
 * ```tsx
 * const policy = useAppPolicy(tripId);
 * const { mutate, isPending } = useCreateSchedule();
 *
 * if (!policy.createSchedule.allowed) {
 *   return <DisabledMessage reason={policy.createSchedule.reason} />;
 * }
 *
 * mutate({
 *   id: generateId(),
 *   tripId: 'trip-id',
 *   title: 'Eiffel Tower Visit',
 *   location: 'Eiffel Tower',
 *   scheduledAt: '2024-03-15T09:00:00+09:00',
 * });
 * ```
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => ScheduleRepository.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.list(variables.tripId),
      });
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.count(variables.tripId),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create schedule:', error);
    },
  });
};
