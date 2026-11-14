import { and, eq, isNotNull, lt, ne, notExists, sql } from 'drizzle-orm';

import {
  expenses,
  getDatabase,
  schedules,
  syncQueue,
  tripActivations,
  legacySyncHolds,
  serverRecords,
} from '@/shared/db';
import { getCurrentISOString, withTransaction } from '@/shared/db/utils';
import { SOFT_DELETE_VACUUM_DAYS } from '@/shared/lib/lifecycle';
import { queryClient } from '@/shared/lib/queryClient';
import { generateId } from '@/shared/services/id/ulid';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';
import { requireLocalUserId } from '@/shared/store/auth';

import { hasUnresolvedTripChangesInTransaction } from './queue';
import { releaseServerRecordBodiesInTransaction } from './server-state';

let activeCleanup: Promise<number> | null = null;
let pauseCount = 0;

/**
 * 앱 시작·sync가 요청한 정리를 공유하며 캐시 후처리도 한 번만 수행한다.
 * 예외 없이 검사를 마친 여행 수를 반환하며, 미전송 입력 보호로 정리를 유예한 여행도 포함한다.
 */
export function processPendingCleanups(): Promise<number> {
  if (pauseCount > 0) {
    return Promise.resolve(0);
  }

  if (activeCleanup) {
    return activeCleanup;
  }

  activeCleanup = runPendingCleanups()
    .then((handledTripCount) => {
      if (handledTripCount > 0) {
        // 캐시 재조회 완료는 정리 완료와 별개이며 실패해도 정리 결과를 바꾸지 않는다.
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['trip'] }),
          queryClient.invalidateQueries({ queryKey: ['schedule'] }),
          queryClient.invalidateQueries({ queryKey: ['expense'] }),
        ]).catch((error) => console.error('[Cleanup] cache refresh failed', error));
      }

      return handledTripCount;
    })
    .finally(() => {
      activeCleanup = null;
    });
  return activeCleanup;
}

/** 로컬 세션을 비우는 동안 새 정리를 막고 이미 시작한 정리의 종료를 기다린다. */
export async function withPendingCleanupsPaused<T>(operation: () => Promise<T>): Promise<T> {
  pauseCount++;
  try {
    // 정리 실패는 실행부에서 기록한다. 실패로 끝나도 로그아웃 자체는 진행한다.
    await activeCleanup?.catch(() => undefined);
    return await operation();
  } finally {
    pauseCount--;
  }
}

/** 미완료 정리를 순회한다. 미동기화 보호·soft delete·지도 정리는 여행별 실행에서 처리한다. */
async function runPendingCleanups(): Promise<number> {
  try {
    const pendingCleanups = await getDatabase()
      .select()
      .from(tripActivations)
      .where(eq(tripActivations.cleanupPending, true))
      .all();

    if (pendingCleanups.length === 0) {
      return 0;
    }

    let handledTripCount = 0;

    for (const activation of pendingCleanups) {
      try {
        await processCleanupForTrip(activation);
        handledTripCount++;
      } catch (error) {
        console.error(`[Cleanup] Failed to process cleanup for trip ${activation.tripId}:`, error);
        // 개별 여행 cleanup 실패해도 다음 여행 계속 처리
      }
    }

    // Cleanup 완료 후 Vacuum 실행 (7일 이상 지난 Soft delete 레코드 Hard delete)
    try {
      await vacuumDeletedRecords();
    } catch (error) {
      console.error('[Cleanup] Failed to vacuum deleted records (ignored):', error);
      // Vacuum 실패해도 cleanup은 성공으로 처리
    }

    return handledTripCount;
  } catch (error) {
    console.error('[Cleanup] Failed to process pending cleanups:', error);
    throw error;
  }
}

/** 사본 정리와 준비 ID 갱신을 함께 확정한다. 이전 준비 상태의 pull이 사본을 되살릴 수 없다. */
export const clearTripCopiesInTransaction = async (tripId: string, now: string): Promise<void> => {
  const db = getDatabase();
  const userId = requireLocalUserId();

  await releaseServerRecordBodiesInTransaction(tripId);

  for (const table of [schedules, expenses] as const) {
    await db
      .update(table)
      .set({ deletedAt: now, updatedAt: now, version: sql`${table.version} + 1` })
      .where(and(eq(table.tripId, tripId), eq(table.userId, userId)));
  }

  await db
    .update(tripActivations)
    .set({ id: generateId(), cleanupPending: false, updatedAt: now })
    .where(and(eq(tripActivations.tripId, tripId), eq(tripActivations.userId, userId)));
};

