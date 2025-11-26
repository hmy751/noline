import { useQuery } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import { expenseQueryKeys } from './keys';

/**
 * 여행별 경비 조회 Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 *
 * @param tripId - 여행 ID (필수)
 *
 * @example
 * ```tsx
 * const { data: expenses, isLoading } = useGetTripExpenses('trip-id-123');
 * ```
 */
export const useGetTripExpenses = (tripId: string) => {
  return useQuery({
    queryKey: expenseQueryKeys.byTrip(tripId),
    queryFn: () => ExpenseRepository.getByTripId(tripId),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
