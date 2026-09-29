import { AuthRequiredError, requireRemoteSession, useAuthStore } from '@/shared/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDatabase,
  trips,
  tripActivations,
  schedules as schedulesTable,
  expenses as expensesTable,
} from '@/shared/db';
import { eq } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import apiClient from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';
import { generateId } from '@/shared/services/id/ulid';
import { TRIP_ACTIVATION_GRACE_DAYS } from '@/shared/lib/lifecycle';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import type { Trip } from '../model/types';

/**
 * 여행 활성화 Mutation Hook
 *
 * - 서버에서 모든 Trip 메타데이터 + 선택한 여행의 데이터 Pull (일정, 경비 등)
 * - tripActivations 레코드 생성 (Single Source of Truth)
 * - 동시에 1개 여행만 활성화 가능 (기존 활성화된 여행 자동 비활성화)
 * - 오프라인 지도 다운로드 백그라운드 실행
 *
 */
export const useActivateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      requireRemoteSession();
      const sessionId = useAuthStore.getState().sessionId;
      const now = getCurrentISOString();

      // 이미 활성화된 경우 - 경로만 다운로드하고 종료
      const existingActivation = getDatabase()
        .select()
        .from(tripActivations)
        .where(eq(tripActivations.tripId, tripId))
        .get();

      if (existingActivation?.isActivated) {
        console.log(`[TripActivation] Trip already activated: ${tripId}, checking routes...`);

        // 이미 활성화되어 있어도 경로 다운로드는 시도 (없는 경로만 다운로드됨)
        const localSchedules = getDatabase()
          .select()
          .from(schedulesTable)
          .where(eq(schedulesTable.tripId, tripId))
          .all();
        if (localSchedules.length > 0) {
          downloadRoutesForSchedules({ tripId, schedules: localSchedules }).catch((error) => {
            console.error('[TripActivation] Route download failed for already activated trip:', error);
          });
        }

        return { tripId, alreadyActivated: true };
      }

      // 서버에서 여행 데이터 Pull (모든 Trip + 일정, 경비)
      const response = await apiClient.post(`/api/trips/${tripId}/activate`);

      const { trips: allTrips = [], schedules = [], expenses = [] } = response.data;

      // 활성화하려는 여행 정보 찾기 (서버 응답에서)
      const trip = allTrips.find((t: Trip) => t.id === tripId);

      if (!trip) {
        throw new Error(`Trip not found in server response: ${tripId}`);
      }

      // 트랜잭션: 로컬 DB 업데이트
      await withTransaction(async () => {
        if (!useAuthStore.isCurrentSession(sessionId)) {
          throw new AuthRequiredError();
        }
        const userId = useAuthStore.getState().userId;
        if ([...allTrips, ...schedules, ...expenses].some((row: { userId: string }) => row.userId !== userId)) {
          throw new Error('다른 계정의 여행 데이터는 활성화할 수 없습니다');
        }
        // 모든 Trip 메타데이터 저장 (upsert)
        if (allTrips.length > 0) {
          for (const tripData of allTrips) {
            await getDatabase()
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
          console.log(`[TripActivation] Saved ${allTrips.length} trips to local DB`);
        }

        // 기존 활성화 레코드 비활성화 (1-Trip 제한, tripActivations만 사용)
        await getDatabase()
          .update(tripActivations)
          .set({
            isActivated: false,
            deactivatedAt: now,
            updatedAt: now,
          })
          .where(eq(tripActivations.isActivated, true));

        // 활성화 레코드 생성 또는 업데이트 (upsert)
        const expiresAt = new Date(trip.endDate);
        expiresAt.setDate(expiresAt.getDate() + TRIP_ACTIVATION_GRACE_DAYS);

        await getDatabase()
          .insert(tripActivations)
          .values({
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
          })
          .onConflictDoUpdate({
            target: tripActivations.tripId,
            set: {
              isActivated: true,
              activatedAt: now,
              deactivatedAt: null,
              expiresAt: expiresAt.toISOString(),
              syncStatus: 'COMPLETED',
              lastSyncAt: now,
              syncProgress: 100,
              dataDownloaded: true,
              updatedAt: now,
            },
          });

        // Pull된 데이터 로컬 DB에 저장 (Last-Write-Wins)
        if (schedules.length > 0) {
          for (const schedule of schedules) {
            await getDatabase()
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
          console.log(`[TripActivation] Saved ${schedules.length} schedules to local DB`);
        }

        if (expenses.length > 0) {
          for (const expense of expenses) {
            await getDatabase()
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
          console.log(`[TripActivation] Saved ${expenses.length} expenses to local DB`);
        }
      });

      console.log(
        `[TripActivation] Trip activated: ${tripId} (${schedules.length} schedules, ${expenses.length} expenses)`,
      );

      // 백그라운드로 오프라인 지도 다운로드 시작 (비동기, UI 블로킹 방지)
      downloadOfflineMapInBackground(tripId).catch((error) => {
        console.error('[TripActivation] Background map download failed:', error);
      });

      // 백그라운드로 경로 다운로드 (Mapbox Directions API)
      downloadRoutesForSchedules({ tripId, schedules }).catch((error) => {
        console.error('[TripActivation] Background route download failed:', error);
      });

      return { tripId, alreadyActivated: false, schedules, expenses };
    },
    onSuccess: async (data) => {
      // 캐시 무효화 - 여행 목록 및 활성화 상태 다시 조회
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.base });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.activeTrip() });

      // Pull된 데이터 반영 (Schedule, Expense, Route)
      if (!data.alreadyActivated) {
        // Remote에서 시작한 최초 조회도 Local 전환 뒤 결과를 덮어쓰지 않게 한다.
        await cancelAndInvalidateQueries(queryClient, { queryKey: scheduleQueryKeys.list(data.tripId) });
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.byTrip(data.tripId) });
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.byTrip(data.tripId) });
        console.log(`[TripActivation] Trip activation completed: ${data.tripId}`);
      }
    },
    onError: (error) => {
      console.error('[TripActivation] Failed to activate trip:', error);
    },
  });
};
