import axios from 'axios';
import { and, eq } from 'drizzle-orm';
import type { z } from 'zod';

import { legacyHoldsResponse, ackLegacyHoldResponse } from '@repo/schema/responses/mutation-conflict';

import {
  getDatabase,
  type LegacySyncHold,
  legacySyncHolds,
  legacyHoldAcks,
  runDatabaseOperation,
  runDatabaseTransaction,
} from '@/shared/db';
import { generateId } from '@/shared/services/id/ulid';
import { requireLocalUserId } from '@/shared/store/auth';

import syncApiClient from './api';

export const listLegacyHolds = async (tableName: string, recordId?: string): Promise<LegacySyncHold[]> => {
  return runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(legacySyncHolds)
      .where(
        and(
          eq(legacySyncHolds.userId, requireLocalUserId()),
          eq(legacySyncHolds.tableName, tableName),
          recordId ? eq(legacySyncHolds.recordId, recordId) : undefined,
        ),
      )
      .all(),
  );
};

export const clearLegacyHold = async (id: string): Promise<void> => {
  await runDatabaseTransaction(() => clearLegacyHoldInTransaction(id));
};

export const clearLegacyHoldInTransaction = async (id: string): Promise<void> => {
  const userId = requireLocalUserId();
  const hold = await getDatabase()
    .select()
    .from(legacySyncHolds)
    .where(and(eq(legacySyncHolds.id, id), eq(legacySyncHolds.userId, userId)))
    .get();

  if (requireLocalUserId() !== userId) {
    throw new Error('보류 입력 확인 중 계정이 변경되었습니다');
  }

  if (hold?.serverBacked) {
    await getDatabase()
      .insert(legacyHoldAcks)
      .values({ id, userId: hold.userId, createdAt: new Date().toISOString() })
      .onConflictDoNothing();
  }

  await getDatabase()
    .delete(legacySyncHolds)
    .where(and(eq(legacySyncHolds.id, id), eq(legacySyncHolds.userId, requireLocalUserId())));

  if (requireLocalUserId() !== userId) {
    throw new Error('보류 입력 확인 중 계정이 변경되었습니다');
  }

  notifyLegacyHolds();
};

export const preserveLegacyHoldInTransaction = async (
  tableName: string,
  recordId: string,
  tripId: string,
  payload: Record<string, unknown>,
  current: Record<string, unknown>,
  id = generateId(),
  { serverBacked = false }: { serverBacked?: boolean } = {},
): Promise<void> => {
  const userId = requireLocalUserId();

  if (
    (tableName !== 'schedules' && tableName !== 'expenses') ||
    current.userId !== userId ||
    current.id !== recordId ||
    current.tripId !== tripId ||
    (!serverBacked &&
      ((payload.userId != null && payload.userId !== userId) ||
        (payload.tripId != null && payload.tripId !== tripId) ||
        (payload.id != null && payload.id !== recordId)))
  ) {
    throw new Error('보류 입력의 소유자나 여행이 일치하지 않습니다');
  }

  const hold = {
    id,
    userId,
    serverBacked,
    tableName,
    recordId,
    tripId,
    payload,
    current,
    createdAt: new Date().toISOString(),
  };

  const dismissal =
    serverBacked &&
    (await getDatabase()
      .select()
      .from(legacyHoldAcks)
      .where(and(eq(legacyHoldAcks.id, id), eq(legacyHoldAcks.userId, hold.userId)))
      .get());

  if (requireLocalUserId() !== userId) {
    throw new Error('보류 입력 저장 중 계정이 변경되었습니다');
  }

  if (dismissal) {
    return;
  }

  await getDatabase().insert(legacySyncHolds).values(hold).onConflictDoNothing();

  if (requireLocalUserId() !== userId) {
    throw new Error('보류 입력 저장 중 계정이 변경되었습니다');
  }

  notifyLegacyHolds();
};

export const preserveLegacyHold = async (
  tableName: string,
  recordId: string,
  tripId: string,
  payload: Record<string, unknown>,
  current: Record<string, unknown>,
  id?: string,
  { serverBacked = false }: { serverBacked?: boolean } = {},
): Promise<void> => {
  return runDatabaseTransaction(() =>
    preserveLegacyHoldInTransaction(tableName, recordId, tripId, payload, current, id, { serverBacked }),
  );
};

const holdListeners = new Set<() => void>();

export const subscribeLegacyHolds = (listener: () => void): (() => void) => {
  holdListeners.add(listener);
  return () => {
    holdListeners.delete(listener);
  };
};

export const notifyLegacyHolds = (): void => {
  for (const listener of holdListeners) {
    try {
      listener();
    } catch {
      /* 화면 구독 실패는 저장을 취소하지 않는다. */
    }
  }
};

