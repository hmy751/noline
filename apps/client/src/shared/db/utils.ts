import { db, trips, schedules, type Trip, type Schedule } from './index';

/**
 * 트랜잭션 헬퍼 함수
 *
 * 데이터 변경과 sync_queue 기록을 원자적으로 처리
 * - 둘 중 하나라도 실패하면 전체 롤백
 * - 데이터 정합성 보장
 *
 * @example
 * ```ts
 * await withTransaction(async () => {
 *   // 1. 데이터 저장
 *   await db.insert(trips).values(newTrip);
 *
 *   // 2. sync_queue 기록
 *   await db.insert(syncQueue).values(queueItem);
 * });
 * ```
 */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    return await callback();
  });
}

/**
 * 현재 타임스탬프 반환 (SQLite 호환)
 * - JavaScript Date를 Unix timestamp로 변환
 */
export function getCurrentTimestamp(): Date {
  return new Date();
}

/**
 * Date를 SQLite timestamp로 변환
 */
export function dateToTimestamp(date: Date | string | null): Date | null {
  if (!date) return null;
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * SQLite timestamp를 ISO string으로 변환
 */
export function timestampToISOString(timestamp: Date | null): string | null {
  if (!timestamp) return null;
  return timestamp.toISOString();
}

// ========================================
// Upsert 헬퍼 함수 (Pull 동기화용)
// ========================================

/**
 * 여행 데이터 Upsert (Pull 동기화용)
 *
 * 서버에서 받은 여행 데이터를 로컬 DB에 반영
 * - 존재하면 업데이트
 * - 없으면 삽입
 * - deletedAt이 있는 레코드도 그대로 저장 (Soft Delete 반영)
 *
 * @param records - 서버에서 받은 여행 데이터 배열
 *
 * @example
 * ```ts
 * const serverTrips = await fetchFromServer();
 * await upsertTrips(serverTrips);
 * ```
 */
export async function upsertTrips(records: Trip[]): Promise<void> {
  if (records.length === 0) {
    console.log('📭 [Upsert] No trips to upsert');
    return;
  }

  console.log(`📥 [Upsert] Upserting ${records.length} trips...`);

  for (const record of records) {
    try {
      await db
        .insert(trips)
        .values(record)
        .onConflictDoUpdate({
          target: trips.id,
          set: {
            userId: record.userId,
            name: record.name,
            destination: record.destination,
            country: record.country,
            latitude: record.latitude,
            longitude: record.longitude,
            cityId: record.cityId,
            startDate: record.startDate,
            endDate: record.endDate,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt, // ✨ Soft Delete 반영
            version: record.version,
            // createdAt은 업데이트 안 함 (불변)
          },
        });
    } catch (error) {
      console.error(`❌ [Upsert] Failed to upsert trip ${record.id}:`, error);
      throw error;
    }
  }

  console.log(`✅ [Upsert] ${records.length} trips upserted successfully`);
}

/**
 * 일정 데이터 Upsert (Pull 동기화용)
 *
 * 서버에서 받은 일정 데이터를 로컬 DB에 반영
 * - 존재하면 업데이트
 * - 없으면 삽입
 * - deletedAt이 있는 레코드도 그대로 저장 (Soft Delete 반영)
 *
 * @param records - 서버에서 받은 일정 데이터 배열
 *
 * @example
 * ```ts
 * const serverSchedules = await fetchFromServer();
 * await upsertSchedules(serverSchedules);
 * ```
 */
export async function upsertSchedules(records: Schedule[]): Promise<void> {
  if (records.length === 0) {
    console.log('📭 [Upsert] No schedules to upsert');
    return;
  }

  console.log(`📥 [Upsert] Upserting ${records.length} schedules...`);

  for (const record of records) {
    try {
      await db
        .insert(schedules)
        .values(record)
        .onConflictDoUpdate({
          target: schedules.id,
          set: {
            userId: record.userId,
            tripId: record.tripId,
            title: record.title,
            location: record.location,
            address: record.address,
            date: record.date,
            time: record.time,
            latitude: record.latitude,
            longitude: record.longitude,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt, // ✨ Soft Delete 반영
            version: record.version,
            // createdAt은 업데이트 안 함 (불변)
          },
        });
    } catch (error) {
      console.error(`❌ [Upsert] Failed to upsert schedule ${record.id}:`, error);
      throw error;
    }
  }

  console.log(`✅ [Upsert] ${records.length} schedules upserted successfully`);
}
