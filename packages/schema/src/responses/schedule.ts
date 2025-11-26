import { z } from 'zod';
import { scheduleEntity } from '../entities/schedule';

// ========================================
// Schedule Response Schemas (API 응답)
// ========================================

/**
 * 단일 일정 응답
 * POST /api/schedules, PATCH /api/schedules/:id
 */
export const scheduleResponse = z.object({
  success: z.literal(true),
  data: scheduleEntity,
});

/**
 * 일정 목록 응답
 * GET /api/schedules, GET /api/trips/:tripId/schedules
 */
export const scheduleListResponse = z.object({
  success: z.literal(true),
  data: z.array(scheduleEntity),
});

/**
 * 일정 삭제 응답
 * DELETE /api/schedules/:id
 *
 * 정책: 모든 API 응답은 { success, data } 구조를 따른다
 */
export const deleteScheduleResponse = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().ulid(),
    deletedAt: z.string().datetime({ offset: true }),
  }),
});
