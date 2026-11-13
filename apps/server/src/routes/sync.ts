import { gte, inArray, and, eq, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';

import { syncPullQuerySchema, syncPullResponseSchema } from '@repo/schema/sync/sync-status';

import { db, trips, schedules, expenses } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeExpense } from '../serializers/expense.js';
import { serializeSchedule } from '../serializers/schedule.js';
import { serializeTrip } from '../serializers/trip.js';

const router = Router();

const XID_CYCLE = 4294967296n;

/** 소유 여행 메타데이터와 활성 여행 자식을 같은 PostgreSQL snapshot에서 조회한다.
 * 응답의 nextCursor는 아직 끝나지 않은 쓰기를 다음 pull에서 다시 확인할 하한이다.
 * cursor가 없는 구버전 앱에는 기존 lastSyncedAt 조회를 제공한다.
 */
router.get('/pull', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const query = syncPullQuerySchema.safeParse(req.query);

    if (!query.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid sync query',
        details: query.error.errors,
      });
    }

    const { cursor, lastSyncedAt, activatedTripIds } = query.data;
    const activatedIds =
      activatedTripIds
        ?.split(',')
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    const snapshot = await db.transaction(
      async (tx) => {
        // xmin보다 작은 트랜잭션은 모두 끝났다. 읽기 도중 또는 그 뒤에 commit하는
        // 작성자는 다음 조회가 같은 하한부터 다시 읽으므로 updatedAt이 오래돼도 빠지지 않는다.
        const [boundary] = await tx.execute<{
          oldest: string;
          upper: string;
          time: string;
        }>(sql`SELECT pg_snapshot_xmin(pg_current_snapshot())::text AS oldest,
                   pg_snapshot_xmax(pg_current_snapshot())::text AS upper,
                   statement_timestamp()::text AS time`);

        const since = cursor === undefined ? undefined : BigInt(cursor);
        const upper = BigInt(boundary.upper);

        // 행의 xmin은 32비트다. 한 바퀴 이상 지난 cursor나 복원 전 미래 cursor는 전체 조회한다.
        const xidRange =
          since !== undefined && since <= upper && upper - since < XID_CYCLE
            ? sql`mod(xmin::text::bigint - ${String(since % XID_CYCLE)}::bigint + 4294967296, 4294967296)
              < ${String(upper - since)}::bigint`
            : undefined;
        const changedSincePreviousPull = (
          updatedAt: typeof trips.updatedAt | typeof schedules.updatedAt | typeof expenses.updatedAt,
        ) => (cursor === undefined && lastSyncedAt ? gte(updatedAt, new Date(lastSyncedAt)) : xidRange);

        const tripsData = await tx
          .select()
          .from(trips)
          .where(and(eq(trips.userId, userId), changedSincePreviousPull(trips.updatedAt)))
          .orderBy(trips.updatedAt);

        const schedulesData = activatedIds.length
          ? await tx
              .select()
              .from(schedules)
              .where(
                and(
                  eq(schedules.userId, userId),
                  inArray(schedules.tripId, activatedIds),
                  changedSincePreviousPull(schedules.updatedAt),
                ),
              )
              .orderBy(schedules.updatedAt)
          : [];

        const expensesData = activatedIds.length
          ? await tx
              .select()
              .from(expenses)
              .where(
                and(
                  eq(expenses.userId, userId),
                  inArray(expenses.tripId, activatedIds),
                  changedSincePreviousPull(expenses.updatedAt),
                ),
              )
              .orderBy(expenses.updatedAt)
          : [];

        return {
          tripsData,
          schedulesData,
          expensesData,
          serverTime: new Date(boundary.time).toISOString(),
          nextCursor: boundary.oldest,
        };
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );

    const validatedResponse = syncPullResponseSchema.safeParse({
      success: true,
      data: {
        trips: snapshot.tripsData.map(serializeTrip),
        schedules: snapshot.schedulesData.map(serializeSchedule),
        expenses: snapshot.expensesData.map(serializeExpense),
        serverTime: snapshot.serverTime,
        nextCursor: snapshot.nextCursor,
      },
    });

    if (!validatedResponse.success) {
      console.error('❌ [Sync Pull] Response validation error:', validatedResponse.error);
      return res.status(500).json({
        error: 'Internal validation error',
        message: 'Response validation failed',
      });
    }

    res.status(200).json(validatedResponse.data);
  } catch (error) {
    res.locals.diagnosticError = error;
    console.error('❌ [Sync Pull] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Sync pull failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
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
router.post('/push', requireAuth, async (req: Request, res: Response) => {
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
    res.locals.diagnosticError = error;
    console.error('❌ [Sync Push] Error:', error);

    res.status(500).json({
      success: false,
      error: 'Sync push failed',
    });
  }
});

export default router;
