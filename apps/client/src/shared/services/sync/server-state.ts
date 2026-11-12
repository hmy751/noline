import { and, eq } from 'drizzle-orm';

import { getDatabase, serverRecords, type ServerRow, type SyncTableName } from '@/shared/db';
import { requireLocalUserId } from '@/shared/store/auth';

export type ServerTable = SyncTableName;
export const serverRecordKey = (userId: string, tableName: ServerTable, id: string) => `${userId}:${tableName}:${id}`;

export const readServerRecord = async (tableName: ServerTable, id: string) => {
  return await getDatabase()
    .select()
    .from(serverRecords)
    .where(eq(serverRecords.key, serverRecordKey(requireLocalUserId(), tableName, id)))
    .get();
};

/** 호출자가 판본·귀속을 확인한 서버 원본을 Local 표시와 별도로 저장한다. */
export const rememberServerRecordInTransaction = async <Table extends ServerTable>(
  tableName: Table,
  server: ServerRow<Table>,
  userId: string,
): Promise<void> => {
  const authoritative = {
    key: serverRecordKey(userId, tableName, server.id),
    userId,
    tableName,
    recordId: server.id,
    tripId: 'tripId' in server ? server.tripId : server.id,
    version: server.version ?? 1,
    record: { ...server },
    deletedAt: null,
  };
  await getDatabase().insert(serverRecords).values(authoritative).onConflictDoUpdate({
    target: serverRecords.key,
    set: authoritative,
  });
};

/** 버전 없는 410·DELETE도 확정 삭제다. 기기 사본과 별개로 ID의 부활을 막는다. */
export const rememberConfirmedDeletionInTransaction = async (
  tableName: ServerTable,
  recordId: string,
  tripId: string | null,
  deletedAt: string,
): Promise<void> => {
  const userId = requireLocalUserId();
  const record = {
    key: serverRecordKey(userId, tableName, recordId),
    userId,
    tableName,
    recordId,
    tripId,
    version: null,
    record: null,
    deletedAt,
  };
  await getDatabase()
    .insert(serverRecords)
    .values(record)
    .onConflictDoUpdate({
      target: serverRecords.key,
      set: { deletedAt, record: null },
    });
};

/** 기기 사본 정리 시 본문도 같이 버린다. 판본·삭제 증거에는 사용자 입력이 없다. */
export const releaseServerRecordBodiesInTransaction = async (tripId: string): Promise<void> => {
  await getDatabase()
    .update(serverRecords)
    .set({ record: null })
    .where(and(eq(serverRecords.tripId, tripId), eq(serverRecords.userId, requireLocalUserId())));
};
