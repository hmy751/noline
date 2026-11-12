import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';

import { expenseQueryKeys } from './keys';
import type { CreateExpenseRequest } from '../model';
import { ExpenseRepository } from '../repository/expense-repository';

/**
 * 경비 생성 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - Client-Side ID: 외부에서 ID 생성하여 전달
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
    mutationFn: (data: CreateExpenseRequest) => ExpenseRepository.create(data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.all() }),
        ...(variables.tripId
          ? [cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.byTrip(variables.tripId) })]
          : []),
        ...(variables.scheduleId
          ? [cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.bySchedule(variables.scheduleId) })]
          : []),
      ]);
    },
    onError: (error) => {
      console.error('❌ Failed to create expense:', error);
    },
  });
};
