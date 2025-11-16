import { useQuery } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { isNull, desc } from 'drizzle-orm';
import { expenseQueryKeys } from './keys';

/**
 * 전체 경비 조회 Hook (로컬 전용)
 *
 * - 로컬 DB에서만 조회 (라우팅 없음)
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
    queryFn: async () => {
      const expenseList = await db
        .select()
        .from(expenses)
        .where(isNull(expenses.deletedAt))
        .orderBy(desc(expenses.createdAt))
        .all();

      console.log(`📋 All expenses loaded from local DB: ${expenseList.length} items`);
      return expenseList;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
