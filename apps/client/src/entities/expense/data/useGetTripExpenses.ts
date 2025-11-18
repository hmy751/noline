import { useQuery } from '@tanstack/react-query';
import { db, expenses } from '@/shared/db';
import { isNull, desc, eq, and } from 'drizzle-orm';
import { expenseQueryKeys } from './keys';
import { routeChildQuery } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';

/**
 * 여행별 경비 조회 Hook (라우팅 레이어 적용)
 *
 * - 활성화된 여행: 로컬 DB 조회
 * - 비활성 여행: 서버 API 조회 (온라인 필수)
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
    queryFn: async () => {
      return await routeChildQuery(tripId, {
        // 로컬: 로컬 DB 조회
        local: async () => {
          const conditions = [isNull(expenses.deletedAt), eq(expenses.tripId, tripId)];

          const expenseList = await db
            .select()
            .from(expenses)
            .where(and(...conditions))
            .orderBy(desc(expenses.createdAt))
            .all();

          console.log(`📋 Trip expenses loaded from local DB: ${expenseList.length} items`);
          return expenseList;
        },

        // 원격: 서버 API 호출 (Query Parameter)
        remote: async () => {
          const response = await axios.get(`/api/expenses?tripId=${tripId}`);
          console.log(`📋 Trip expenses loaded from server: ${response.data.length} items`);
          return response.data;
        },
      });
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
