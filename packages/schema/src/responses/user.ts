import { z } from 'zod';
import { userEntity } from '../entities/user';

// ========================================
// User Response Schemas (API 응답)
// ========================================

/**
 * 회원가입 응답
 * POST /api/users/register
 */
export const createUserResponse = z.object({
  success: z.literal(true),
  data: userEntity.omit({ password: true }), // password 제외
});

/**
 * 로그인 응답
 * POST /api/users/login
 */
export const loginUserResponse = z.object({
  success: z.literal(true),
  data: z.object({
    user: userEntity.omit({ password: true }), // password 제외
    token: z.string().optional(), // JWT token (Phase 2)
  }),
});

// 타입 추출
export type CreateUserResponse = z.infer<typeof createUserResponse>;
export type LoginUserResponse = z.infer<typeof loginUserResponse>;
