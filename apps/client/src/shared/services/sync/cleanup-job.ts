import { getDatabase, tripActivations, schedules, expenses } from '@/shared/db';
import { eq, sql, and, isNotNull, lt } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { hasPendingTasksForTrip } from './queue';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';
import { queryClient } from '@/shared/lib/queryClient';
import { SOFT_DELETE_VACUUM_DAYS } from '@/shared/lib/lifecycle';

let activeCleanup: Promise<number> | null = null;
let pauseCount = 0;

/** 앱 시작·sync가 요청한 정리를 공유하며 캐시 후처리도 한 번만 수행한다. */
export function processPendingCleanups(): Promise<number> {
  if (pauseCount > 0) {
    return Promise.resolve(0);
  }
  if (activeCleanup) {
    return activeCleanup;
  }

  activeCleanup = runPendingCleanups()
    .then((processedCount) => {
      if (processedCount > 0) {
        // 캐시 재조회 완료는 정리 완료와 별개이며 실패해도 정리 결과를 바꾸지 않는다.
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: ['trip'] }),
          queryClient.invalidateQueries({ queryKey: ['schedule'] }),
          queryClient.invalidateQueries({ queryKey: ['expense'] }),
        ]).catch((error) => console.error('[Cleanup] cache refresh failed', error));
      }

      return processedCount;
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
    // cleanupPending = true인 여행 조회
    const pendingCleanups = await getDatabase()
      .select()
      .from(tripActivations)
      .where(eq(tripActivations.cleanupPending, true))
      .all();

    if (pendingCleanups.length === 0) {
      console.log('[Cleanup] No pending cleanups');
      return 0;
    }

    console.log(`[Cleanup] Processing ${pendingCleanups.length} pending cleanups...`);

    let processedCount = 0;

    for (const activation of pendingCleanups) {
      try {
        await processCleanupForTrip(activation.tripId);
        processedCount++;
      } catch (error) {
        console.error(`[Cleanup] Failed to process cleanup for trip ${activation.tripId}:`, error);
        // 개별 여행 cleanup 실패해도 다음 여행 계속 처리
      }
    }

    console.log(`[Cleanup] Processed ${processedCount}/${pendingCleanups.length} cleanups`);

    // Cleanup 완료 후 Vacuum 실행 (7일 이상 지난 Soft delete 레코드 Hard delete)
    try {
      const vacuumResult = await vacuumDeletedRecords();
      const totalVacuumed = vacuumResult.schedules + vacuumResult.expenses;
      if (totalVacuumed > 0) {
        console.log(`[Cleanup] Vacuumed ${totalVacuumed} old deleted records`);
      }
    } catch (error) {
      console.error('[Cleanup] Failed to vacuum deleted records (ignored):', error);
      // Vacuum 실패해도 cleanup은 성공으로 처리
    }

    return processedCount;
  } catch (error) {
    console.error('[Cleanup] Failed to process pending cleanups:', error);
    throw error;
  }
}

/**
 * 특정 여행의 cleanup 처리
 *
 * @param tripId - 여행 ID
 */
async function processCleanupForTrip(tripId: string): Promise<void> {
  const now = getCurrentISOString();

  // sync_queue에 PENDING 작업이 있는지 확인
  const hasPending = await hasPendingTasksForTrip(tripId);

  if (hasPending) {
    console.log(`[Cleanup] Trip ${tripId} still has pending sync tasks - skipping cleanup`);
    return;
  }

  // 모든 작업이 동기화 완료됨 → Soft delete 실행
  console.log(`[Cleanup] All sync tasks completed for trip ${tripId} - executing cleanup`);

  await withTransaction(async () => {
    // Soft delete: schedules
    await getDatabase()
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(eq(schedules.tripId, tripId));

    // Soft delete: expenses
    await getDatabase()
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.tripId, tripId));

    // cleanupPending 플래그 제거
    await getDatabase()
      .update(tripActivations)
      .set({
        cleanupPending: false,
        updatedAt: now,
      })
      .where(eq(tripActivations.tripId, tripId));

    console.log(`[Cleanup] Local data soft-deleted for trip: ${tripId}`);
  });

  // 오프라인 지도 삭제 (트랜잭션 외부)
  try {
    await cleanupOfflineMapForTrip(tripId);
    console.log(`[Cleanup] Offline map cleaned up for trip: ${tripId}`);
  } catch (error) {
    console.error(`[Cleanup] Failed to cleanup offline map for trip ${tripId} (ignored):`, error);
    // 지도 정리 실패해도 cleanup은 성공으로 처리
  }
}

