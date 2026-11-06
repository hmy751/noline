import { z } from 'zod';
import { isoDateTime } from '../primitives/datetime';

// ========================================
// Sync Queue Schema (Outbox Pattern)
// ========================================

/**
 * 동기화 큐 작업 상태
 */
export const syncStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'FAILED', 'QUARANTINED']);

/**
 * 동기화 작업 타입
 */
export const syncActionEnum = z.enum(['CREATE', 'UPDATE', 'DELETE']);

/** 삭제한 행에서 확인해 큐에 저장하는 소유자 정보. 구버전 요청에는 이 버전 표시가 없다. */
export const deleteQueuePayloadSchema = z.object({
  ownerVersion: z.literal(1),
  userId: z.string().min(1),
  tripId: z.string().min(1).nullish(),
});

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
  createdAt: isoDateTime,
  updatedAt: isoDateTime.optional(),
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
    updatedAt: isoDateTime.optional(),
  })
  .partial();
