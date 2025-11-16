import { useQuery } from '@tanstack/react-query';
import { db, expenses, schedules } from '@/shared/db';
import { isNull, desc, eq, and } from 'drizzle-orm';
import { expenseQueryKeys } from './keys';
import { routeQuery } from '@/shared/services/offline-prep';
import axios from '@/shared/api/fetcher';

/**
 * 일정별 경비 조회 Hook (라우팅 레이어 적용)
 *
 * - scheduleId로 tripId 조회 후 활성화 여부 확인
 * - 활성화된 여행: 로컬 DB 조회
 * - 비활성 여행: 서버 API 조회 (온라인 필수)
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
    queryFn: async () => {
      // 1. scheduleId로 schedule 조회하여 tripId 찾기
      const schedule = await db
        .select({ tripId: schedules.tripId })
        .from(schedules)
        .where(eq(schedules.id, scheduleId))
        .get();

      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      const tripId = schedule.tripId;

      // 2. tripId로 라우팅 레이어 적용
      return await routeQuery(tripId, {
        // 로컬: 로컬 DB 조회
        local: async () => {
          const conditions = [isNull(expenses.deletedAt), eq(expenses.scheduleId, scheduleId)];

          const expenseList = await db
            .select()
            .from(expenses)
            .where(and(...conditions))
            .orderBy(desc(expenses.createdAt))
            .all();

          console.log(`📋 Schedule expenses loaded from local DB: ${expenseList.length} items`);
          return expenseList;
        },

        // 원격: 서버 API 호출 (Query Parameter)
        remote: async () => {
          const response = await axios.get(`/api/expenses?scheduleId=${scheduleId}`);
          console.log(`📋 Schedule expenses loaded from server: ${response.data.length} items`);
          return response.data;
        },
      });
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
