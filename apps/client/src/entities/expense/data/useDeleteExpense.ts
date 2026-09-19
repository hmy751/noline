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
 * mutate({ id: 'expense-id', tripId: 'trip-id' });
 * ```
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tripId }: { id: string; tripId: string }) => ExpenseRepository.delete(id, tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('[Expense] Failed to delete expense', error);
    },
  });
};
