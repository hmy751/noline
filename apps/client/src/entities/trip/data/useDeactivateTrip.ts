import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips, tripActivations, schedules, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import apiClient from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';
import { hasPendingTasksForTrip, getPendingTasksForTrip } from '@/shared/services/sync/queue';

/**
 * 여행 비활성화 Mutation Hook
 *
 * - tripActivations 레코드 업데이트 (isActivated = false)
 * - sync_queue 체크: PENDING 항목이 있으면 cleanup 지연 (cleanupPending = true)
 * - Soft delete 패턴: 로컬 데이터를 deletedAt으로 마킹 (Hard delete 없음)
 * - Background job에서 cleanup 완료 (sync 완료 후)
 * - 오프라인 지도 삭제
 * - 서버에 비활성화 알림 (선택적)
 *
 * @example
 * ```tsx
 * const { mutate: deactivateTrip, isPending } = useDeactivateTrip();
 * deactivateTrip({ tripId, cleanupData: true });
 * ```
 */
export const useDeactivateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, cleanupData = false }: { tripId: string; cleanupData?: boolean }) => {
      const now = getCurrentISOString();

      // 1. 여행 정보 조회
      const trip = await db.select().from(trips).where(eq(trips.id, tripId)).get();

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // 2. 이미 비활성화된 경우 스킵 (tripActivations 테이블 확인)
      const existingActivation = await db
        .select()
        .from(tripActivations)
        .where(eq(tripActivations.tripId, tripId))
        .get();

      if (!existingActivation?.isActivated) {
        console.log(`✅ Trip already deactivated: ${tripId}`);
        return { tripId, alreadyDeactivated: true };
      }

      // 3. sync_queue 체크: PENDING 작업이 있는지 확인
      const hasPending = await hasPendingTasksForTrip(tripId);

      if (hasPending && cleanupData) {
        const pendingTasks = await getPendingTasksForTrip(tripId);
        console.log(`⏳ Sync queue has ${pendingTasks.length} pending tasks - deferring cleanup`);
      }

      // 4. 트랜잭션: 로컬 DB 업데이트
      let cleanupExecuted = false;

      await withTransaction(async () => {
        // 4-1. 활성화 레코드 업데이트 (tripActivations만 사용)
        await db
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            // PENDING 작업이 있으면 cleanup 지연, 없으면 즉시 실행
            cleanupPending: cleanupData && hasPending,
            updatedAt: now,
          })
          .where(eq(tripActivations.tripId, tripId));

        // 4-2. 데이터 정리 (선택적)
        // PENDING 작업이 없으면 즉시 Soft delete 실행
        if (cleanupData && !hasPending) {
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

          cleanupExecuted = true;
          console.log(`🗑️ Local data soft-deleted for trip: ${tripId}`);
        }
      });

      // 4-3. 오프라인 지도 정리 (선택적, 트랜잭션 외부에서 실행)
      // cleanup이 즉시 실행된 경우에만 지도도 삭제
      if (cleanupData && cleanupExecuted) {
        try {
          await cleanupOfflineMapForTrip(tripId);
        } catch (error) {
          console.error(`⚠️ Failed to cleanup offline map (ignored):`, error);
          // 지도 정리 실패해도 비활성화는 성공으로 처리
        }
      }

      // 5. 서버에 비활성화 알림 (선택적, 실패해도 무시)
      try {
        await apiClient.post(`/api/trips/${tripId}/deactivate`);
        console.log(`📤 Deactivation notified to server: ${tripId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to notify deactivation to server (ignored):`, error);
      }

      console.log(`✅ Trip deactivated: ${tripId} (cleanup: ${cleanupData}, executed: ${cleanupExecuted})`);

      return {
        tripId,
        alreadyDeactivated: false,
        cleanupData,
        cleanupExecuted,
        cleanupPending: cleanupData && hasPending,
      };
    },
    onSuccess: (data) => {
      // 캐시 무효화 - 여행 목록 및 활성화 상태 다시 조회
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.base });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.activeTrip() });

      // 정리된 데이터 반영 (Soft delete된 Schedule, Expense, Route)
      if (!data.alreadyDeactivated) {
        queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.base });
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.base });
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.base });
        console.log(`✅ Trip deactivation completed: ${data.tripId}`);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to deactivate trip:', error);
    },
  });
};
