import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips, tripActivations, schedules, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import axios from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';
import { cleanupOfflineMapForTrip } from '@/shared/services/offline-map';

/**
 * 여행 비활성화 Mutation Hook
 *
 * - trips.activated = false 설정
 * - tripActivations 레코드 업데이트
 * - 로컬 데이터 정리 (선택적 - cleanupData 파라미터)
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

      // 2. 이미 비활성화된 경우 스킵
      if (!trip.activated) {
        console.log(`✅ Trip already deactivated: ${tripId}`);
        return { tripId, alreadyDeactivated: true };
      }

      // 3. 트랜잭션: 로컬 DB 업데이트
      await withTransaction(async () => {
        // 3-1. 여행 비활성화
        await db
          .update(trips)
          .set({
            activated: false,
            updatedAt: now,
            version: sql`${trips.version} + 1`,
          })
          .where(eq(trips.id, tripId));

        // 3-2. 활성화 레코드 업데이트
        await db
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            cleanupPending: cleanupData,
            updatedAt: now,
          })
          .where(eq(tripActivations.tripId, tripId));

        // 3-3. 데이터 정리 (선택적)
        if (cleanupData) {
          // 여행의 일정 삭제
          await db.delete(schedules).where(eq(schedules.tripId, tripId));

          // 여행의 경비 삭제
          await db.delete(expenses).where(eq(expenses.tripId, tripId));

          console.log(`🗑️ Local data cleaned up for trip: ${tripId}`);
        }
      });

      // 3-4. 오프라인 지도 정리 (선택적, 트랜잭션 외부에서 실행)
      if (cleanupData) {
        try {
          await cleanupOfflineMapForTrip(tripId);
        } catch (error) {
          console.error(`⚠️ Failed to cleanup offline map (ignored):`, error);
          // 지도 정리 실패해도 비활성화는 성공으로 처리
        }
      }

      // 4. 서버에 비활성화 알림 (선택적, 실패해도 무시)
      try {
        await axios.post(`/api/trips/${tripId}/deactivate`);
        console.log(`📤 Deactivation notified to server: ${tripId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to notify deactivation to server (ignored):`, error);
      }

      console.log(`✅ Trip deactivated: ${tripId} (cleanup: ${cleanupData})`);

      return { tripId, alreadyDeactivated: false, cleanupData };
    },
    onSuccess: (data) => {
      // 캐시 무효화 - 여행 목록 및 활성화 상태 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.base,
      });

      if (!data.alreadyDeactivated) {
        console.log(`✅ Trip deactivation completed: ${data.tripId}`);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to deactivate trip:', error);
    },
  });
};
