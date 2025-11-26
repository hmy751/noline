import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import type { UpdateExpenseRequest } from '../model';
import { expenseQueryKeys } from './keys';

/**
 * 경비 수정 Mutation Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
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
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) => ExpenseRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update expense:', error);
    },
  });
};
