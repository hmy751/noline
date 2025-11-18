import { useQuery } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { and, eq, isNull } from 'drizzle-orm';
import { scheduleQueryKeys } from './keys';
import { routeChildQuery } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';

/**
 * 특정 일정 상세 정보 조회
 *
 * - 활성화된 여행: 로컬 DB 조회
 * - 비활성 여행: 서버 API 조회 (오프라인시 에러)
 *
 * @param scheduleId - 조회할 일정 ID
 * @param tripId - 여행 ID (라우팅 판단용)
 *
 * @example
 * ```tsx
 * const { data: schedule, isLoading } = useGetScheduleById('schedule-id', 'trip-id');
 * ```
 */
export const useGetScheduleById = (scheduleId: string, tripId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(scheduleId),
    queryFn: async () => {
      return await routeChildQuery(tripId, {
        // 로컬: 활성화된 여행
        local: async () => {
          const schedule = await db
            .select()
            .from(schedules)
            .where(and(isNull(schedules.deletedAt), eq(schedules.id, scheduleId)))
            .get();

          if (!schedule) {
            throw new Error(`Schedule not found in local DB: ${scheduleId}`);
          }

          console.log(`📋 Schedule loaded from local DB: ${schedule.id}`);
          return schedule;
        },

        // 원격: 비활성 여행
        remote: async () => {
          const response = await axios.get(`/schedules/${scheduleId}`);

          console.log(`📋 Schedule loaded from server: ${scheduleId}`);
          return response.data.data;
        },
      });
    },
    enabled: !!scheduleId && !!tripId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
