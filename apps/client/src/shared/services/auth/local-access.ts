import { and, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { getDatabase, tripActivations, trips } from '@/shared/db';
import { requireLocalUserId } from '@/shared/store/auth';

/** 로컬 읽기와 쓰기에 같은 계정 조건을 붙인다. 기한은 기존 활성화 정책에 맡긴다. */
export function ownedRow(userColumn: AnySQLiteColumn, ...conditions: (SQL | undefined)[]): SQL | undefined {
  return and(eq(userColumn, requireLocalUserId()), ...conditions);
}

export function activeTripScope(tripColumn: AnySQLiteColumn): SQL {
  const userId = requireLocalUserId();
  return inArray(
    tripColumn,
    getDatabase()
      .select({ id: trips.id })
      .from(trips)
      .innerJoin(tripActivations, eq(tripActivations.tripId, trips.id))
      .where(
        and(
          eq(trips.userId, userId),
          isNull(trips.deletedAt),
          eq(tripActivations.userId, userId),
          eq(tripActivations.isActivated, true),
        ),
      ),
  );
}

export async function assertActiveLocalTrip(tripId: string): Promise<void> {
  const trip = await getDatabase()
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, tripId), activeTripScope(trips.id)))
    .get();
  if (!trip) {
    throw new Error('이 계정에서 활성화한 여행만 수정할 수 있습니다');
  }
}

export function ownedActiveRow(
  table: { userId: AnySQLiteColumn; tripId: AnySQLiteColumn },
  ...conditions: (SQL | undefined)[]
): SQL | undefined {
  return ownedRow(table.userId, activeTripScope(table.tripId), ...conditions);
}
