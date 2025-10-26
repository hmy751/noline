import { useQuery } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { isNull, eq, and } from 'drizzle-orm';

export const scheduleQueryKeys = {
  base: ['schedule'] as const,
  list: (tripId: string) => [...scheduleQueryKeys.base, 'list', tripId] as const,
  detail: (id: string) => [...scheduleQueryKeys.base, 'detail', id] as const,
  all: () => [...scheduleQueryKeys.base, 'all'] as const,
};

/**
 * 여행의 일정 목록 조회 (Local-First)
 *
 * 로컬 DB에서 일정 목록 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - tripId로 필터링
 * - scheduledAt 기준 오름차순 정렬 (시간순)
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
      // 로컬 DB에서 조회 (삭제되지 않은 항목만, tripId 필터)
      const scheduleList = await db
        .select()
        .from(schedules)
        .where(and(isNull(schedules.deletedAt), eq(schedules.tripId, tripId)))
        .orderBy(schedules.scheduledAt) // 시간순 정렬
        .all();

      console.log(`📋 Schedules loaded from local DB: ${scheduleList.length} items`);

      return scheduleList;
    },
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
