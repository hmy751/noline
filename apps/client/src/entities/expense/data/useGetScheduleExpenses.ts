import { useQuery } from '@tanstack/react-query';
import { ExpenseRepository } from '../repository/expense-repository';
import { expenseQueryKeys } from './keys';

/**
 * 일정별 경비 조회 Hook
 *
 * - Repository를 통해 활성화 상태에 따라 Local/Remote 자동 분기
 * - scheduleId로 tripId 조회 후 라우팅 결정
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - createdAt 기준 내림차순 정렬
 *
 * @param scheduleId - 일정 ID (필수)
 *
 * @example
 * ```tsx
 * const { data: expenses, isLoading } = useGetScheduleExpenses('schedule-id-123');
 * ```
 */
export const useGetScheduleExpenses = (scheduleId: string) => {
  return useQuery({
    queryKey: expenseQueryKeys.bySchedule(scheduleId),
    queryFn: () => ExpenseRepository.getByScheduleId(scheduleId),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
