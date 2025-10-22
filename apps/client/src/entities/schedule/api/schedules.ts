import fetcher from '@/shared/api/fetcher';
import type { Schedule, CreateScheduleRequest } from '../model/types';

/**
 * 일정 생성
 */
export const fetchCreateSchedule = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const response = await fetcher.post<Schedule>('/api/schedules', data);
  return response as unknown as Schedule;
};
