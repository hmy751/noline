import { useQuery } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { isNull, desc, eq, and } from 'drizzle-orm';

// Query Key Factory
export const expenseQueryKeys = {
  base: ['expense'] as const,
  all: () => [...expenseQueryKeys.base, 'all'] as const,
  byTrip: (tripId: string) => [...expenseQueryKeys.base, 'trip', tripId] as const,
  bySchedule: (scheduleId: string) => [...expenseQueryKeys.base, 'schedule', scheduleId] as const,
};

/**
 * 전체 경비를 조회하는 React Query 훅 (Local-First)
 *
 * 로컬 DB에서 경비 목록 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - tripId 또는 scheduleId로 필터링 가능
 * - createdAt 기준 내림차순 정렬
 *
 * @param tripId - 특정 여행의 경비만 조회 (선택)
 * @param scheduleId - 특정 일정의 경비만 조회 (선택)
 *
 * @example
 * ```tsx
 * // 전체 경비 조회
 * const { data: expenses } = useGetExpenses();
 *
 * // 특정 여행의 경비만 조회
 * const { data: tripExpenses } = useGetExpenses({ tripId: 'trip-id' });
 *
 * // 특정 일정의 경비만 조회
 * const { data: scheduleExpenses } = useGetExpenses({ scheduleId: 'schedule-id' });
 * ```
 */
export const useGetExpenses = (filters?: { tripId?: string; scheduleId?: string }) => {
  const { tripId, scheduleId } = filters || {};

  return useQuery({
    queryKey: tripId
      ? expenseQueryKeys.byTrip(tripId)
      : scheduleId
        ? expenseQueryKeys.bySchedule(scheduleId)
        : expenseQueryKeys.all(),
    queryFn: async () => {
      // 로컬 DB에서 조회 (필터 적용)
      const conditions = [isNull(expenses.deletedAt)];

      if (tripId) {
        conditions.push(eq(expenses.tripId, tripId));
      } else if (scheduleId) {
        conditions.push(eq(expenses.scheduleId, scheduleId));
      }

      const expenseList = await db
        .select()
        .from(expenses)
        .where(and(...conditions))
        .orderBy(desc(expenses.createdAt))
        .all();

      console.log(`📋 Expenses loaded from local DB: ${expenseList.length} items`);

      return expenseList;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
