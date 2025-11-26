import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import { expenseQueryKeys } from './keys';

/**
 * 경비 삭제 Mutation Hook (Soft Delete)
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
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
    mutationFn: (id: string) => ExpenseRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete expense:', error);
    },
  });
};
