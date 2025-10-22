import { useMutation } from '@tanstack/react-query';
import { fetchCreateSchedule } from '../api';
import type { CreateScheduleRequest } from '../model/types';

/**
 * 일정 생성
 */
export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => fetchCreateSchedule(data),
  });
};
