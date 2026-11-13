import { applyConfirmedDeletionInTransaction } from '@/shared/services/sync/confirmed-deletion';
import { and, desc, eq, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm';

import { tripEntity } from '@repo/schema/entities/trip';
import { isTripDateRangeValid } from '@repo/schema/requests/trip';
import { deleteQueuePayloadSchema } from '@repo/schema/sync/sync-queue';

import { expenses, getDatabase, runDatabaseOperation, schedules, syncQueue, tripActivations, trips } from '@/shared/db';
import { getCurrentISOString, withTransaction } from '@/shared/db/utils';
import { getTripExpiryISO } from '@/shared/lib/lifecycle';
import { activeTripScope, assertActiveLocalTrip, ownedRow } from '@/shared/services/auth/local-access';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { reconcileRecordInTransaction } from '@/shared/services/sync/reconcile';
import { requireLocalUserId } from '@/shared/store/auth';
import { AuthRequiredError, selectLocalUserId, useAuthStore } from '@/shared/store/auth';

import type { DeleteTripResponse, Trip, UpdateTripRequest } from '../model';

/** 시간대 호환만 적용한다. 기존 다른 필드의 오류로 시간대 확인·교정까지 막지 않는다. */
function readTripTimeZone(trip: Trip): Trip {
  return { ...trip, timeZone: tripEntity.shape.timeZone.parse(trip.timeZone) };
}

/**
 * 로컬 DB에서 현재 사용자의 여행 조회
 * - userId 필터링 적용 (계정별 데이터 분리)
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - updatedAt 기준 내림차순 정렬
 */
export const getTripsLocal = async (): Promise<Trip[]> => {
  const userId = selectLocalUserId(useAuthStore.getState());
  if (!userId) {
    console.log('[TripLocal] No authenticated user, returning empty trips');
    return [];
  }

  const tripList = await getDatabase()
    .select()
    .from(trips)
    .where(
      ownedRow(
        trips.userId,
        isNull(trips.deletedAt),
        useAuthStore.getState().status === 'reauth-required' ? activeTripScope(trips.id) : undefined,
      ),
    )
    .orderBy(desc(trips.updatedAt))
    .all();

  console.log(`[TripLocal] Trips loaded from local DB: ${tripList.length} items for user ${userId}`);
  return tripList.map(readTripTimeZone);
};

/**
 * 로컬 DB에서 특정 여행 조회
 */
export const getTripByIdLocal = async (id: string): Promise<Trip | undefined> => {
  const trip = await getDatabase()
    .select()
    .from(trips)
    .where(
      ownedRow(
        trips.userId,
        eq(trips.id, id),
        useAuthStore.getState().status === 'reauth-required' ? activeTripScope(trips.id) : undefined,
      ),
    )
    .get();
  return trip ? readTripTimeZone(trip) : undefined;
};

/** 활성 여행과 전송 대기·진행·실패 작업의 부모 여행은 서버 목록으로 덮지 않는다. */
const protectedTripScope = (): SQL | undefined => {
  const db = getDatabase();

  return or(
    activeTripScope(trips.id),
    inArray(
      trips.id,
      db
        .select({ id: syncQueue.recordId })
        .from(syncQueue)
        .where(and(eq(syncQueue.tableName, 'trips'), ne(syncQueue.status, 'QUARANTINED'))),
    ),
    inArray(
      trips.id,
      db
        .select({ id: schedules.tripId })
        .from(schedules)
        .innerJoin(
          syncQueue,
          and(
            eq(syncQueue.tableName, 'schedules'),
            eq(syncQueue.recordId, schedules.id),
            ne(syncQueue.status, 'QUARANTINED'),
          ),
        ),
    ),
    inArray(
      trips.id,
      db
        .select({ id: expenses.tripId })
        .from(expenses)
        .innerJoin(
          syncQueue,
          and(
            eq(syncQueue.tableName, 'expenses'),
            eq(syncQueue.recordId, expenses.id),
            ne(syncQueue.status, 'QUARANTINED'),
          ),
        ),
    ),
  );
};

/** HTTP 조회를 시작할 때 존재한 사본만 뒤의 누락 판정 대상이다. */
export const captureTripListLocal = async (sessionId: symbol | null): Promise<Trip[]> => {
  return await runDatabaseOperation(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }

    return await getDatabase().select().from(trips).where(ownedRow(trips.userId)).all();
  });
};

/** 서버의 전체 목록을 반영하고 로컬이 책임지는 여행을 보존한다. sync_queue는 변경하지 않는다. */
export const refreshTripListLocal = async (
  serverTrips: Trip[],
  sessionId: symbol | null,
  signal?: AbortSignal,
  requestTrips?: Trip[],
) => {
  return await withTransaction(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }
    if (signal?.aborted) {
      throw new Error('취소된 여행 목록 조회입니다');
    }

    const userId = requireLocalUserId();

    if (serverTrips.some((trip) => trip.userId !== userId)) {
      throw new Error('다른 계정의 여행 목록입니다');
    }

    const rowsAtRequestStart = requestTrips && new Map(requestTrips.map((trip) => [trip.id, JSON.stringify(trip)]));
    const localTrips = await getDatabase().select().from(trips).where(ownedRow(trips.userId)).all();
    const protectedTrips = await getDatabase()
      .select()
      .from(trips)
      .where(ownedRow(trips.userId, protectedTripScope()))
      .all();
    const protectedIds = new Set(protectedTrips.map((trip) => trip.id));
    const serverIds = new Set(serverTrips.map((trip) => trip.id));

    for (const trip of serverTrips) {
      await reconcileRecordInTransaction('trips', { ...trip, userId });
    }

    // 서버에서 사라진 비활성 사본을 숨긴다. 미전송 삭제를 포함한 로컬 원본은 보존한다.
    const now = getCurrentISOString();

    for (const trip of localTrips) {
      const isUnchangedSinceRequest = !rowsAtRequestStart || rowsAtRequestStart.get(trip.id) === JSON.stringify(trip);

      if (!serverIds.has(trip.id) && !protectedIds.has(trip.id) && trip.deletedAt === null && isUnchangedSinceRequest) {
        await getDatabase()
          .update(trips)
          .set({ deletedAt: now, updatedAt: now })
          .where(ownedRow(trips.userId, eq(trips.id, trip.id)));
      }
    }

    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }
    if (signal?.aborted) {
      throw new Error('취소된 여행 목록 조회입니다');
    }

    return { trips: await getTripsLocal(), hasLocalTrips: protectedTrips.length > 0 };
  });
};

