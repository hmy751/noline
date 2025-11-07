/**
 * useGetScheduleCount Hook
 * Trip의 Schedule 개수 조회
 */

import { useQuery } from '@tanstack/react-query';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/shared/db';
import { schedules } from '@/shared/db/schema';
import { scheduleQueryKeys } from './keys';

/**
 * Trip의 Schedule 개수 조회
 * - Soft delete된 항목은 제외
 * - 오프라인 지도 다운로드 트리거 판단에 사용
 */
export function useGetScheduleCount(tripId: string | null) {
  return useQuery({
    queryKey: scheduleQueryKeys.count(tripId ?? ''),
    queryFn: async () => {
      if (!tripId) return 0;

      const result = await db
        .select()
        .from(schedules)
        .where(and(eq(schedules.tripId, tripId), isNull(schedules.deletedAt)))
        .all();

      return result.length;
    },
    enabled: !!tripId,
    staleTime: 0, // 항상 최신 카운트 조회
  });
}
