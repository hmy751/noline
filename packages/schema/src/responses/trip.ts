import { z } from 'zod';
import { tripEntity } from '../entities/trip';
import { scheduleEntity } from '../entities/schedule';
import { expenseEntity } from '../entities/expense';
import { okResponse, okListResponse, deleteResponse } from './_envelope';

// ========================================
// Trip Response Schemas (API 응답)
// ========================================

/**
 * 단일 여행 응답
 * POST /api/trips, PATCH /api/trips/:id
 */
export const tripResponse = okResponse(tripEntity);

/**
 * 여행 목록 응답
 * GET /api/trips
 */
export const tripListResponse = okListResponse(tripEntity);

/**
 * 여행 삭제 응답
 * DELETE /api/trips/:id
 */
export const deleteTripResponse = deleteResponse;

/**
 * 여행 활성화 응답
 * POST /api/trips/:id/activate
 *
 * 활성화 시 모든 Trip 메타데이터 + 해당 Trip의 Schedule/Expense 반환
 */
export const activateTripResponse = z.object({
  success: z.literal(true),
  data: z.object({
    trips: z.array(tripEntity),
    schedules: z.array(scheduleEntity),
    expenses: z.array(expenseEntity),
  }),
  message: z.string().optional(),
});