type CleanupReservation = Pick<typeof tripActivations.$inferSelect, 'id' | 'tripId' | 'userId'>;

const processCleanupForTrip = async ({ id, tripId, userId }: CleanupReservation): Promise<void> => {
  const cleaned = await withTransaction(async () => {
    if (userId !== requireLocalUserId()) {
      return false;
    }

    const db = getDatabase();
    const reservation = and(
      eq(tripActivations.id, id),
      eq(tripActivations.tripId, tripId),
      eq(tripActivations.userId, userId),
      eq(tripActivations.cleanupPending, true),
    );
    const current = await db
      .select({ isActivated: tripActivations.isActivated })
      .from(tripActivations)
      .where(reservation)
      .get();
    if (!current) {
      return false;
    }

    // 구버전이 활성 여행에 남긴 예약은 사본을 보존하고 표시만 지운다.
    if (current.isActivated) {
      await db.update(tripActivations).set({ cleanupPending: false }).where(reservation);
      return false;
    }

    if (await hasUnresolvedTripChangesInTransaction(tripId)) {
      return false;
    }

    await clearTripCopiesInTransaction(tripId, getCurrentISOString());
    return true;
  });

  if (!cleaned) {
    return;
  }

  try {
    await cleanupOfflineMapForTrip(tripId);
  } catch (error) {
    console.error(`[Cleanup] Failed to cleanup offline map for trip ${tripId} (ignored):`, error);
    // 지도 정리 실패해도 cleanup은 성공으로 처리
  }
};

/**
 * 특정 여행에 대한 cleanup 강제 실행
 *
 * sync_queue 체크 없이 즉시 cleanup 실행
 * 주의: 동기화되지 않은 데이터가 손실될 수 있음
 *
 * @param tripId - 여행 ID
 */
export const forceCleanupTrip = async (tripId: string): Promise<void> => {
  const now = getCurrentISOString();

  console.warn(`[Cleanup] Force cleanup for trip: ${tripId} (sync_queue ignored)`);

  await withTransaction(() => clearTripCopiesInTransaction(tripId, now));

  // 오프라인 지도 삭제
  try {
    await cleanupOfflineMapForTrip(tripId);
  } catch (error) {
    console.error(`[Cleanup] Failed to cleanup offline map (ignored):`, error);
  }
};

/** 유예 기간이 끝난 기기 사본 중 큐·보류 입력에서 참조하지 않는 원본을 지우고 표별 삭제 수를 반환한다. */
export const vacuumDeletedRecords = async (): Promise<{ schedules: number; expenses: number }> => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - SOFT_DELETE_VACUUM_DAYS);
  const thresholdISO = thresholdDate.toISOString();

  let schedulesDeleted = 0;
  let expensesDeleted = 0;

  await withTransaction(async () => {
    // 재전송할 큐의 원본을 보존한다. 영속 격리된 입력은 큐 자체에 남는다.
    for (const [tableName, table] of [
      ['schedules', schedules],
      ['expenses', expenses],
    ] as const) {
      const canDelete = and(
        isNotNull(table.deletedAt),
        lt(table.deletedAt, thresholdISO),
        notExists(
          getDatabase()
            .select({ id: legacySyncHolds.id })
            .from(legacySyncHolds)
            .where(
              and(
                eq(legacySyncHolds.tableName, tableName),
                eq(legacySyncHolds.recordId, table.id),
                eq(legacySyncHolds.userId, table.userId),
              ),
            ),
        ),
        notExists(
          getDatabase()
            .select({ id: syncQueue.id })
            .from(syncQueue)
            .where(
              and(
                eq(syncQueue.tableName, tableName),
                eq(syncQueue.recordId, table.id),
                ne(syncQueue.status, 'QUARANTINED'),
              ),
            ),
        ),
      );

      const records = await getDatabase()
        .select({ id: table.id, userId: table.userId, tripId: table.tripId })
        .from(table)
        .where(canDelete)
        .all();

      if (records.length > 0) {
        for (const record of records) {
          await getDatabase()
            .update(serverRecords)
            .set({ record: null })
            .where(
              and(
                eq(serverRecords.tableName, tableName),
                eq(serverRecords.recordId, record.id),
                eq(serverRecords.userId, record.userId),
                eq(serverRecords.tripId, record.tripId),
              ),
            );
        }

        await getDatabase().delete(table).where(canDelete);
      }

      if (tableName === 'schedules') {
        schedulesDeleted = records.length;
      } else {
        expensesDeleted = records.length;
      }
    }
  });

  return { schedules: schedulesDeleted, expenses: expensesDeleted };
};
