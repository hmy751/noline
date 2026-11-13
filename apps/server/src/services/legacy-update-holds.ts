import { and, eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';

import { legacyUpdateHold } from '@repo/schema/responses/mutation-conflict';

import { db, legacyUpdateHolds } from '../db/index.js';

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
