import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { expenseQueryKeys } from './keys';
import { routeMutation } from '@/shared/services/offline-prep';
import axios from '@/shared/api/fetcher';

/**
 * 경비 삭제 Mutation Hook (Soft Delete)
 *
 * - 활성화된 여행: 로컬 DB Soft Delete + sync_queue
 * - 비활성 여행: 서버 직접 호출 (오프라인시 에러)
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
      // 1. expense 조회하여 tripId 확인
      const expense = await db.select().from(expenses).where(eq(expenses.id, id)).get();

      if (!expense) {
        throw new Error(`Expense not found: ${id}`);
      }

      const tripId = expense.tripId;
      const deletedAt = getCurrentISOString();

      // 2. 라우팅 레이어 적용
      return await routeMutation(tripId, {
        // 로컬: 활성화된 여행
        local: async () => {
          await withTransaction(async () => {
            // 로컬 DB에서 Soft Delete (deletedAt 설정)
            await db
              .update(expenses)
              .set({
                deletedAt,
                updatedAt: deletedAt,
                version: sql`${expenses.version} + 1`, // version 증가
              })
              .where(eq(expenses.id, id));

            // sync_queue에 기록 (서버 Push 대기)
            await addToSyncQueue('expenses', id, 'DELETE', null);
          });

          console.log(`✅ Expense deleted locally (Soft Delete): ${id}`);
          return { id };
        },

        // 원격: 비활성 여행
        remote: async () => {
          await axios.delete(`/expenses/${id}`);

          console.log(`✅ Expense deleted on server: ${id}`);
          return { id };
        },
      });
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
