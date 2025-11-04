import { z } from 'zod';

// ========================================
// User Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * User Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 날짜: ISO 8601 datetime string
 */
export const userEntity = z.object({
  // Echo Protocol 필드 (user는 uuid 사용)
  id: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  username: z.string(),
  password: z.string(), // hashed password
});

// 타입 추출
export type UserEntity = z.infer<typeof userEntity>;