import { z } from 'zod';

// ========================================
// User Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Auth Provider enum
 */
export const authProviderSchema = z.enum(['google', 'apple']);
export type AuthProvider = z.infer<typeof authProviderSchema>;

/**
 * User Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 날짜: ISO 8601 datetime string
 * - userId는 서버에서 생성 (OAuth provider ID와 매핑)
 */
export const userEntity = z.object({
  // 서버 생성 필드
  id: z.string(), // ULID, 서버에서 생성
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),

  // OAuth 필드
  email: z.string().email(),
  name: z.string(),
  profileImageUrl: z.string().url().nullable().optional(),

  // OAuth Provider 정보
  provider: authProviderSchema,
  providerId: z.string(), // Google sub 또는 Apple user identifier
});
