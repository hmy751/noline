import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { expenseQueryKeys } from './keys';

/**
 * 경비 삭제 Mutation Hook (Local-First, Soft Delete)
 *
 * 로컬 DB에서 deletedAt 설정 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 삭제됨 (UI에서 사라짐)
 *
 * ✅ Soft Delete: deletedAt 필드를 현재 시간으로 설정
 * ✅ Hard Delete가 아닌 논리 삭제로 데이터 복구 가능
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteExpense();
 * mutate('expense-id');
 * ```
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 트랜잭션: 로컬 DB Soft Delete + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB에서 Soft Delete (deletedAt 설정)
        await db
          .update(expenses)
          .set({
            deletedAt: getCurrentISOString(),
            updatedAt: getCurrentISOString(),
            version: sql`${expenses.version} + 1`, // version 증가
          })
          .where(eq(expenses.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('expenses', id, 'DELETE', null);
      });

      console.log(`✅ Expense deleted locally (Soft Delete): ${id}`);

      return { id };
    },
    onSuccess: () => {
      // 캐시 무효화 - 경비 목록 다시 조회 (deletedAt이 null인 것만 조회)
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete expense:', error);
    },
  });
};
