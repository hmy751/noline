import { z } from 'zod';
import { tripEntity } from '../entities/trip';
import { scheduleEntity } from '../entities/schedule';
import { expenseEntity } from '../entities/expense';

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
 * Sync Pull 내부 데이터 스키마 (data 필드)
 *
 * 서버 → 클라이언트
 * - trips: updatedAt >= lastSyncedAt인 여행 목록
 * - schedules: updatedAt >= lastSyncedAt인 일정 목록
 * - expenses: updatedAt >= lastSyncedAt인 경비 목록
 * - serverTime: 다음 동기화의 기준 시간
 */
export const syncPullDataSchema = z.object({
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
  expenses: z.array(
    expenseEntity.extend({
      // DB Date → ISO string 변환
      createdAt: z.union([z.date(), z.string().datetime()]),
      updatedAt: z.union([z.date(), z.string().datetime()]),
      deletedAt: z.union([z.date(), z.string().datetime()]).nullable().optional(),
    }),
  ),
  serverTime: z.string().datetime(), // ISO 8601
});

/**
 * Sync Pull 응답 스키마 (정책: { success, data } 구조)
 */
export const syncPullResponseSchema = z.object({
  success: z.literal(true),
  data: syncPullDataSchema,
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
