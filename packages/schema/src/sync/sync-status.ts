import { z } from 'zod';
import { tripEntity } from '../entities/trip';
import { scheduleEntity } from '../entities/schedule';

// ========================================
// Sync Pull Schemas
// ========================================

/**
 * Pull 요청 Query Parameter 스키마
 *
 * GET /api/sync/pull?lastSyncedAt=2025-10-24T10:00:00.000Z
 */
export const syncPullQuerySchema = z.object({
  lastSyncedAt: z.string().datetime().optional(), // ISO 8601 날짜 문자열
});

/**
 * Pull 응답 데이터 스키마
 *
 * 서버 → 클라이언트
 * - trips: updatedAt >= lastSyncedAt인 여행 목록
 * - schedules: updatedAt >= lastSyncedAt인 일정 목록
 * - serverTime: 다음 동기화의 기준 시간
 */
export const syncPullResponseSchema = z.object({
  trips: z.array(
    tripEntity.extend({
      // DB Date → ISO string 변환
      createdAt: z.union([z.date(), z.string().datetime()]),
      updatedAt: z.union([z.date(), z.string().datetime()]),
      deletedAt: z.union([z.date(), z.string().datetime()]).nullable().optional(),
      startDate: z.union([z.date(), z.string().datetime()]).nullable().optional(),
      endDate: z.union([z.date(), z.string().datetime()]).nullable().optional(),
    }),
  ),
  schedules: z.array(
    scheduleEntity.extend({
      // DB Date → ISO string 변환
      createdAt: z.union([z.date(), z.string().datetime()]),
      updatedAt: z.union([z.date(), z.string().datetime()]),
      deletedAt: z.union([z.date(), z.string().datetime()]).nullable().optional(),
    }),
  ),
  serverTime: z.string().datetime(), // ISO 8601
});

// ========================================
// Sync Push Schemas (향후 구현)
// ========================================

/**
 * Push 요청 Body 스키마
 *
 * POST /api/sync/push
 */
export const syncPushRequestSchema = z.object({
  tableName: z.enum(['trips', 'schedules', 'expenses']),
  recordId: z.string().ulid(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.any(), // 테이블마다 다르므로 any
});

/**
 * Push 응답 스키마
 */
export const syncPushResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// ========================================
// Types
// ========================================

export type SyncPullQuery = z.infer<typeof syncPullQuerySchema>;
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;
