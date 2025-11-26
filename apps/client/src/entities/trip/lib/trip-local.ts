// ========================================
// Trip Local DataSource - SQLite 로컬 DB 작업
// ========================================

import { db, trips } from '@/shared/db';
import { eq, isNull, desc, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { Trip, CreateTripRequest, UpdateTripRequest } from '../model';

/**
 * 로컬 DB에서 모든 여행 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - updatedAt 기준 내림차순 정렬
 */
export const getTripsLocal = async (): Promise<Trip[]> => {
  const tripList = await db.select().from(trips).where(isNull(trips.deletedAt)).orderBy(desc(trips.updatedAt)).all();

  console.log(`📋 Trips loaded from local DB: ${tripList.length} items`);
  return tripList;
};

/**
 * 로컬 DB에서 특정 여행 조회
 */
export const getTripByIdLocal = async (id: string): Promise<Trip | undefined> => {
  return await db.select().from(trips).where(eq(trips.id, id)).get();
};

/**
 * 로컬 DB에 여행 생성 + sync_queue 기록
 * - Echo Protocol: 외부에서 전달받은 ID 사용
 */
export const createTripLocal = async (data: CreateTripRequest): Promise<Trip> => {
  const id = data.id;
  const now = getCurrentISOString();
  const userId = data.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

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
    await db.insert(trips).values(newTrip as typeof trips.$inferInsert);
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

  console.log(`✅ Trip created locally: ${id} - ${data.name}`);
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
    await db.update(trips).set(dbData).where(eq(trips.id, id));
    await addToSyncQueue('trips', id, 'UPDATE', data);
  });

  console.log(`✅ Trip updated locally: ${id}`);

  // 업데이트된 전체 entity 조회하여 반환
  const updated = await db.select().from(trips).where(eq(trips.id, id)).get();
  return updated!;
};

/**
 * 로컬 DB에서 여행 삭제 (Soft Delete) + sync_queue 기록
 */
export const deleteTripLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await db
      .update(trips)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${trips.version} + 1`,
      })
      .where(eq(trips.id, id));

    await addToSyncQueue('trips', id, 'DELETE', null);
  });

  console.log(`✅ Trip deleted locally (soft): ${id}`);
  return { id, deletedAt: now };
};
