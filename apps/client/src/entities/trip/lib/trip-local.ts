import { requireLocalUserId } from '@/shared/store/auth';
// Trip Local DataSource - SQLite 로컬 DB 작업

import { getDatabase, trips, schedules, expenses, syncQueue } from '@/shared/db';
import { eq, isNull, desc, sql, or, and, inArray } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { AuthRequiredError, selectLocalUserId, useAuthStore } from '@/shared/store/auth';
import { ownedRow, activeTripScope, assertActiveLocalTrip } from '@/shared/services/auth/local-access';
import type { Trip, UpdateTripRequest } from '../model';

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
  return tripList;
};

/**
 * 로컬 DB에서 특정 여행 조회
 */
export const getTripByIdLocal = async (id: string): Promise<Trip | undefined> => {
  return await getDatabase()
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
};

/** 활성 여행과 전송 대기·진행·실패 작업의 부모 여행은 서버 목록으로 덮지 않는다. */
function protectedTripScope() {
  const db = getDatabase();
  return or(
    activeTripScope(trips.id),
    inArray(trips.id, db.select({ id: syncQueue.recordId }).from(syncQueue).where(eq(syncQueue.tableName, 'trips'))),
    inArray(
      trips.id,
      db
        .select({ id: schedules.tripId })
        .from(schedules)
        .innerJoin(syncQueue, and(eq(syncQueue.tableName, 'schedules'), eq(syncQueue.recordId, schedules.id))),
    ),
    inArray(
      trips.id,
      db
        .select({ id: expenses.tripId })
        .from(expenses)
        .innerJoin(syncQueue, and(eq(syncQueue.tableName, 'expenses'), eq(syncQueue.recordId, expenses.id))),
    ),
  );
}

/** 서버의 전체 목록을 반영하고 로컬이 책임지는 여행을 보존한다. sync_queue는 변경하지 않는다. */
export const refreshTripListLocal = async (serverTrips: Trip[], sessionId: symbol | null, signal?: AbortSignal) => {
  return await withTransaction(async () => {
    if (!useAuthStore.isCurrentSession(sessionId)) throw new AuthRequiredError();
    if (signal?.aborted) throw new Error('취소된 여행 목록 조회입니다');

    const userId = requireLocalUserId();

    if (serverTrips.some((trip) => trip.userId !== userId)) throw new Error('다른 계정의 여행 목록입니다');

    const localTrips = await getDatabase().select().from(trips).where(ownedRow(trips.userId)).all();
    const protectedTrips = await getDatabase()
      .select()
      .from(trips)
      .where(ownedRow(trips.userId, protectedTripScope()))
      .all();
    const protectedIds = new Set(protectedTrips.map((trip) => trip.id));
    const serverIds = new Set(serverTrips.map((trip) => trip.id));

    for (const trip of serverTrips) {
      if (protectedIds.has(trip.id)) continue;

      const record = { ...trip, userId, deletedAt: trip.deletedAt ?? null, version: trip.version ?? 1 };

      await getDatabase()
        .insert(trips)
        .values(record)
        .onConflictDoUpdate({
          target: trips.id,
          set: record,
          setWhere: ownedRow(trips.userId),
        });
    }
    // 서버에서 사라진 비활성 사본을 숨긴다. 미전송 삭제를 포함한 로컬 원본은 보존한다.
    const now = getCurrentISOString();

    for (const trip of localTrips) {
      if (!serverIds.has(trip.id) && !protectedIds.has(trip.id) && trip.deletedAt === null) {
        await getDatabase()
          .update(trips)
          .set({ deletedAt: now, updatedAt: now })
          .where(ownedRow(trips.userId, eq(trips.id, trip.id)));
      }
    }

    if (!useAuthStore.isCurrentSession(sessionId)) throw new AuthRequiredError();
    if (signal?.aborted) throw new Error('취소된 여행 목록 조회입니다');

    return { trips: await getTripsLocal(), hasLocalTrips: protectedTrips.length > 0 };
  });
};

/**
 * 로컬 DB에서 여행 수정 + sync_queue 기록
 * - latitude/longitude: number → string 변환
 */
export const updateTripLocal = async (id: string, data: UpdateTripRequest): Promise<Trip> => {
  const now = getCurrentISOString();

  const dbData = {
    ...data,
    latitude: data.latitude?.toString() ?? null,
    longitude: data.longitude?.toString() ?? null,
    updatedAt: now,
    version: sql`${trips.version} + 1`,
  };

  await withTransaction(async () => {
    await assertActiveLocalTrip(id);
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
  });

  console.log(`[TripLocal] Trip updated locally: ${id}`);

  const updated = await getDatabase()
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
  if (!updated) {
    throw new Error('수정한 여행을 다시 불러오지 못했습니다');
  }
  return updated;
};

/**
 * 로컬 DB에서 여행 삭제 (Soft Delete) + sync_queue 기록
 */
export const deleteTripLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await assertActiveLocalTrip(id);
    await getDatabase()
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
      );

    await addToSyncQueue('trips', id, 'DELETE', null);
  });

  console.log(`[TripLocal] Trip deleted locally (soft): ${id}`);
  return { id, deletedAt: now };
};
