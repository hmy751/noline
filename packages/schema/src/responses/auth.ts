import { z } from 'zod';
import { authProviderSchema } from '../entities/user';

// ========================================
// Auth Response Schemas (API 응답)
// ========================================

/**
 * 로그인 응답에 포함되는 사용자 정보
 * (전체 userEntity와 달리 클라이언트에 필요한 필드만 포함)
 */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  profileImageUrl: z.string().url().nullable().optional(),
  provider: authProviderSchema,
});

/**
 * 로그인 응답
 * POST /api/auth/google, POST /api/auth/apple
 */
export const loginResponse = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: authUserSchema,
  }),
});

/**
 * 토큰 갱신 응답
 * POST /api/auth/refresh
 */
export const refreshTokenResponse = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

/**
 * 현재 사용자 정보 응답
 * GET /api/auth/me
 */
export const getCurrentUserResponse = z.object({
  success: z.literal(true),
  data: authUserSchema.extend({
    createdAt: z.string().datetime({ offset: true }),
  }),
});

/**
 * 로그아웃/회원탈퇴 응답
 * POST /api/auth/logout, DELETE /api/auth/account
 */
export const authMessageResponse = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});
