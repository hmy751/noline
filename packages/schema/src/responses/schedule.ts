import { scheduleEntity } from '../entities/schedule';
import { okResponse, okListResponse, deleteResponse } from './_envelope';

// ========================================
// Schedule Response Schemas (API 응답)
// ========================================

/**
 * 단일 일정 응답
 * POST /api/schedules, PATCH /api/schedules/:id
 */
export const scheduleResponse = okResponse(scheduleEntity);

/**
 * 일정 목록 응답
 * GET /api/schedules, GET /api/trips/:tripId/schedules
 */
export const scheduleListResponse = okListResponse(scheduleEntity);

/**
 * 일정 삭제 응답
 * DELETE /api/schedules/:id
 */
export const deleteScheduleResponse = deleteResponse;
