import fetcher from '@/shared/api/fetcher';
import type { Schedule, CreateScheduleRequest } from '../model/types';

/**
 * 여행의 일정 목록 조회
 */
export const fetchSchedules = async (tripId: string): Promise<Schedule[]> => {
  const response = await fetcher.get<{ success: boolean; data: Schedule[] }>(`/api/trips/${tripId}/schedules`);
  return response.data as unknown as Schedule[];
};

/**
 * 일정 생성
 */
export const fetchCreateSchedule = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const response = await fetcher.post<{ success: boolean; data: Schedule }>('/api/schedules', data);
  return response.data as unknown as Schedule;
};
