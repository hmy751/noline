import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips, tripActivations } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import axios from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';
import { ulid } from 'ulid';

/**
 * 여행 활성화 Mutation Hook
 *
 * - 서버에서 여행 데이터 Pull (일정, 경비 등)
 * - trips.activated = true 설정
 * - tripActivations 레코드 생성
 * - 동시에 1개 여행만 활성화 가능 (기존 활성화된 여행 자동 비활성화)
 *
 * @example
 * ```tsx
 * const { mutate: activateTrip, isPending } = useActivateTrip();
 * activateTrip(tripId);
 * ```
 */
export const useActivateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const now = getCurrentISOString();

      // 1. 여행 정보 조회
      const trip = await db.select().from(trips).where(eq(trips.id, tripId)).get();

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      // 2. 이미 활성화된 경우 스킵
      if (trip.activated) {
        console.log(`✅ Trip already activated: ${tripId}`);
        return { tripId, alreadyActivated: true };
      }

      // 3. 서버에서 여행 데이터 Pull (일정, 경비 등)
      const response = await axios.post(`/api/trips/${tripId}/activate`);
      const { schedules = [], expenses = [] } = response.data.data;

      // 4. 트랜잭션: 로컬 DB 업데이트
      await withTransaction(async () => {
        // 4-1. 기존 활성화된 여행 비활성화 (1-Trip 제한)
        await db
          .update(trips)
          .set({
            activated: false,
            updatedAt: now,
          })
          .where(eq(trips.activated, true));

        // 4-2. 기존 활성화 레코드 비활성화
        await db
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(tripActivations.isActivated, true));

        // 4-3. 현재 여행 활성화
        await db
          .update(trips)
          .set({
            activated: true,
            updatedAt: now,
            version: sql`${trips.version} + 1`,
          })
          .where(eq(trips.id, tripId));

        // 4-4. 활성화 레코드 생성
        const expiresAt = new Date(trip.endDate);
        expiresAt.setDate(expiresAt.getDate() + 7); // 여행 종료 + 7일

        await db.insert(tripActivations).values({
          id: ulid(),
          tripId,
          userId: trip.userId,
          isActivated: true,
          activatedAt: now,
          deactivatedAt: null,
          expiresAt: expiresAt.toISOString(),
          syncStatus: 'COMPLETED',
          lastSyncAt: now,
          syncProgress: 100,
          dataDownloaded: true,
          mapDownloaded: false, // 지도는 별도 다운로드
          cleanupPending: false,
          createdAt: now,
          updatedAt: now,
        });

        // TODO: 4-5. Pull된 데이터 로컬 DB에 저장
        // - schedules 데이터 저장
        // - expenses 데이터 저장
        // - 기존 데이터와 충돌 해결 (Last-Write-Wins)
      });

      console.log(`✅ Trip activated: ${tripId} (${schedules.length} schedules, ${expenses.length} expenses)`);

      return { tripId, alreadyActivated: false, schedules, expenses };
    },
    onSuccess: (data) => {
      // 캐시 무효화 - 여행 목록 및 활성화 상태 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.base,
      });

      if (!data.alreadyActivated) {
        console.log(`✅ Trip activation completed: ${data.tripId}`);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to activate trip:', error);
    },
  });
};
