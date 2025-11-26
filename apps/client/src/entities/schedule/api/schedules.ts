import apiClient from '@/shared/api/fetcher';
import { createScheduleRequest } from '@repo/schema/requests/schedule';
import { scheduleListResponse, scheduleResponse } from '@repo/schema/responses/schedule';
import type { GetAllSchedulesResponse, CreateScheduleRequest, CreateScheduleResponse } from '../model';

// ========================================
// Schedule API Functions
// ========================================

/**
 * 여행의 일정 목록을 조회합니다.
 * @param tripId - 여행 ID
 * @returns 일정 목록
 */
export const fetchSchedules = async (tripId: string): Promise<GetAllSchedulesResponse> => {
  try {
    const data = await apiClient.get(`/api/trips/${tripId}/schedules`);

    const validated = scheduleListResponse.parse(data);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 새로운 일정을 생성합니다.
 * @param data - 일정 생성 요청 데이터
 * @returns 생성된 일정 정보
 */
export const fetchCreateSchedule = async (data: CreateScheduleRequest): Promise<CreateScheduleResponse> => {
  try {
    const validatedInput = createScheduleRequest.parse(data);
    const responseData = await apiClient.post('/api/schedules', validatedInput);

    const validated = scheduleResponse.parse(responseData);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};
