// ========================================
// Schedule Local DataSource - SQLite 로컬 DB 작업
// ========================================

import { db, schedules } from '@/shared/db';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../model';

/**
 * 로컬 DB에서 여행의 일정 목록 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - scheduledAt 기준 오름차순 정렬
 */
export const getSchedulesLocal = async (tripId: string): Promise<Schedule[]> => {
  const scheduleList = await db
    .select()
    .from(schedules)
    .where(and(isNull(schedules.deletedAt), eq(schedules.tripId, tripId)))
    .orderBy(schedules.scheduledAt)
    .all();

  console.log(`📋 Schedules loaded from local DB: ${scheduleList.length} items`);
  return scheduleList;
};

/**
 * 로컬 DB에서 특정 일정 조회
 */
export const getScheduleByIdLocal = async (id: string): Promise<Schedule | undefined> => {
  const schedule = await db
    .select()
    .from(schedules)
    .where(and(isNull(schedules.deletedAt), eq(schedules.id, id)))
    .get();

  if (schedule) {
    console.log(`📋 Schedule loaded from local DB: ${schedule.id}`);
  }
  return schedule;
};

/**
 * 로컬 DB에서 여행의 일정 개수 조회
 */
export const getScheduleCountLocal = async (tripId: string): Promise<number> => {
  const result = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.tripId, tripId), isNull(schedules.deletedAt)))
    .all();

  return result.length;
};

/**
 * 로컬 DB에 일정 생성 + sync_queue 기록
 * - Echo Protocol: 외부에서 전달받은 ID 사용
 * - latitude/longitude: number → string 변환
 */
export const createScheduleLocal = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const { id, ...rest } = data;
  const now = getCurrentISOString();
  const userId = rest.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

  const newSchedule = {
    id,
    userId,
    tripId: rest.tripId,
    title: rest.title,
    location: rest.location,
    address: rest.address || null,
    scheduledAt: rest.scheduledAt,
    latitude: rest.latitude?.toString() || null,
    longitude: rest.longitude?.toString() || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  };

  await withTransaction(async () => {
    await db.insert(schedules).values(newSchedule as typeof schedules.$inferInsert);
    await addToSyncQueue('schedules', id, 'CREATE', {
      id,
      userId,
      tripId: rest.tripId,
      title: rest.title,
      location: rest.location,
      address: rest.address,
      scheduledAt: rest.scheduledAt,
      latitude: rest.latitude,
      longitude: rest.longitude,
    });
  });

  console.log(`✅ Schedule created locally: ${id} - ${rest.title}`);
  return newSchedule;
};

/**
 * 로컬 DB에서 일정 수정 + sync_queue 기록
 * - latitude/longitude: number → string 변환
 */
export const updateScheduleLocal = async (id: string, data: UpdateScheduleRequest): Promise<Schedule> => {
  const now = getCurrentISOString();

  const { latitude, longitude, ...rest } = data;
  const dbData = {
    ...rest,
    ...(latitude !== undefined && { latitude: latitude?.toString() ?? null }),
    ...(longitude !== undefined && { longitude: longitude?.toString() ?? null }),
    updatedAt: now,
    version: sql`${schedules.version} + 1`,
  };

  await withTransaction(async () => {
    await db.update(schedules).set(dbData).where(eq(schedules.id, id));
    await addToSyncQueue('schedules', id, 'UPDATE', data);
  });

  console.log(`✅ Schedule updated locally: ${id}`);

  // 업데이트된 전체 entity 조회하여 반환
  const updated = await db.select().from(schedules).where(eq(schedules.id, id)).get();
  return updated!;
};

/**
 * 로컬 DB에서 일정 삭제 (Soft Delete) + sync_queue 기록
 */
export const deleteScheduleLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    await db
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(eq(schedules.id, id));

    await addToSyncQueue('schedules', id, 'DELETE', null);
  });

  console.log(`✅ Schedule deleted locally (soft): ${id}`);
  return { id, deletedAt: now };
};

/**
 * 로컬 DB에서 일정의 tripId 조회 (라우팅용)
 */
export const getScheduleTripIdLocal = async (id: string): Promise<string | null> => {
  const schedule = await db.select({ tripId: schedules.tripId }).from(schedules).where(eq(schedules.id, id)).get();
  return schedule?.tripId ?? null;
};
