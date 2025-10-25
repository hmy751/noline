import axios from '@/shared/api/fetcher';
import { createScheduleRequestSchema, getAllSchedulesResponseSchema, createScheduleResponseSchema } from '@repo/schema';
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
    const data = await axios.get(`/api/trips/${tripId}/schedules`);

    const validated = getAllSchedulesResponseSchema.parse(data);
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
    const validatedInput = createScheduleRequestSchema.parse(data);
    const responseData = await axios.post('/api/schedules', validatedInput);

    const validated = createScheduleResponseSchema.parse(responseData);
    return validated;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};
