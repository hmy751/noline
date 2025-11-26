import apiClient from '@/shared/api/fetcher';
import { createScheduleRequest, updateScheduleRequest } from '@repo/schema/requests/schedule';
import { scheduleListResponse, scheduleResponse, deleteScheduleResponse } from '@repo/schema/responses/schedule';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../model';

// ========================================
// Schedule API Functions
// ========================================

/**
 * 여행의 일정 목록을 조회합니다.
 * @param tripId - 여행 ID
 * @returns 일정 목록
 */
export const fetchSchedules = async (tripId: string): Promise<Schedule[]> => {
  try {
    const data = await apiClient.get(`/api/schedules?tripId=${tripId}`);

    const validated = scheduleListResponse.parse(data);
    console.log(`📋 Schedules loaded from server: ${validated.data.length} items`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 특정 일정을 조회합니다.
 * @param id - 일정 ID
 * @returns 일정 정보
 */
export const fetchScheduleById = async (id: string): Promise<Schedule> => {
  try {
    const data = await apiClient.get(`/api/schedules/${id}`);

    const validated = scheduleResponse.parse(data);
    console.log(`📋 Schedule loaded from server: ${id}`);
    return validated.data;
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
export const fetchCreateSchedule = async (data: CreateScheduleRequest): Promise<Schedule> => {
  try {
    const validatedInput = createScheduleRequest.parse(data);
    const responseData = await apiClient.post('/api/schedules', validatedInput);

    const validated = scheduleResponse.parse(responseData);
    console.log(`✅ Schedule created on server: ${validated.data.id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 일정을 수정합니다.
 * @param id - 일정 ID
 * @param data - 수정할 데이터
 * @returns 수정된 일정 정보
 */
export const fetchUpdateSchedule = async (id: string, data: UpdateScheduleRequest): Promise<Schedule> => {
  try {
    const validatedInput = updateScheduleRequest.parse(data);
    const responseData = await apiClient.put(`/api/schedules/${id}`, validatedInput);

    const validated = scheduleResponse.parse(responseData);
    console.log(`✅ Schedule updated on server: ${id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};

/**
 * 일정을 삭제합니다.
 * @param id - 일정 ID
 * @returns 삭제된 일정 정보
 */
export const fetchDeleteSchedule = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  try {
    const responseData = await apiClient.delete(`/api/schedules/${id}`);

    const validated = deleteScheduleResponse.parse(responseData);
    console.log(`✅ Schedule deleted on server: ${id}`);
    return validated.data;
  } catch (error) {
    console.error('❌ error', error);
    throw error;
  }
};
