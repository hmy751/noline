import { z } from 'zod';

// ========================================
// Trip Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Trip Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 날짜: ISO 8601 datetime string
 */
export const tripEntity = z.object({
  // Client-Side ID 필드
  id: z.string().ulid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(),
  baseCurrency: z.string(), // 여행 기본 통화
  latitude: z.string().nullable(), // DB decimal → string
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
});
