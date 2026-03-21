import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import type { CreateExpenseRequest } from '../model';
import { expenseQueryKeys } from './keys';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.all(),
      });

      if (variables.tripId) {
        queryClient.invalidateQueries({
          queryKey: expenseQueryKeys.byTrip(variables.tripId),
        });
      }

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
