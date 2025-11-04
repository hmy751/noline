import { useQuery } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { and, eq, isNull } from 'drizzle-orm';
import { scheduleQueryKeys } from './useGetSchedules';

/**
 * 특정 일정 상세 정보 조회 (Local-First)
 *
 * 로컬 DB에서 단일 일정 조회
 * - scheduleId로 특정 일정 조회
 * - Soft Delete된 항목은 제외
 *
 * @param scheduleId - 조회할 일정 ID
 *
 * @example
 * ```tsx
 * const { data: schedule, isLoading } = useGetScheduleById('schedule-id');
 * ```
 */
export const useGetScheduleById = (scheduleId: string) => {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(scheduleId),
    queryFn: async () => {
      // 로컬 DB에서 조회 (Soft Delete 제외)
      const schedule = await db
        .select()
        .from(schedules)
        .where(and(isNull(schedules.deletedAt), eq(schedules.id, scheduleId)))
        .get(); // .get()은 단일 결과 반환

      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      console.log(`📋 Schedule loaded from local DB: ${schedule.id}`);

      return schedule;
    },
    enabled: !!scheduleId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
