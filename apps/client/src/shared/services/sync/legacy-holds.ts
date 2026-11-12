import { and, eq } from 'drizzle-orm';

import { getDatabase, legacySyncHolds, legacyHoldAcks } from '@/shared/db';
import { requireLocalUserId } from '@/shared/store/auth';

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
