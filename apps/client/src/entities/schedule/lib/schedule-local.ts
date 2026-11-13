import { eq, isNull, sql } from 'drizzle-orm';

import { scheduleEntity } from '@repo/schema/entities/schedule';
import { deleteQueuePayloadSchema } from '@repo/schema/sync/sync-queue';

import { getDatabase, schedules } from '@/shared/db';
import { getCurrentISOString, withTransaction } from '@/shared/db/utils';
import { assertActiveLocalTrip, ownedActiveRow } from '@/shared/services/auth/local-access';
import { editedMarks } from '@/shared/lib/edit-fields';
import type { PreparedEdit } from '@/shared/services/edit-stamp';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { requireLocalUserId } from '@/shared/store/auth';

import type { CreateScheduleRequest, Schedule, UpdateScheduleRequest } from '../model';

/** 저장 표현을 유지하면서 실제 시각으로 해석 가능한지 앱 반환 경계에서 검사한다. */
const toSchedule = (row: typeof schedules.$inferSelect): Schedule => {
  return { ...row, scheduledAt: scheduleEntity.shape.scheduledAt.parse(row.scheduledAt) };
};

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
    fieldEdits: {},
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

    await getDatabase().insert(schedules).values(newSchedule);
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
export const updateScheduleLocal = async (
  id: string,
  request: PreparedEdit<UpdateScheduleRequest>,
): Promise<Schedule> => {
  const now = getCurrentISOString();

  return await withTransaction(async () => {
    const current = await getScheduleRowById(id);

    if (!current) {
      throw new Error('수정할 일정을 찾을 수 없습니다');
    }

    const { latitude, longitude, edit, ...fields } = request;
    const localChanges = {
      ...fields,
      ...(latitude !== undefined && { latitude: latitude?.toString() ?? null }),
      ...(longitude !== undefined && { longitude: longitude?.toString() ?? null }),
      fieldEdits: editedMarks('schedules', request, edit, current.fieldEdits),
      updatedAt: now,
      version: sql`${schedules.version} + 1`,
    };

    const updated = await getDatabase()
      .update(schedules)
      .set(localChanges)
      .where(ownedActiveRow(schedules, eq(schedules.id, id)))
      .returning()
      .get();

    if (!updated) {
      throw new Error('수정한 일정을 찾을 수 없습니다');
    }

    await addToSyncQueue('schedules', id, 'UPDATE', request);

    // 결과를 앱 계약으로 읽는 데 실패하면 행 변경과 큐 기록도 함께 롤백한다.
    return toSchedule(updated);
  });
};

/**
 * 로컬 DB에서 일정 삭제 (Soft Delete) + sync_queue 기록
 *
 * 실제 삭제 행의 계정·여행을 큐에 보존한다. 서버는 DELETE body를 사용하지 않는다.
 */
export const deleteScheduleLocal = async (id: string): Promise<{ id: string; deletedAt: string }> => {
  const now = getCurrentISOString();

  await withTransaction(async () => {
    const deleted = await getDatabase()
      .update(schedules)
      .set({
        deletedAt: now,
        updatedAt: now,
        version: sql`${schedules.version} + 1`,
      })
      .where(ownedActiveRow(schedules, eq(schedules.id, id), isNull(schedules.deletedAt)))
      .returning({ userId: schedules.userId, tripId: schedules.tripId })
      .get();

    if (!deleted) {
      throw new Error('삭제할 일정을 찾을 수 없습니다');
    }

    const payload = deleteQueuePayloadSchema.parse({ userId: deleted.userId, ownerVersion: 1, tripId: deleted.tripId });

    await addToSyncQueue('schedules', id, 'DELETE', payload);
  });

  return { id, deletedAt: now };
};
