import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { expenseQueryKeys } from './keys';
import { routeChildMutation } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';

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
 * 경비 수정 Mutation Hook
 *
 * - 활성화된 여행: 로컬 DB 업데이트 + sync_queue
 * - 비활성 여행: 서버 직접 호출 (오프라인시 에러)
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
      // 1. expense 조회하여 tripId 확인
      const expense = await db.select().from(expenses).where(eq(expenses.id, id)).get();

      if (!expense) {
        throw new Error(`Expense not found: ${id}`);
      }

      const tripId = expense.tripId;

      // 2. 라우팅 레이어 적용
      return await routeChildMutation(tripId, {
        // 로컬: 활성화된 여행
        local: async () => {
          await withTransaction(async () => {
            // 로컬 DB 업데이트
            await db
              .update(expenses)
              .set({
                ...data,
                updatedAt: getCurrentISOString(),
                version: sql`${expenses.version} + 1`, // version 증가
              })
              .where(eq(expenses.id, id));

            // sync_queue에 기록 (서버 Push 대기)
            await addToSyncQueue('expenses', id, 'UPDATE', data);
          });

          console.log(`✅ Expense updated locally: ${id}`);
          return { id, ...data };
        },

        // 원격: 비활성 여행
        remote: async () => {
          const response = await axios.put(`/expenses/${id}`, data);

          console.log(`✅ Expense updated on server: ${id}`);
          return response.data;
        },
      });
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
