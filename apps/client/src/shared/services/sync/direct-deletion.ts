import type { z } from 'zod';

import type { deleteExpenseResponse } from '@repo/schema/responses/expense';

import { runDatabaseTransaction } from '@/shared/db';
import { AuthRequiredError, requireLocalUserId, useAuthStore } from '@/shared/store/auth';

import { applyConfirmedDeletionInTransaction } from './confirmed-deletion';

/** 비활성 여행의 삭제는 본문을 내려받지 않고 최소 삭제 증거와 기존 사본에만 반영한다. */
export const confirmRemoteChildDeletion = async (
  tableName: 'schedules' | 'expenses',
  recordId: string,
  tripId: string,
  proof: z.infer<typeof deleteExpenseResponse>['data'],
  sessionId: symbol | null,
  userId: string,
): Promise<void> => {
  await runDatabaseTransaction(async () => {
    if (useAuthStore.getState().sessionId !== sessionId || requireLocalUserId() !== userId) {
      throw new AuthRequiredError();
    }

    if (proof.id !== recordId) {
      throw new Error('삭제 응답의 기록이 일치하지 않습니다');
    }

    await applyConfirmedDeletionInTransaction(tableName, recordId, tripId, proof.deletedAt);
  });
};
