import { z } from 'zod';

// ========================================
// Sync Queue Schema (Outbox Pattern)
// ========================================

/**
 * 동기화 큐 작업 상태
 */
export const syncStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'FAILED']);

/**
 * 동기화 작업 타입
 */
export const syncActionEnum = z.enum(['CREATE', 'UPDATE', 'DELETE']);

/**
 * Sync Queue Entity Schema (DB)
 * - Outbox Pattern 구현을 위한 로컬 큐
 * - 로컬 데이터 변경사항을 서버로 전송하기 위한 대기열
 */
export const syncQueueSchema = z.object({
  id: z.string().ulid(),
  tableName: z.string(), // 'trips', 'schedules' 등
  recordId: z.string().ulid(), // 대상 레코드 ID
  action: syncActionEnum, // 'CREATE', 'UPDATE', 'DELETE'
  payload: z.string(), // JSON stringified 데이터
  status: syncStatusEnum.default('PENDING'),
  retryCount: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

/**
 * Sync Queue Insert Schema
 */
export const insertSyncQueueSchema = z.object({
  tableName: z.string().min(1),
  recordId: z.string().ulid(),
  action: syncActionEnum,
  payload: z.string(),
  status: syncStatusEnum.optional(),
  retryCount: z.number().int().optional(),
});

/**
 * Sync Queue Update Schema
 */
export const updateSyncQueueSchema = z
  .object({
    status: syncStatusEnum.optional(),
    retryCount: z.number().int().optional(),
    updatedAt: z.date().optional(),
  })
  .partial();

// ========================================
// Types
// ========================================
export type SyncQueue = z.infer<typeof syncQueueSchema>;
export type InsertSyncQueue = z.infer<typeof insertSyncQueueSchema>;
export type UpdateSyncQueue = z.infer<typeof updateSyncQueueSchema>;
export type SyncStatus = z.infer<typeof syncStatusEnum>;
export type SyncAction = z.infer<typeof syncActionEnum>;