/**
 * 특정 여행에 대한 cleanup 강제 실행
 *
 * sync_queue 체크 없이 즉시 cleanup 실행
 * 주의: 동기화되지 않은 데이터가 손실될 수 있음
 *
 * @param tripId - 여행 ID
 */
export async function forceCleanupTrip(tripId: string): Promise<void> {
  const now = getCurrentISOString();

  console.warn(`[Cleanup] Force cleanup for trip: ${tripId} (sync_queue ignored)`);

  await withTransaction(async () => {
    // Soft delete: schedules
    await getDatabase()
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(eq(schedules.tripId, tripId));

    // Soft delete: expenses
    await getDatabase()
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.tripId, tripId));

    // cleanupPending 플래그 제거
    await getDatabase()
      .update(tripActivations)
      .set({
        cleanupPending: false,
        updatedAt: now,
      })
      .where(eq(tripActivations.tripId, tripId));
  });

  // 오프라인 지도 삭제
  try {
    await cleanupOfflineMapForTrip(tripId);
  } catch (error) {
    console.error(`[Cleanup] Failed to cleanup offline map (ignored):`, error);
  }

  console.log(`[Cleanup] Force cleanup completed for trip: ${tripId}`);
}

/**
 * Vacuum: Soft delete된 레코드를 완전히 삭제 (Hard delete)
 *
 * deletedAt이 설정된 지 SOFT_DELETE_VACUUM_DAYS 지난 레코드를
 * 데이터베이스에서 완전히 제거하여 저장 공간 회수
 *
 * 실행 시점:
 * - processPendingCleanups() 완료 후 자동 실행
 * - 앱 시작 시 1회 실행
 *
 * @returns 삭제된 레코드 수
 */
export async function vacuumDeletedRecords(): Promise<{ schedules: number; expenses: number }> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - SOFT_DELETE_VACUUM_DAYS);
    const thresholdISO = thresholdDate.toISOString();

    console.log(`[Cleanup] Starting vacuum for records deleted before ${thresholdISO}`);

    let schedulesDeleted = 0;
    let expensesDeleted = 0;

    await withTransaction(async () => {
      // Hard delete: schedules (deletedAt이 7일 이전)
      const schedulesToDelete = await getDatabase()
        .select({ id: schedules.id })
        .from(schedules)
        .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdISO)))
        .all();

      if (schedulesToDelete.length > 0) {
        await getDatabase()
          .delete(schedules)
          .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdISO)));
        schedulesDeleted = schedulesToDelete.length;
      }

      // Hard delete: expenses (deletedAt이 7일 이전)
      const expensesToDelete = await getDatabase()
        .select({ id: expenses.id })
        .from(expenses)
        .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdISO)))
        .all();

      if (expensesToDelete.length > 0) {
        await getDatabase()
          .delete(expenses)
          .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdISO)));
        expensesDeleted = expensesToDelete.length;
      }
    });

    const totalDeleted = schedulesDeleted + expensesDeleted;

    if (totalDeleted > 0) {
      console.log(
        `[Cleanup] Completed: ${schedulesDeleted} schedules, ${expensesDeleted} expenses (total: ${totalDeleted})`,
      );
    } else {
      console.log('[Cleanup] No records to vacuum');
    }

    return { schedules: schedulesDeleted, expenses: expensesDeleted };
  } catch (error) {
    console.error('[Cleanup] Failed to vacuum deleted records:', error);
    throw error;
  }
}
