import { useMutation, useQueryClient } from '@tanstack/react-query';
import { and, eq } from 'drizzle-orm';
import type { z } from 'zod';

import { activateTripResponse } from '@repo/schema/responses/trip';

import { expenseQueryKeys } from '@/entities/expense/data/keys';
import { routeQueryKeys } from '@/entities/route/data/keys';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import apiClient from '@/shared/api/fetcher';
import { getDatabase, tripActivations, trips as tripsTable } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { getTripExpiryISO } from '@/shared/lib/lifecycle';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';
import { generateId } from '@/shared/services/id/ulid';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { withTripOperation } from '@/shared/services/offline-prep/trip-operation';
import { reconcileRecordInTransaction } from '@/shared/services/sync/reconcile';
import { AuthRequiredError, requireLocalUserId, requireRemoteSession, useAuthStore } from '@/shared/store/auth';

import { tripQueryKeys } from './keys';

/** 서버 판본을 반영한 사본과 활성 상태를 함께 저장한다. 지도와 경로 다운로드는 성공 반환 후에도 진행될 수 있다. */
export const useActivateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) =>
      withTripOperation(tripId, async () => {
        requireRemoteSession();
        const sessionId = useAuthStore.getState().sessionId;
        const requestingUserId = requireLocalUserId();

        const existingActivation = getDatabase()
          .select()
          .from(tripActivations)
          .where(and(eq(tripActivations.tripId, tripId), eq(tripActivations.userId, requestingUserId)))
          .get();

        const existingTrip = getDatabase()
          .select()
          .from(tripsTable)
          .where(and(eq(tripsTable.id, tripId), eq(tripsTable.userId, requestingUserId)))
          .get();

        if (existingActivation?.isActivated && existingTrip?.deletedAt) {
          throw new Error('삭제된 여행은 활성화할 수 없습니다');
        }

        if (existingActivation?.isActivated && existingTrip) {
          downloadRoutesForSchedules({ tripId }).catch((error) => {
            console.error('[TripActivation] Route download failed for already activated trip:', error);
          });

          return { tripId, alreadyActivated: true };
        }

        const response = await apiClient.post(`/api/trips/${tripId}/activate`);

        const { data } = activateTripResponse.parse(response);

        if (!data.trips.some((trip) => trip.id === tripId)) {
          throw new Error(`Trip not found in server response: ${tripId}`);
        }

        const activation = await applyActivationResponse(tripId, data, requestingUserId, sessionId);

        if (!activation) {
          throw new Error('삭제된 여행은 활성화할 수 없습니다');
        }

        downloadOfflineMapInBackground(tripId).catch((error) => {
          console.error('[TripActivation] Background map download failed:', error);
        });

        downloadRoutesForSchedules({ tripId }).catch((error) => {
          console.error('[TripActivation] Background route download failed:', error);
        });

        return activation;
      }),
    onSuccess: async (activation) => {
      await cancelAndInvalidateQueries(queryClient, { queryKey: tripQueryKeys.base });

      if (!activation.alreadyActivated) {
        // Remote에서 시작한 최초 조회도 Local 전환 뒤 결과를 덮어쓰지 않게 한다.
        await cancelAndInvalidateQueries(queryClient, { queryKey: scheduleQueryKeys.list(activation.tripId) });
        await cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.byTrip(activation.tripId) });
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.byTrip(activation.tripId) });
      }
    },
    onError: (error) => {
      console.error('[TripActivation] Failed to activate trip:', error);
    },
  });
};

const applyActivationResponse = (
  tripId: string,
  { trips: allTrips, schedules, expenses }: z.infer<typeof activateTripResponse>['data'],
  requestingUserId: string,
  sessionId: ReturnType<typeof useAuthStore.getState>['sessionId'],
) =>
  withTransaction(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }

    const userId = requireLocalUserId();

    if (userId !== requestingUserId) {
      throw new AuthRequiredError();
    }

    if ([...allTrips, ...schedules, ...expenses].some((row) => row.userId !== userId)) {
      throw new Error('다른 계정의 여행 데이터는 활성화할 수 없습니다');
    }

    if ([...schedules, ...expenses].some((row) => row.tripId !== tripId)) {
      throw new Error('활성화 응답의 여행이 일치하지 않습니다');
    }

    for (const row of allTrips) {
      await reconcileRecordInTransaction('trips', row);
    }

    const currentTrip = await getDatabase()
      .select()
      .from(tripsTable)
      .where(and(eq(tripsTable.id, tripId), eq(tripsTable.userId, userId)))
      .get();

    // 삭제 응답을 받은 뒤 도착한 활성화는 다시 살리지 않는다. 수신한 사실은 rollback하지 않는다.
    if (!currentTrip || currentTrip.deletedAt) {
      if (!useAuthStore.isCurrentSession(sessionId)) {
        throw new AuthRequiredError();
      }

      return null;
    }

    if (!currentTrip.timeZone) {
      throw new Error('여행 도시의 시간대를 확인한 뒤 활성화해주세요.');
    }

    const expiresAt = getTripExpiryISO(currentTrip.endDate, currentTrip.timeZone);
    const now = getCurrentISOString();

    // 기존 활성화 레코드 비활성화 (1-Trip 제한, tripActivations만 사용)
    await getDatabase()
      .update(tripActivations)
      .set({
        isActivated: false,
        deactivatedAt: now,
        updatedAt: now,
      })
      .where(eq(tripActivations.isActivated, true));

    // 재활성화해도 과거 pull은 현재 사본을 바꿀 수 없도록 새 준비 ID를 쓴다.
    const preparation = {
      id: generateId(),
      isActivated: true,
      activatedAt: now,
      deactivatedAt: null,
      expiresAt,
      syncStatus: 'COMPLETED',
      lastSyncAt: now,
      syncProgress: 100,
      dataDownloaded: true,
      updatedAt: now,
    } as const;

    await getDatabase()
      .insert(tripActivations)
      .values({
        ...preparation,
        tripId,
        userId,
        mapDownloaded: false,
        cleanupPending: false,
        createdAt: now,
      })
      .onConflictDoUpdate({ target: tripActivations.tripId, set: preparation });

    for (const row of schedules) {
      await reconcileRecordInTransaction('schedules', row);
    }

    for (const row of expenses) {
      await reconcileRecordInTransaction('expenses', row);
    }

    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }

    return { tripId, alreadyActivated: false };
  });
