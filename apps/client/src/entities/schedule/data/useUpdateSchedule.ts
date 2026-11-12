import { useMutation, useQueryClient } from '@tanstack/react-query';

import { routeQueryKeys } from '@/entities/route/data/keys';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';

import { scheduleQueryKeys } from './keys';
import type { UpdateScheduleRequest } from '../model';
import { ScheduleRepository } from '../repository/schedule-repository';

type UpdateScheduleInput = {
  id: string;
  tripId: string;
  data: UpdateScheduleRequest;
};

/** 수정 중 발견한 삭제·보류도 목록에 반영하므로 실패한 경우에도 다시 조회한다. */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tripId, data }: UpdateScheduleInput) => ScheduleRepository.update(id, tripId, data),
    onSettled: async (savedSchedule) => {
      await Promise.all([
        cancelAndInvalidateQueries(queryClient, { queryKey: scheduleQueryKeys.base }),
        ...(savedSchedule ? [cancelAndInvalidateQueries(queryClient, { queryKey: routeQueryKeys.base })] : []),
      ]);
    },
    onError: (error) => {
      console.error('[Schedule] Failed to update schedule', error);
    },
  });
};
