import { useQuery } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import { expenseQueryKeys } from './keys';

/**
 * 전체 경비 조회 Hook (로컬 전용)
 *
 * - Repository를 통해 로컬 DB에서만 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 * - 활성화된 여행의 경비만 포함됨
 *
 * @example
 * ```tsx
 * const { data: allExpenses, isLoading } = useGetAllExpenses();
 * ```
 */
export const useGetAllExpenses = () => {
  return useQuery({
    queryKey: expenseQueryKeys.all(),
    queryFn: () => ExpenseRepository.getAll(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
