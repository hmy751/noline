import { requireLocalUserId, requireRemoteSession } from '@/shared/store/auth';
// Trip Local DataSource - SQLite 로컬 DB 작업

import { getDatabase, trips } from '@/shared/db';
import { eq, isNull, desc, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { selectLocalUserId, useAuthStore } from '@/shared/store/auth';
import { ownedRow, activeTripScope, assertActiveLocalTrip } from '@/shared/services/auth/local-access';
import type { Trip, CreateTripRequest, UpdateTripRequest } from '../model';

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

/**
 * 로컬 DB에 여행 생성 + sync_queue 기록
 * - Client-Side ID: 외부에서 전달받은 ID 사용
 */
export const createTripLocal = async (data: CreateTripRequest): Promise<Trip> => {
  requireRemoteSession();
  const id = data.id;
  const now = getCurrentISOString();
  const userId = requireLocalUserId(data.userId);

  const newTrip = {
    id,
    userId,
    name: data.name,
    destination: data.destination,
    country: data.country || null,
    baseCurrency: data.baseCurrency || 'USD',
    latitude: data.latitude?.toString() || null,
    longitude: data.longitude?.toString() || null,
    cityId: data.cityId || null,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  };

  await withTransaction(async () => {
    await getDatabase()
      .insert(trips)
      .values(newTrip as typeof trips.$inferInsert);
    await addToSyncQueue('trips', id, 'CREATE', {
      id,
      userId,
      name: data.name,
      destination: data.destination,
      country: data.country,
      baseCurrency: data.baseCurrency,
      latitude: data.latitude,
      longitude: data.longitude,
      cityId: data.cityId,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  });

  console.log(`[TripLocal] Trip created locally: ${id} - ${data.name}`);
  return newTrip;
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
