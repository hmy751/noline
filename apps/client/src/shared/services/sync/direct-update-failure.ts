import {
  deletedMutationResponse,
  legacyScheduleConflictResponse,
  legacyExpenseConflictResponse,
} from '@repo/schema/responses/mutation-conflict';

import { APIError } from '@/shared/api/errors';
import { runDatabaseTransaction } from '@/shared/db';
import { preserveLegacyHold } from '@/shared/services/sync/legacy-holds';
import { applyConfirmedDeletionInTransaction } from '@/shared/services/sync/confirmed-deletion';
import { requireLocalUserId } from '@/shared/store/auth';

import { observeFieldEdits } from '../edit-stamp';
import { ConfirmedDeletionError } from '../edit-stamp/errors';

/** 직접 수정의 충돌 입력 보관 또는 확인된 삭제를 반영하고, 처리 결과에 맞는 오류를 전달한다. */
export const handleDirectUpdateFailure = async (
  error: unknown,
  table: 'schedules' | 'expenses',
  id: string,
  tripId: string,
  payload: Record<string, unknown>,
): Promise<never> => {
  if (error instanceof APIError && error.code === 'LEGACY_UPDATE_CONFLICT') {
    const parsed = (table === 'schedules' ? legacyScheduleConflictResponse : legacyExpenseConflictResponse).safeParse(
      error.data,
    );
    const current = parsed.success ? parsed.data.data : undefined;
    const hold = parsed.success ? parsed.data.hold : undefined;
    const owner = requireLocalUserId();

    if (
      current?.id === id &&
      current.tripId === tripId &&
      current.userId === owner &&
      (!hold || (hold.tableName === table && hold.recordId === id && hold.tripId === tripId && hold.userId === owner))
    ) {
      await observeFieldEdits(current.fieldEdits);
      await preserveLegacyHold(table, id, tripId, hold?.payload ?? payload, current, hold?.id, {
        serverBacked: !!hold,
      });
      throw new APIError(
        '이전 수정이 반영되지 않았어요. 목록의 수정 확인에서 다시 선택해 주세요.',
        409,
        'LEGACY_UPDATE_CONFLICT',
      );
    }
  }

  if (error instanceof APIError && (error.code === 'ENTITY_DELETED' || error.code === 'TRIP_DELETED')) {
    const parsed = deletedMutationResponse.safeParse(error.data);

    if (!parsed.success || parsed.data.code !== error.code) {
      throw error;
    }

    const proof = parsed.data.data;

    if (proof.tripId !== tripId || proof.id !== id) {
      throw error;
    }

    const owner = requireLocalUserId();
    const applied = await runDatabaseTransaction(() => {
      requireLocalUserId(owner);
      return applyConfirmedDeletionInTransaction(
        error.code === 'TRIP_DELETED' ? 'trips' : table,
        error.code === 'TRIP_DELETED' ? tripId : id,
        tripId,
        proof.deletedAt,
      );
    });

    if (applied) {
      throw new ConfirmedDeletionError(error.code);
    }
  }

  throw error;
};
