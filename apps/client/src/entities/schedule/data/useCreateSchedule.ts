import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCreateSchedule } from '../api';
import { scheduleQueryKeys } from './useGetSchedules';
import type { CreateScheduleRequest } from '../model/types';

/**
 * 일정 생성
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => fetchCreateSchedule(data),
    onSuccess: (_, variables) => {
      // 해당 여행의 일정 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.list(variables.tripId),
      });
    },
  });
};
