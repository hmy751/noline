import { db, trips, schedules, expenses, type Trip, type Schedule, type Expense } from './index';

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
  return db.transaction(async (_tx) => {
    return await callback();
  });
}

/**
 * 현재 시간을 ISO string으로 반환
 * - SQLite TEXT 필드에 저장
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Date를 ISO string으로 변환
 */
export function dateToISOString(date: Date | string | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date; // 이미 ISO string
  return date.toISOString();
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
            scheduledAt: record.scheduledAt, // ✅ ISO string
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

/**
 * 경비 데이터 Upsert (Pull 동기화용)
 *
 * 서버에서 받은 경비 데이터를 로컬 DB에 반영
 * - 존재하면 업데이트
 * - 없으면 삽입
 * - deletedAt이 있는 레코드도 그대로 저장 (Soft Delete 반영)
 *
 * @param records - 서버에서 받은 경비 데이터 배열
 *
 * @example
 * ```ts
 * const serverExpenses = await fetchFromServer();
 * await upsertExpenses(serverExpenses);
 * ```
 */
export async function upsertExpenses(records: Expense[]): Promise<void> {
  if (records.length === 0) {
    console.log('📭 [Upsert] No expenses to upsert');
    return;
  }

  console.log(`📥 [Upsert] Upserting ${records.length} expenses...`);

  for (const record of records) {
    try {
      await db
        .insert(expenses)
        .values(record)
        .onConflictDoUpdate({
          target: expenses.id,
          set: {
            userId: record.userId,
            tripId: record.tripId,
            scheduleId: record.scheduleId,
            title: record.title,
            amount: record.amount,
            currency: record.currency,
            category: record.category,
            date: record.date, // ✅ ISO date string
            hasReceipt: record.hasReceipt,
            receiptUrl: record.receiptUrl,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt, // ✨ Soft Delete 반영
            version: record.version,
            // createdAt은 업데이트 안 함 (불변)
          },
        });
    } catch (error) {
      console.error(`❌ [Upsert] Failed to upsert expense ${record.id}:`, error);
      throw error;
    }
  }

  console.log(`✅ [Upsert] ${records.length} expenses upserted successfully`);
}
