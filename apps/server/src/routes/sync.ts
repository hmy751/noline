import { Router } from 'express';
import type { Request, Response } from 'express';
import { db, trips, schedules } from '../db/index.js';
import { gte } from 'drizzle-orm';
import {
  syncPullQuerySchema,
  syncPullResponseSchema,
  syncPushRequestSchema,
  syncPushResponseSchema,
} from '@repo/schema';

const router = Router();

/**
 * GET /api/sync/pull
 *
 * 서버의 최신 데이터를 클라이언트로 전송 (Pull 동기화)
 *
 * Query Parameters:
 * - lastSyncedAt: ISO 8601 날짜 문자열 (선택, 없으면 전체 데이터)
 *
 * Response:
 * {
 *   trips: Trip[],
 *   schedules: Schedule[],
 *   serverTime: string (ISO 8601)
 * }
 *
 * @example
 * GET /api/sync/pull?lastSyncedAt=2025-10-24T10:00:00.000Z
 */
router.get('/pull', async (req: Request, res: Response) => {
  try {
    const { lastSyncedAt } = req.query;

    console.log('📥 [Sync Pull] Request received:', {
      lastSyncedAt: lastSyncedAt || 'Not provided (full sync)',
    });

    // lastSyncedAt이 있으면 증분 동기화, 없으면 전체 동기화
    const sinceDate = lastSyncedAt ? new Date(lastSyncedAt as string) : new Date(0); // Epoch (1970-01-01) = 전체 데이터

    // updatedAt >= sinceDate인 모든 레코드 조회
    const [tripsData, schedulesData] = await Promise.all([
      db.select().from(trips).where(gte(trips.updatedAt, sinceDate)).orderBy(trips.updatedAt),

      db.select().from(schedules).where(gte(schedules.updatedAt, sinceDate)).orderBy(schedules.updatedAt),
    ]);

    console.log('📥 [Sync Pull] Sending data:', {
      trips: tripsData.length,
      schedules: schedulesData.length,
    });

    // 서버 시간 반환 (다음 동기화의 기준점)
    const serverTime = new Date().toISOString();

    res.status(200).json({
      trips: tripsData,
      schedules: schedulesData,
      serverTime,
    });
  } catch (error) {
    console.error('❌ [Sync Pull] Error:', error);

    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: 'Sync pull failed',
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Sync pull failed',
        message: 'Unknown error occurred',
      });
    }
  }
});

/**
 * POST /api/sync/push
 *
 * 클라이언트 변경사항을 서버에 반영 (Push 동기화)
 *
 * Body:
 * {
 *   tableName: 'trips' | 'schedules',
 *   recordId: string,
 *   action: 'CREATE' | 'UPDATE' | 'DELETE',
 *   payload: object
 * }
 *
 * @example
 * POST /api/sync/push
 * {
 *   tableName: 'trips',
 *   recordId: '01K8BFTX...',
 *   action: 'CREATE',
 *   payload: { id: '01K8...', name: 'Tokyo', ... }
 * }
 */
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { tableName, recordId, action, payload } = req.body;

    console.log('📤 [Sync Push] Request received:', {
      tableName,
      recordId,
      action,
    });

    // TODO: Phase 5에서 구현
    // 현재는 기존 REST API (/api/trips, /api/schedules) 사용

    res.status(501).json({
      success: false,
      error: 'Not implemented yet',
      message: 'Please use existing REST endpoints (/api/trips, /api/schedules) for now',
    });
  } catch (error) {
    console.error('❌ [Sync Push] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Sync push failed',
    });
  }
});

export default router;
