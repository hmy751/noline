/**
 * useGetRoutes - 경로 조회 훅
 * - tripId로 모든 경로 조회
 * - 오프라인 지도 경로 표시용
 */

import { useQuery } from '@tanstack/react-query';
import { eq, and, isNull } from 'drizzle-orm';
import { db, routes, type Route } from '@/shared/db';

/**
 * 여행의 모든 경로 조회 (Soft Delete 제외)
 * @param tripId - 여행 ID
 * @returns Route[] | undefined
 */
export function useGetRoutes({ tripId }: { tripId: string }) {
  return useQuery({
    queryKey: ['routes', 'trip', tripId],
    queryFn: async (): Promise<Route[]> => {
      console.log('📍 Fetching routes for trip:', tripId);

      const result = await db
        .select()
        .from(routes)
        .where(and(eq(routes.tripId, tripId), isNull(routes.deletedAt)))
        .all();

      console.log(`✅ Found ${result.length} routes`);
      return result;
    },
  });
}

/**
 * 특정 Schedule 도착 경로 조회
 * @param scheduleId - 도착 Schedule ID
 * @returns Route | undefined
 */
export function useGetRouteToSchedule({ scheduleId }: { scheduleId: string }) {
  return useQuery({
    queryKey: ['routes', 'to', scheduleId],
    queryFn: async (): Promise<Route | undefined> => {
      const result = await db
        .select()
        .from(routes)
        .where(and(eq(routes.toScheduleId, scheduleId), isNull(routes.deletedAt)))
        .get();

      return result;
    },
  });
}
