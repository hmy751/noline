import { useQuery } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { isNull, eq, and } from 'drizzle-orm';
import { scheduleQueryKeys } from './keys';
import { routeChildQuery } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';

/**
 * 여행의 일정 목록 조회 (라우팅 레이어 적용)
 *
 * - 활성화된 여행: 로컬 DB 조회
 * - 비활성 여행: 서버 API 조회 (온라인 필수)
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - scheduledAt 기준 오름차순 정렬 (시간순)
 *
 * @param tripId - 여행 ID (필수)
 *
 * @example
 * ```tsx
 * const { data: schedules, isLoading } = useGetSchedules('trip-id');
 * ```
 */
export const useGetSchedules = (tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(tripId),
    queryFn: async () => {
      return await routeChildQuery(tripId, {
        // 로컬: 로컬 DB 조회
        local: async () => {
          const scheduleList = await db
            .select()
            .from(schedules)
            .where(and(isNull(schedules.deletedAt), eq(schedules.tripId, tripId)))
            .orderBy(schedules.scheduledAt)
            .all();

          console.log(`📋 Schedules loaded from local DB: ${scheduleList.length} items`);
          return scheduleList;
        },

        // 원격: 서버 API 호출 (Query Parameter)
        remote: async () => {
          const response = await axios.get(`/api/schedules?tripId=${tripId}`);
          console.log(`📋 Schedules loaded from server: ${response.data.length} items`);
          return response.data;
        },
      });
    },
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
