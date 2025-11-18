import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips, tripActivations, schedules as schedulesTable, expenses as expensesTable } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import axios from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';
import { ulid } from 'ulid';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { generateId } from '@/shared/services/id/ulid';

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

      // 3. 서버에서 여행 데이터 Pull (모든 Trip + 일정, 경비)
      const response = await axios.post(`/api/trips/${tripId}/activate`);

      const { trips: allTrips = [], schedules = [], expenses = [] } = response.data;

      // 4. 트랜잭션: 로컬 DB 업데이트
      await withTransaction(async () => {
        // 4-1. 모든 Trip 메타데이터 저장 (upsert)
        if (allTrips.length > 0) {
          for (const tripData of allTrips) {
            await db
              .insert(trips)
              .values(tripData)
              .onConflictDoUpdate({
                target: trips.id,
                set: {
                  ...tripData,
                  updatedAt: tripData.updatedAt,
                },
              });
          }
          console.log(`💾 Saved ${allTrips.length} trips to local DB`);
        }

        // 4-2. 기존 활성화된 여행 비활성화 (1-Trip 제한)
        await db
          .update(trips)
          .set({
            activated: false,
            updatedAt: now,
          })
          .where(eq(trips.activated, true));

        // 4-3. 기존 활성화 레코드 비활성화
        await db
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(tripActivations.isActivated, true));

        // 4-4. 현재 여행 활성화
        await db
          .update(trips)
          .set({
            activated: true,
            updatedAt: now,
            version: sql`${trips.version} + 1`,
          })
          .where(eq(trips.id, tripId));

        // 4-5. 활성화 레코드 생성
        const expiresAt = new Date(trip.endDate);
        expiresAt.setDate(expiresAt.getDate() + 7); // 여행 종료 + 7일

        await db.insert(tripActivations).values({
          id: generateId(),
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

        // 4-5. Pull된 데이터 로컬 DB에 저장 (Last-Write-Wins)
        if (schedules.length > 0) {
          for (const schedule of schedules) {
            await db
              .insert(schedulesTable)
              .values(schedule)
              .onConflictDoUpdate({
                target: schedulesTable.id,
                set: {
                  ...schedule,
                  updatedAt: schedule.updatedAt,
                },
              });
          }
          console.log(`💾 Saved ${schedules.length} schedules to local DB`);
        }

        if (expenses.length > 0) {
          for (const expense of expenses) {
            await db
              .insert(expensesTable)
              .values(expense)
              .onConflictDoUpdate({
                target: expensesTable.id,
                set: {
                  ...expense,
                  updatedAt: expense.updatedAt,
                },
              });
          }
          console.log(`💾 Saved ${expenses.length} expenses to local DB`);
        }
      });

      console.log(`✅ Trip activated: ${tripId} (${schedules.length} schedules, ${expenses.length} expenses)`);

      // 백그라운드로 오프라인 지도 다운로드 시작 (비동기, UI 블로킹 방지)
      downloadOfflineMapInBackground(tripId).catch((error) => {
        console.error('❌ Background map download failed:', error);
      });

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
