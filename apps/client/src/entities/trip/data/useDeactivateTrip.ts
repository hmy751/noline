import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import apiClient from '@/shared/api/fetcher';
import { getDatabase, trips, tripActivations } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';
import { clearTripCopiesInTransaction } from '@/shared/services/sync/cleanup-job';
import { hasUnresolvedTripChangesInTransaction } from '@/shared/services/sync/queue';

import { tripQueryKeys } from './keys';

/** 미전송 입력이 있으면 사본 정리를 예약한다. 지도 정리·서버 알림 실패 뒤에도 기기 비활성화는 유지된다. */
export const useDeactivateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, cleanupData = false }: { tripId: string; cleanupData?: boolean }) => {
      const now = getCurrentISOString();

      const trip = await getDatabase().select().from(trips).where(eq(trips.id, tripId)).get();

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      const existingActivation = await getDatabase()
        .select()
        .from(tripActivations)
        .where(eq(tripActivations.tripId, tripId))
        .get();

      if (!existingActivation?.isActivated) {
        return { tripId, alreadyDeactivated: true };
      }

      const cleanupExecuted = await withTransaction(async () => {
        const hasPendingTasks = await hasUnresolvedTripChangesInTransaction(tripId);
        const shouldDeferCleanup = cleanupData && hasPendingTasks;
        const shouldClearCopies = cleanupData && !hasPendingTasks;

        await getDatabase()
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            cleanupPending: shouldDeferCleanup,
            updatedAt: now,
          })
          .where(eq(tripActivations.tripId, tripId));

        if (shouldClearCopies) {
          await clearTripCopiesInTransaction(tripId, now);
        }

        return shouldClearCopies;
      });

      if (cleanupExecuted) {
        try {
          await cleanupOfflineMapForTrip(tripId);
        } catch (error) {
          console.error(`[TripActivation] Failed to cleanup offline map (ignored):`, error);
        }
      }

      try {
        await apiClient.post(`/api/trips/${tripId}/deactivate`);
      } catch (error) {
        console.warn(`[TripActivation] Failed to notify deactivation to server (ignored):`, error);
      }

      return {
        tripId,
        alreadyDeactivated: false,
      };
    },
    onSuccess: async (deactivation) => {
      await cancelAndInvalidateQueries(queryClient, { queryKey: tripQueryKeys.base });

      if (!deactivation.alreadyDeactivated) {
        // Local에서 시작한 조회 결과 대신 전환 뒤 Router가 선택한 데이터를 읽는다.
        await cancelAndInvalidateQueries(queryClient, { queryKey: scheduleQueryKeys.base });
        await cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.base });
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.base });
      }
    },
    onError: (error) => {
      console.error('[TripActivation] Failed to deactivate trip:', error);
    },
  });
};
