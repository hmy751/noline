import { and, eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';

import { legacyUpdateHold } from '@repo/schema/responses/mutation-conflict';

import { db, legacyUpdateHolds, trips, schedules, expenses } from '../db/index.js';
import { serializeExpense } from '../serializers/expense.js';
import { serializeSchedule } from '../serializers/schedule.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type HeldRow = typeof legacyUpdateHolds.$inferSelect;
type HeldTable = 'schedules' | 'expenses';

/** JSON 객체의 키 순서만 다른 재전송도 같은 요청으로 식별한다. */
const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  const sortedEntries = Object.entries(value).sort(([left], [right]) => {
    if (left === right) {
      return 0;
    }

    return left < right ? -1 : 1;
  });
  const fields = sortedEntries.map(([key, fieldValue]) => `${JSON.stringify(key)}:${canonicalJson(fieldValue)}`);

  return `{${fields.join(',')}}`;
};

const serializeHold = (row: HeldRow, current = row.current) => {
  return legacyUpdateHold.parse({ ...row, current, createdAt: row.createdAt.toISOString() });
};

/** 반드시 소유권·유효한 구버전 충돌을 확인한 transaction 안에서만 호출한다. */
export const preserveLegacyUpdate = async (
  tx: Transaction,
  details: {
    userId: string;
    tripId: string;
    tableName: HeldTable;
    recordId: string;
    payload: Record<string, unknown>;
    current: Record<string, unknown>;
  },
) => {
  // 요청 본문만 보존한다. header/token은 전달하지 않으며 payload의 소유권 주장은 사용하지 않는다.
  const payloadHash = createHash('sha256').update(canonicalJson(details.payload)).digest('hex');
  const [created] = await tx
    .insert(legacyUpdateHolds)
    .values({ ...details, payloadHash })
    .onConflictDoNothing({
      target: [
        legacyUpdateHolds.userId,
        legacyUpdateHolds.tableName,
        legacyUpdateHolds.recordId,
        legacyUpdateHolds.payloadHash,
      ],
    })
    .returning();

  if (created) {
    return serializeHold(created, details.current);
  }

  const [existing] = await tx
    .select()
    .from(legacyUpdateHolds)
    .where(
      and(
        eq(legacyUpdateHolds.userId, details.userId),
        eq(legacyUpdateHolds.tableName, details.tableName),
        eq(legacyUpdateHolds.recordId, details.recordId),
        eq(legacyUpdateHolds.payloadHash, payloadHash),
      ),
    );

  return serializeHold(existing, details.current);
};

/** 소유권을 다시 확인한 최신 값으로 목록을 갱신하고, 확정 삭제에 속한 보류는 정리한다. */
export const refreshAndListLegacyUpdates = async (userId: string) => {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(legacyUpdateHolds)
      .where(eq(legacyUpdateHolds.userId, userId))
      .orderBy(legacyUpdateHolds.tripId, legacyUpdateHolds.createdAt, legacyUpdateHolds.id);

    const visibleHolds = [];

    for (const candidate of rows) {
      const [trip] = await tx
        .select()
        .from(trips)
        .where(and(eq(trips.id, candidate.tripId), eq(trips.userId, userId)))
        .for('update');

      // ACK가 먼저 잠금을 획득했다면 목록에 다시 포함시키지 않는다.
      const [held] = await tx
        .select()
        .from(legacyUpdateHolds)
        .where(and(eq(legacyUpdateHolds.id, candidate.id), eq(legacyUpdateHolds.userId, userId)));

      if (!held) {
        continue;
      }

      let current = held.current;
      let isEntityDeleted = false;

      if (held.tableName === 'schedules') {
        const [row] = await tx
          .select()
          .from(schedules)
          .where(and(eq(schedules.id, held.recordId), eq(schedules.userId, userId), eq(schedules.tripId, held.tripId)));

        if (row) {
          isEntityDeleted = row.deletedAt !== null;
          current = serializeSchedule(row);
        }
      } else {
        const [row] = await tx
          .select()
          .from(expenses)
          .where(and(eq(expenses.id, held.recordId), eq(expenses.userId, userId), eq(expenses.tripId, held.tripId)));

        if (row) {
          isEntityDeleted = row.deletedAt !== null;
          current = serializeExpense(row);
        }
      }

      if (trip?.deletedAt || isEntityDeleted) {
        // 단순한 행 부재는 삭제 증거로 삼지 않는다.
        await tx
          .delete(legacyUpdateHolds)
          .where(and(eq(legacyUpdateHolds.id, held.id), eq(legacyUpdateHolds.userId, userId)));
        continue;
      }

      visibleHolds.push(serializeHold(held, current));
    }

    return visibleHolds;
  });
};

export const acknowledgeLegacyUpdate = async (id: string, userId: string) => {
  // 없는 ID·다른 소유자의 ID도 같은 성공이다. 다른 소유자의 행은 바꾸거나 드러내지 않는다.
  await db.transaction(async (tx) => {
    const [held] = await tx
      .select()
      .from(legacyUpdateHolds)
      .where(and(eq(legacyUpdateHolds.id, id), eq(legacyUpdateHolds.userId, userId)));

    if (!held) {
      return;
    }

    await tx
      .select()
      .from(trips)
      .where(and(eq(trips.id, held.tripId), eq(trips.userId, userId)))
      .for('update');

    await tx.delete(legacyUpdateHolds).where(and(eq(legacyUpdateHolds.id, id), eq(legacyUpdateHolds.userId, userId)));
  });
};
