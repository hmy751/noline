import { z } from 'zod';
import { userEntity } from '../entities/user';

// ========================================
// User Response Schemas (API 응답)
// ========================================

/**
 * 사용자 정보 응답
 * GET /api/users/:id
 */
export const getUserResponse = z.object({
  success: z.literal(true),
  data: userEntity,
});

/**
 * 사용자 목록 응답
 * GET /api/users
 */
export const getUserListResponse = z.object({
  success: z.literal(true),
  data: z.array(userEntity),
});
