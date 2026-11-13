import { z } from 'zod';

import { isoDateTime } from '../primitives/datetime';
import { fieldEdits } from '../sync/field-edits';

// ========================================
// Schedule Entity Schema (공유 도메인/API 표현)
// ========================================

/**
 * Schedule Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB 저장 표현은 서버 serializer와 Local 저장·조회 경계에서 변환
 * - 날짜: ISO 8601 datetime string
 */
export const scheduleEntity = z.object({
  // Client-Side ID 필드
  id: z.string().ulid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  deletedAt: isoDateTime.nullable().optional(),
  version: z.number().default(1).optional(),
  fieldEdits: fieldEdits.optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  tripId: z.string().ulid(),
  title: z.string(),
  location: z.string(),
  address: z.string().nullable(),
  scheduledAt: isoDateTime,
  latitude: z.string().nullable(), // DB decimal → string
  longitude: z.string().nullable(),
});
