import { scheduleEntity } from '@repo/schema/entities/schedule';
import { requireLocalUserId } from '@/shared/store/auth';
// Schedule Local DataSource - SQLite 로컬 DB 작업

import { getDatabase, schedules } from '@/shared/db';
import { eq, isNull, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { ownedActiveRow, assertActiveLocalTrip } from '@/shared/services/auth/local-access';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../model';

/** 저장 표현을 유지하면서 실제 시각으로 해석 가능한지 앱 반환 경계에서 검사한다. */
function toSchedule(row: typeof schedules.$inferSelect): Schedule {
  return { ...row, scheduledAt: scheduleEntity.shape.scheduledAt.parse(row.scheduledAt) };
}

/**
 * 로컬 DB에서 여행의 일정 목록 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - scheduledAt 기준 오름차순 정렬
 */
export const getSchedulesLocal = async (tripId: string): Promise<Schedule[]> => {
  const scheduleList = await getDatabase()
    .select()
    .from(schedules)
    .where(ownedActiveRow(schedules, isNull(schedules.deletedAt), eq(schedules.tripId, tripId)))
    .all();

  console.log(`[ScheduleLocal] Schedules loaded from local DB: ${scheduleList.length} items`);
  // SQLite TEXT 순서는 timezone offset이 다른 시각의 실제 순서와 다르다.
  return scheduleList.map(toSchedule).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
};

/**
 * 로컬 DB에서 특정 일정 조회
 */
const getScheduleRowById = async (id: string) => {
  const schedule = await getDatabase()
    .select()
    .from(schedules)
    .where(ownedActiveRow(schedules, isNull(schedules.deletedAt), eq(schedules.id, id)))
    .get();

  if (schedule) {
    console.log(`[ScheduleLocal] Schedule loaded from local DB: ${schedule.id}`);
  }
  return schedule;
};

export const getScheduleByIdLocal = async (id: string): Promise<Schedule | undefined> => {
  const row = await getScheduleRowById(id);
  return row ? toSchedule(row) : undefined;
};

/**
 * 로컬 DB에서 여행의 일정 개수 조회
 */
export const getScheduleCountLocal = async (tripId: string): Promise<number> => {
  const result = await getDatabase()
    .select()
    .from(schedules)
    .where(ownedActiveRow(schedules, eq(schedules.tripId, tripId), isNull(schedules.deletedAt)))
    .all();

  return result.length;
};

/**
 * 로컬 DB에 일정 생성 + sync_queue 기록
 * - Client-Side ID: 외부에서 전달받은 ID 사용
 * - latitude/longitude: number → string 변환
 */
export const createScheduleLocal = async (data: CreateScheduleRequest): Promise<Schedule> => {
  const { id, ...rest } = data;
  const now = getCurrentISOString();
  const userId = requireLocalUserId(rest.userId);

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

  return await withTransaction(async () => {
    await assertActiveLocalTrip(data.tripId);
    await getDatabase()
      .insert(schedules)
      .values(newSchedule as typeof schedules.$inferInsert);
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
    return toSchedule(newSchedule);
  });
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

  return await withTransaction(async () => {
    if (!(await getScheduleRowById(id))) {
      throw new Error('수정할 일정을 찾을 수 없습니다');
    }
    await getDatabase()
      .update(schedules)
      .set(dbData)
      .where(ownedActiveRow(schedules, eq(schedules.id, id)));
    await addToSyncQueue('schedules', id, 'UPDATE', data);
    const updated = await getScheduleRowById(id);
    if (!updated) throw new Error('수정한 일정을 다시 불러오지 못했습니다');
    return toSchedule(updated);
  });
};

/**
 * 로컬 DB에서 일정 삭제 (Soft Delete) + sync_queue 기록
 *
 * payload에 tripId를 포함시키면 cleanup-job이 비활성화 전에 자식 entity의
 * pending DELETE를 정확히 식별할 수 있다. 서버는 DELETE body를 사용하지 않으므로
 * 동기화 동작에는 영향이 없다.
 */
export const deleteScheduleLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  const existing = await getDatabase()
    .select({ tripId: schedules.tripId })
    .from(schedules)
    .where(ownedActiveRow(schedules, eq(schedules.id, id)))
    .get();
  const tripId = existing?.tripId ?? null;

  await withTransaction(async () => {
    if (!(await getScheduleRowById(id))) {
      throw new Error('삭제할 일정을 찾을 수 없습니다');
    }
    await getDatabase()
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(ownedActiveRow(schedules, eq(schedules.id, id)));

    await addToSyncQueue('schedules', id, 'DELETE', { tripId });
  });

  console.log(`[ScheduleLocal] Schedule deleted locally (soft): ${id}`);
  return { id, deletedAt: now };
};