/** 옛 요청의 재전송은 JSON 속성 순서가 달라도 같은 보류 입력이다. */
const serializeSortedJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(serializeSortedJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const fields = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${serializeSortedJson(item)}`);

    return `{${fields.join(',')}}`;
  }

  return JSON.stringify(value);
};

const getHoldSignature = (hold: Pick<LegacySyncHold, 'tableName' | 'recordId' | 'payload'>): string => {
  return serializeSortedJson([hold.tableName, hold.recordId, hold.payload]);
};

/** 인증된 계정 전체의 이전 앱 입력도 활성 여행 유무와 무관하게 수신한다. */
export const synchronizeLegacyHolds = async (
  onStage?: (stage: 'local-before-send' | 'sending' | 'local-after-response') => void,
): Promise<void> => {
  onStage?.('local-before-send');
  const userId = requireLocalUserId();
  const previousHolds = await runDatabaseOperation(() =>
    getDatabase()
      .select({ id: legacySyncHolds.id })
      .from(legacySyncHolds)
      .where(eq(legacySyncHolds.userId, userId))
      .all(),
  );
  const knownIdsBeforeFetch = new Set(previousHolds.map((hold) => hold.id));
  let response;

  try {
    onStage?.('sending');
    response = await syncApiClient.get('/api/sync/legacy-holds');
    onStage?.('local-after-response');
  } catch (error) {
    if (axios.isAxiosError(error) && [404, 405].includes(error.response?.status ?? 0)) {
      return;
    }

    throw error;
  }

  const remoteHolds = legacyHoldsResponse.parse(response.data).data;

  if (
    remoteHolds.some(
      (hold) =>
        hold.userId !== userId ||
        hold.current.userId !== userId ||
        hold.current.id !== hold.recordId ||
        hold.current.tripId !== hold.tripId,
    )
  ) {
    throw new Error('다른 계정의 보류 입력입니다');
  }

  const hasChanges = await runDatabaseTransaction(() =>
    applyRemoteLegacyHoldsInTransaction(userId, remoteHolds, knownIdsBeforeFetch),
  );

  if (hasChanges) {
    notifyLegacyHolds();
  }

  await acknowledgeLegacyHolds(userId, onStage);
};

/** 수신 전부터 있던 서버 보류만 정리하고, ACK한 입력은 다시 보존하지 않는다. */
const applyRemoteLegacyHoldsInTransaction = async (
  userId: string,
  remoteHolds: z.infer<typeof legacyHoldsResponse>['data'],
  knownIdsBeforeFetch: Set<string>,
): Promise<boolean> => {
  let hasChanges = false;

  if (requireLocalUserId() !== userId) {
    throw new Error('동기화 중 계정이 변경되었습니다');
  }

  const db = getDatabase();
  const localHolds = await db.select().from(legacySyncHolds).where(eq(legacySyncHolds.userId, userId)).all();
  const acks = await db.select().from(legacyHoldAcks).where(eq(legacyHoldAcks.userId, userId)).all();

  for (const hold of remoteHolds) {
    const signature = getHoldSignature(hold);

    if (acks.some((ack) => ack.id === hold.id)) {
      continue;
    }

    const duplicate = localHolds.find((item) => getHoldSignature(item) === signature);

    if (duplicate && duplicate.id !== hold.id) {
      await db.delete(legacySyncHolds).where(eq(legacySyncHolds.id, duplicate.id));
      hasChanges = true;
    }

    const existing = localHolds.find((item) => item.id === hold.id);

    if (!existing || serializeSortedJson(existing.current) !== serializeSortedJson(hold.current)) {
      hasChanges = true;
    }

    await db
      .insert(legacySyncHolds)
      .values({ ...hold, serverBacked: true })
      .onConflictDoUpdate({ target: legacySyncHolds.id, set: { ...hold, serverBacked: true } });
  }

  for (const hold of localHolds) {
    if (hold.serverBacked && knownIdsBeforeFetch.has(hold.id) && !remoteHolds.some((item) => item.id === hold.id)) {
      await db
        .insert(legacyHoldAcks)
        .values({ id: hold.id, userId, createdAt: new Date().toISOString(), acknowledged: true })
        .onConflictDoNothing();
      await db.delete(legacySyncHolds).where(eq(legacySyncHolds.id, hold.id));
      hasChanges = true;
    }
  }

  return hasChanges;
};

const acknowledgeLegacyHolds = async (
  userId: string,
  onStage?: (stage: 'local-before-send' | 'sending' | 'local-after-response') => void,
): Promise<void> => {
  const acks = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(legacyHoldAcks)
      .where(and(eq(legacyHoldAcks.userId, userId), eq(legacyHoldAcks.acknowledged, false)))
      .all(),
  );

  for (const ack of acks) {
    if (requireLocalUserId() !== userId) {
      throw new Error('동기화 중 계정이 변경되었습니다');
    }

    let result;

    try {
      onStage?.('sending');
      result = await syncApiClient.delete('/api/sync/legacy-holds/' + encodeURIComponent(ack.id));
      onStage?.('local-after-response');
    } catch (error) {
      if (axios.isAxiosError(error) && [404, 405].includes(error.response?.status ?? 0)) {
        return;
      }

      throw error;
    }

    if (requireLocalUserId() !== userId) {
      throw new Error('동기화 중 계정이 변경되었습니다');
    }

    if (ackLegacyHoldResponse.parse(result.data).data.id !== ack.id) {
      throw new Error('보류 입력 확인 응답이 일치하지 않습니다');
    }

    await runDatabaseOperation(() =>
      getDatabase()
        .update(legacyHoldAcks)
        .set({ acknowledged: true })
        .where(and(eq(legacyHoldAcks.id, ack.id), eq(legacyHoldAcks.userId, userId))),
    );
  }
};
