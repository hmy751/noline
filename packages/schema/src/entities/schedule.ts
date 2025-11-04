import { z } from 'zod';

// ========================================
// Schedule Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Schedule Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 날짜: ISO 8601 datetime string
 */
export const scheduleEntity = z.object({
  // Echo Protocol 필드
  id: z.string().ulid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string().ulid(),
  title: z.string(),
  location: z.string(),
  address: z.string().nullable(),
  scheduledAt: z.string().datetime({ offset: true }),
  latitude: z.string().nullable(), // DB decimal → string
  longitude: z.string().nullable(),
});
