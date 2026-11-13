import { z } from 'zod';

import { expenseEntity } from '../entities/expense';
import { scheduleEntity } from '../entities/schedule';
import { tripEntity } from '../entities/trip';
import { isoDateTime } from '../primitives/datetime';

const pullCursor = z.string().regex(/^(0|[1-9][0-9]{0,19})$/);

/** cursor를 보내면 같은 계정·활성 여행 범위의 지난 snapshot 이후부터 조회한다. */
export const syncPullQuerySchema = z.object({
  cursor: pullCursor.optional(),
  activatedTripIds: z.string().optional(),
  lastSyncedAt: isoDateTime.optional(), // ISO 8601 날짜 문자열
});

/**
 * Sync Pull 내부 데이터 스키마 (data 필드)
 *
 * 서버 → 클라이언트
 * - trips는 소유 여행, schedules/expenses는 활성 여행의 변경과 삭제 표시
 * - nextCursor는 다음 snapshot 조회의 시작점, serverTime은 마지막 수신 시각
 * - lastSyncedAt만 보낸 이전 앱은 시각 기반 증분 조회를 계속 사용한다.
 */
export const syncPullDataSchema = z.object({
  // HTTP JSON 계약: 서버 serializer가 DB Date를 문자열로 바꾼 뒤 반환한다.
  trips: z.array(tripEntity),
  schedules: z.array(scheduleEntity),
  expenses: z.array(expenseEntity),
  serverTime: isoDateTime,
  nextCursor: pullCursor.optional(),
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
