import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { CreateExpenseRequest } from '../model';
import { expenseQueryKeys } from './keys';

/**
 * 경비 생성 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 저장 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 저장됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateExpense();
 * mutate({
 *   id: generateId(),
 *   tripId: 'trip-id',
 *   title: 'Eiffel Tower Ticket',
 *   amount: '25.50',
 *   currency: 'EUR',
 *   category: '관광',
 *   date: '2024-03-15',
 * });
 * ```
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const id = data.id; // ✅ Echo 아키텍처: 외부에서 전달받은 ID 사용
      const now = getCurrentISOString();

      // 사용자 ID (현재는 테스트용 고정값, 추후 인증 구현 시 실제 userId 사용)
      const userId = data.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

      // 로컬 DB에 저장할 데이터 준비 (모두 ISO string)
      const newExpense = {
        id,
        userId,
        tripId: data.tripId,
        scheduleId: data.scheduleId || null,
        title: data.title,
        amount: data.amount,
        currency: data.currency || 'EUR',
        category: data.category,
        date: data.date, // ISO date string
        hasReceipt: data.hasReceipt || false,
        receiptUrl: data.receiptUrl || null,
        createdAt: now, // ✅ ISO string
        updatedAt: now, // ✅ ISO string
        deletedAt: null,
        version: 1,
      };

      // 트랜잭션: 로컬 DB 저장 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB에 저장
        await db.insert(expenses).values(newExpense);

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('expenses', id, 'CREATE', {
          id,
          userId,
          tripId: data.tripId,
          scheduleId: data.scheduleId,
          title: data.title,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          date: data.date,
          hasReceipt: data.hasReceipt,
          receiptUrl: data.receiptUrl,
        });
      });

      console.log(`✅ Expense created locally: ${id} - ${data.title}`);

      return newExpense;
    },
    onSuccess: (_, variables) => {
      // 캐시 무효화 - 새 경비가 생성되었으므로 관련 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.all(),
      });

      // 특정 여행의 경비 목록도 무효화
      if (variables.tripId) {
        queryClient.invalidateQueries({
          queryKey: expenseQueryKeys.byTrip(variables.tripId),
        });
      }

      // 특정 일정의 경비 목록도 무효화
      if (variables.scheduleId) {
        queryClient.invalidateQueries({
          queryKey: expenseQueryKeys.bySchedule(variables.scheduleId),
        });
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create expense:', error);
    },
  });
};
