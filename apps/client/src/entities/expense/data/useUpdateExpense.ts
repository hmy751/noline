import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { expenseQueryKeys } from './keys';

/**
 * 경비 수정 요청 데이터 타입
 */
export type UpdateExpenseRequest = {
  title?: string;
  amount?: string;
  currency?: string;
  category?: string;
  date?: string; // ISO string
  scheduleId?: string | null;
  hasReceipt?: boolean;
  receiptUrl?: string | null;
};

/**
 * 경비 수정 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 업데이트 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 업데이트됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateExpense();
 * mutate({
 *   id: 'expense-id',
 *   data: {
 *     title: 'Updated Expense',
 *     amount: '50.00',
 *     category: '식사',
 *   },
 * });
 * ```
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpenseRequest }) => {
      // 트랜잭션: 로컬 DB 업데이트 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB 업데이트
        await db
          .update(expenses)
          .set({
            ...data,
            updatedAt: getCurrentISOString(),
            version: sql`${expenses.version} + 1`, // version 증가
          })
          .where(eq(expenses.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('expenses', id, 'UPDATE', data);
      });

      console.log(`✅ Expense updated locally: ${id}`);

      return { id, ...data };
    },
    onSuccess: () => {
      // 캐시 무효화 - 경비 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update expense:', error);
    },
  });
};
