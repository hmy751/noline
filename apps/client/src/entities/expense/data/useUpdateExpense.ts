import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';

import { expenseQueryKeys } from './keys';
import type { UpdateExpenseRequest } from '../model';
import { ExpenseRepository } from '../repository/expense-repository';

type UpdateExpenseInput = {
  id: string;
  tripId: string;
  data: UpdateExpenseRequest;
};

/** 수정 중 발견한 삭제·보류도 목록에 반영하므로 실패한 경우에도 다시 조회한다. */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tripId, data }: UpdateExpenseInput) => ExpenseRepository.update(id, tripId, data),
    onSettled: () => cancelAndInvalidateQueries(queryClient, { queryKey: expenseQueryKeys.base }),
    onError: (error) => {
      console.error('[Expense] Failed to update expense', error);
    },
  });
};
