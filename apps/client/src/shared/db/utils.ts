import {
  getDatabase,
  runDatabaseTransaction,
  runDatabaseOperation,
  trips,
  schedules,
  expenses,
  type Trip,
  type Schedule,
  type Expense,
} from './index';

/** entity 변경과 sync_queue 기록을 같은 transaction에서 실행한다. */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return runDatabaseTransaction(callback);
}

export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/** Date는 ISO로 변환하고 문자열 입력은 검증 없이 그대로 반환한다. */
export function dateToISOString(date: Date | string | null): string | null {
  if (!date) {
    return null;
  }
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

// Pull 결과는 생성 시각을 보존하고 서버의 삭제 상태와 version을 반영한다.
export async function upsertTrips(records: Trip[]): Promise<void> {
  if (records.length === 0) {
    console.log('[Database] No trips to upsert');
    return;
  }

  console.log(`[Database] Upserting ${records.length} trips...`);

  await runDatabaseOperation(async () => {
    for (const record of records) {
      try {
        await getDatabase()
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
              deletedAt: record.deletedAt,
              version: record.version,
            },
          });
      } catch (error) {
        console.error(`[Database] Failed to upsert trip ${record.id}:`, error);
        throw error;
      }
    }
  });

  console.log(`[Database] ${records.length} trips upserted successfully`);
}

export async function upsertSchedules(records: Schedule[]): Promise<void> {
  if (records.length === 0) {
    console.log('[Database] No schedules to upsert');
    return;
  }

  console.log(`[Database] Upserting ${records.length} schedules...`);

  await runDatabaseOperation(async () => {
    for (const record of records) {
      try {
        await getDatabase()
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
              scheduledAt: record.scheduledAt,
              latitude: record.latitude,
              longitude: record.longitude,
              updatedAt: record.updatedAt,
              deletedAt: record.deletedAt,
              version: record.version,
            },
          });
      } catch (error) {
        console.error(`[Database] Failed to upsert schedule ${record.id}:`, error);
        throw error;
      }
    }
  });

  console.log(`[Database] ${records.length} schedules upserted successfully`);
}

export async function upsertExpenses(records: Expense[]): Promise<void> {
  if (records.length === 0) {
    console.log('[Database] No expenses to upsert');
    return;
  }

  console.log(`[Database] Upserting ${records.length} expenses...`);

  await runDatabaseOperation(async () => {
    for (const record of records) {
      try {
        await getDatabase()
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
              date: record.date,
              hasReceipt: record.hasReceipt,
              receiptUrl: record.receiptUrl,
              updatedAt: record.updatedAt,
              deletedAt: record.deletedAt,
              version: record.version,
            },
          });
      } catch (error) {
        console.error(`[Database] Failed to upsert expense ${record.id}:`, error);
        throw error;
      }
    }
  });

  console.log(`[Database] ${records.length} expenses upserted successfully`);
}