/**
 * 로컬 DB에서 여행 수정 + sync_queue 기록
 * - latitude/longitude: number → string 변환
 */
export const updateTripLocal = async (id: string, data: UpdateTripRequest): Promise<Trip> => {
  const now = getCurrentISOString();
  const { latitude, longitude, ...fields } = data;

  const dbData = {
    ...fields,
    ...(latitude !== undefined ? { latitude: latitude?.toString() ?? null } : {}),
    ...(longitude !== undefined ? { longitude: longitude?.toString() ?? null } : {}),
    updatedAt: now,
    version: sql`${trips.version} + 1`,
  };

  const updated = await withTransaction(async () => {
    await assertActiveLocalTrip(id);

    if (data.startDate !== undefined || data.endDate !== undefined || data.timeZone !== undefined) {
      const existing = await getDatabase()
        .select()
        .from(trips)
        .where(ownedRow(trips.userId, eq(trips.id, id)))
        .get();

      if (!existing) throw new Error('수정할 여행을 찾을 수 없습니다');
      if (
        !isTripDateRangeValid(
          data.startDate ?? existing.startDate,
          data.endDate ?? existing.endDate,
          data.timeZone ?? existing.timeZone,
        )
      ) {
        throw new Error('여행 시작일은 종료일보다 늦을 수 없습니다');
      }
    }

    await getDatabase()
      .update(trips)
      .set(dbData)
      .where(
        ownedRow(
          trips.userId,
          eq(trips.id, id),
          useAuthStore.getState().status === 'reauth-required' ? activeTripScope(trips.id) : undefined,
        ),
      );
    await addToSyncQueue('trips', id, 'UPDATE', data);

    const updated = await getDatabase()
      .select()
      .from(trips)
      .where(ownedRow(trips.userId, eq(trips.id, id)))
      .get();

    if (!updated) throw new Error('수정한 여행을 다시 불러오지 못했습니다');
    if (updated.timeZone && (data.endDate !== undefined || data.timeZone !== undefined)) {
      await getDatabase()
        .update(tripActivations)
        .set({ expiresAt: getTripExpiryISO(updated.endDate, updated.timeZone), updatedAt: now })
        .where(ownedRow(tripActivations.userId, eq(tripActivations.tripId, id), eq(tripActivations.isActivated, true)));
    }

    return readTripTimeZone(updated);
  });

  console.log(`[TripLocal] Trip updated locally: ${id}`);

  return updated;
};

/**
 * 로컬 DB에서 여행 삭제 (Soft Delete) + sync_queue 기록
 */
export const deleteTripLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await assertActiveLocalTrip(id);

    const deleted = await getDatabase()
      .update(trips)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${trips.version} + 1`,
      })
      .where(
        ownedRow(
          trips.userId,
          eq(trips.id, id),
          useAuthStore.getState().status === 'reauth-required' ? activeTripScope(trips.id) : undefined,
        ),
      )
      .returning({ userId: trips.userId })
      .get();

    if (!deleted) {
      throw new Error('삭제할 여행을 찾을 수 없습니다');
    }

    const payload = deleteQueuePayloadSchema.parse({ userId: deleted.userId, ownerVersion: 1 });

    await addToSyncQueue('trips', id, 'DELETE', payload);
  });

  console.log(`[TripLocal] Trip deleted locally (soft): ${id}`);
  return { id, deletedAt: now };
};

/** 비활성 여행의 직접 응답도 pull·활성화와 같은 서버 판본 증거를 쓴다. */
export const acceptTripMutationLocal = async (
  server: Trip,
  expectedId: string,
  sessionId: symbol | null,
): Promise<Trip> => {
  const current = await withTransaction(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }
    if (server.id !== expectedId || server.userId !== requireLocalUserId()) {
      throw new Error('여행 응답의 소유자·기록이 일치하지 않습니다');
    }

    await reconcileRecordInTransaction('trips', server);

    return await getDatabase().select().from(trips).where(eq(trips.id, server.id)).get();
  });

  if (!current || current.deletedAt) {
    throw new Error('삭제된 여행입니다');
  }

  return readTripTimeZone(current);
};

export const acceptTripDeletionLocal = async (
  proof: DeleteTripResponse,
  expectedId: string,
  sessionId: symbol | null,
): Promise<void> => {
  await withTransaction(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) {
      throw new AuthRequiredError();
    }
    if (proof.id !== expectedId) {
      throw new Error('삭제 응답의 여행이 일치하지 않습니다');
    }

    await applyConfirmedDeletionInTransaction('trips', expectedId, expectedId, proof.deletedAt);
  });
};
