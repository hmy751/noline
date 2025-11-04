import { z } from 'zod';
import { tripEntity } from '../entities/trip';

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
 */
export const deleteTripResponse = z.object({
  success: z.literal(true),
  message: z.string(),
});
