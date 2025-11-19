import { db, tripActivations, schedules, expenses } from '@/shared/db';
import { eq, sql, and, isNotNull, lt } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { hasPendingTasksForTrip } from './queue';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';

/**
 * Vacuum 설정
 * Soft delete된 레코드를 완전히 삭제(Hard delete)하기까지의 기간
 */
const VACUUM_THRESHOLD_DAYS = 7; // 7일

/**
 * Background Cleanup Job
 *
 * - cleanupPending = true인 여행 조회
 * - sync_queue에 PENDING 작업이 남아있는지 확인
 * - 모두 동기화 완료되면 Soft delete 실행
 * - 오프라인 지도 삭제
 * - cleanupPending = false로 업데이트
 *
 * 실행 시점:
 * 1. 앱 시작 시 (미완료 cleanup 재시도)
 * 2. Background sync 완료 후 (pushChanges 성공 후)
 */

/**
 * 지연된 cleanup 작업 처리
 *
 * cleanupPending = true인 여행을 찾아서
 * sync_queue가 비어있으면 실제 cleanup 실행
 *
 * @returns 처리된 여행 수
 */
export async function processPendingCleanups(): Promise<number> {
  try {
    // 1. cleanupPending = true인 여행 조회
    const pendingCleanups = await db
      .select()
      .from(tripActivations)
      .where(eq(tripActivations.cleanupPending, true))
      .all();

    if (pendingCleanups.length === 0) {
      console.log('✅ No pending cleanups');
      return 0;
    }

    console.log(`🔄 Processing ${pendingCleanups.length} pending cleanups...`);

    let processedCount = 0;

    // 2. 각 여행에 대해 cleanup 시도
    for (const activation of pendingCleanups) {
      try {
        await processCleanupForTrip(activation.tripId);
        processedCount++;
      } catch (error) {
        console.error(`❌ Failed to process cleanup for trip ${activation.tripId}:`, error);
        // 개별 여행 cleanup 실패해도 다음 여행 계속 처리
      }
    }

    console.log(`✅ Processed ${processedCount}/${pendingCleanups.length} cleanups`);

    // 3. Cleanup 완료 후 Vacuum 실행 (7일 이상 지난 Soft delete 레코드 Hard delete)
    try {
      const vacuumResult = await vacuumDeletedRecords();
      const totalVacuumed = vacuumResult.schedules + vacuumResult.expenses;
      if (totalVacuumed > 0) {
        console.log(`✅ Vacuumed ${totalVacuumed} old deleted records`);
      }
    } catch (error) {
      console.error('⚠️ Failed to vacuum deleted records (ignored):', error);
      // Vacuum 실패해도 cleanup은 성공으로 처리
    }

    return processedCount;
  } catch (error) {
    console.error('❌ Failed to process pending cleanups:', error);
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

  // 1. sync_queue에 PENDING 작업이 있는지 확인
  const hasPending = await hasPendingTasksForTrip(tripId);

  if (hasPending) {
    console.log(`⏳ Trip ${tripId} still has pending sync tasks - skipping cleanup`);
    return;
  }

  // 2. 모든 작업이 동기화 완료됨 → Soft delete 실행
  console.log(`🗑️ All sync tasks completed for trip ${tripId} - executing cleanup`);

  await withTransaction(async () => {
    // 2-1. Soft delete: schedules
    await db
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(eq(schedules.tripId, tripId));

    // 2-2. Soft delete: expenses
    await db
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.tripId, tripId));

    // 2-3. cleanupPending 플래그 제거
    await db
      .update(tripActivations)
      .set({
        cleanupPending: false,
        updatedAt: now,
      })
      .where(eq(tripActivations.tripId, tripId));

    console.log(`✅ Local data soft-deleted for trip: ${tripId}`);
  });

  // 3. 오프라인 지도 삭제 (트랜잭션 외부)
  try {
    await cleanupOfflineMapForTrip(tripId);
    console.log(`✅ Offline map cleaned up for trip: ${tripId}`);
  } catch (error) {
    console.error(`⚠️ Failed to cleanup offline map for trip ${tripId} (ignored):`, error);
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

  console.warn(`⚠️ Force cleanup for trip: ${tripId} (sync_queue ignored)`);

  await withTransaction(async () => {
    // Soft delete: schedules
    await db
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(eq(schedules.tripId, tripId));

    // Soft delete: expenses
    await db
      .update(expenses)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${expenses.version} + 1`,
      })
      .where(eq(expenses.tripId, tripId));

    // cleanupPending 플래그 제거
    await db
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
    console.error(`⚠️ Failed to cleanup offline map (ignored):`, error);
  }

  console.log(`✅ Force cleanup completed for trip: ${tripId}`);
}

/**
 * Vacuum: Soft delete된 레코드를 완전히 삭제 (Hard delete)
 *
 * deletedAt이 설정된 지 VACUUM_THRESHOLD_DAYS(7일) 지난 레코드를
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
    thresholdDate.setDate(thresholdDate.getDate() - VACUUM_THRESHOLD_DAYS);
    const thresholdISO = thresholdDate.toISOString();

    console.log(`🧹 [Vacuum] Starting vacuum for records deleted before ${thresholdISO}`);

    let schedulesDeleted = 0;
    let expensesDeleted = 0;

    await withTransaction(async () => {
      // 1. Hard delete: schedules (deletedAt이 7일 이전)
      const schedulesToDelete = await db
        .select({ id: schedules.id })
        .from(schedules)
        .where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdISO)))
        .all();

      if (schedulesToDelete.length > 0) {
        await db.delete(schedules).where(and(isNotNull(schedules.deletedAt), lt(schedules.deletedAt, thresholdISO)));
        schedulesDeleted = schedulesToDelete.length;
      }

      // 2. Hard delete: expenses (deletedAt이 7일 이전)
      const expensesToDelete = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdISO)))
        .all();

      if (expensesToDelete.length > 0) {
        await db.delete(expenses).where(and(isNotNull(expenses.deletedAt), lt(expenses.deletedAt, thresholdISO)));
        expensesDeleted = expensesToDelete.length;
      }
    });

    const totalDeleted = schedulesDeleted + expensesDeleted;

    if (totalDeleted > 0) {
      console.log(
        `✅ [Vacuum] Completed: ${schedulesDeleted} schedules, ${expensesDeleted} expenses (total: ${totalDeleted})`,
      );
    } else {
      console.log('✅ [Vacuum] No records to vacuum');
    }

    return { schedules: schedulesDeleted, expenses: expensesDeleted };
  } catch (error) {
    console.error('❌ [Vacuum] Failed to vacuum deleted records:', error);
    throw error;
  }
}
