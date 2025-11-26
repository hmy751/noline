import { z } from 'zod';
import { tripEntity } from '../entities/trip';
import { scheduleEntity } from '../entities/schedule';
import { expenseEntity } from '../entities/expense';

// ========================================
// Trip Response Schemas (API 응답)
// ========================================

/**
 * 단일 여행 응답
 * POST /api/trips, PATCH /api/trips/:id
 */
export const tripResponse = z.object({
  success: z.literal(true),
  data: tripEntity,
});

/**
 * 여행 목록 응답
 * GET /api/trips
 */
export const tripListResponse = z.object({
  success: z.literal(true),
  data: z.array(tripEntity),
});

/**
 * 여행 삭제 응답
 * DELETE /api/trips/:id
 *
 * 정책: 모든 API 응답은 { success, data } 구조를 따른다
 */
export const deleteTripResponse = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().ulid(),
    deletedAt: z.string().datetime({ offset: true }),
  }),
});

/**
 * 여행 활성화 응답
 * POST /api/trips/:id/activate
 *
 * 활성화 시 모든 Trip 메타데이터 + 해당 Trip의 Schedule/Expense 반환
 */
export const activateTripResponse = z.object({
  success: z.literal(true),
  data: z.object({
    trips: z.array(tripEntity), // 모든 Trip 메타데이터
    schedules: z.array(scheduleEntity), // 활성화된 Trip의 Schedule
    expenses: z.array(expenseEntity), // 활성화된 Trip의 Expense
  }),
  message: z.string().optional(),
});
