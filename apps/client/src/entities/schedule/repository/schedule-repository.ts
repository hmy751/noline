// ========================================
// Schedule Repository - 활성화 상태에 따른 Local/Remote 분기
// ========================================

import { routeChildQuery, routeChildMutation } from '@/shared/services/offline-prep/router';
import * as ScheduleLocal from '../lib/schedule-local';
import * as ScheduleApi from '../api/schedules';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../model';

/**
 * Schedule Repository
 *
 * - 활성화된 Trip: Local DB 사용
 * - 비활성 Trip: Server API 사용
 * - routeChildQuery/Mutation이 tripId 기반으로 자동 분기
 */
export const ScheduleRepository = {
  /**
   * 여행의 일정 목록 조회
   */
  getByTripId: async (tripId: string): Promise<Schedule[]> => {
    return await routeChildQuery(tripId, {
      local: () => ScheduleLocal.getSchedulesLocal(tripId),
      remote: () => ScheduleApi.fetchSchedules(tripId),
    });
  },

  /**
   * 특정 일정 조회
   * @param id - 일정 ID
   * @param tripId - 여행 ID (라우팅 판단용)
   */
  getById: async (id: string, tripId: string): Promise<Schedule | undefined> => {
    return await routeChildQuery(tripId, {
      local: () => ScheduleLocal.getScheduleByIdLocal(id),
      remote: () => ScheduleApi.fetchScheduleById(id),
    });
  },

  /**
   * 여행의 일정 개수 조회
   * - 로컬 전용 (오프라인 지도 다운로드 트리거용)
   */
  getCount: async (tripId: string): Promise<number> => {
    return await ScheduleLocal.getScheduleCountLocal(tripId);
  },

  /**
   * 일정 생성
   */
  create: async (data: CreateScheduleRequest): Promise<Schedule> => {
    return await routeChildMutation(data.tripId, {
      local: () => ScheduleLocal.createScheduleLocal(data),
      remote: () => ScheduleApi.fetchCreateSchedule(data),
    });
  },

  /**
   * 일정 수정
   * - tripId를 먼저 조회하여 라우팅 결정
   */
  update: async (id: string, data: UpdateScheduleRequest): Promise<Schedule> => {
    // 1. 일정의 tripId 조회 (라우팅을 위해 필요)
    const tripId = await ScheduleLocal.getScheduleTripIdLocal(id);

    if (!tripId) {
      throw new Error(`Schedule not found: ${id}`);
    }

    return await routeChildMutation(tripId, {
      local: () => ScheduleLocal.updateScheduleLocal(id, data),
      remote: () => ScheduleApi.fetchUpdateSchedule(id, data),
    });
  },

  /**
   * 일정 삭제 (Soft Delete)
   * - tripId를 먼저 조회하여 라우팅 결정
   */
  delete: async (id: string): Promise<{ id: string; deletedAt: string }> => {
    // 1. 일정의 tripId 조회 (라우팅을 위해 필요)
    const tripId = await ScheduleLocal.getScheduleTripIdLocal(id);

    if (!tripId) {
      throw new Error(`Schedule not found: ${id}`);
    }

    return await routeChildMutation(tripId, {
      local: () => ScheduleLocal.deleteScheduleLocal(id),
      remote: () => ScheduleApi.fetchDeleteSchedule(id),
    });
  },
};
