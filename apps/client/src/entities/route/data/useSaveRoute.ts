/**
 * useSaveRoute - 경로 저장 훅
 * - Mapbox Directions API 호출 후 DB 저장
 * - 오프라인 지도 다운로드 시 사용
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateId } from '@/shared/services/id/ulid';
import { db, routes, type NewRoute } from '@/shared/db';
import { getDirections, type MapboxProfile, type Coordinate } from '@/shared/services/directions';
import { routeQueryKeys } from './keys';

interface SaveRouteParams {
  tripId: string;
  fromScheduleId?: string; // nullable (숙소 출발 시)
  toScheduleId: string;
  from: Coordinate;
  to: Coordinate;
  profile?: MapboxProfile; // 기본: walking
}

/**
 * 경로 저장
 * 1. Mapbox Directions API 호출
 * 2. 응답 데이터를 DB에 저장
 * 3. React Query 캐시 무효화
 */
export function useSaveRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, fromScheduleId, toScheduleId, from, to, profile = 'walking' }: SaveRouteParams) => {
      console.log(`🛣️ Saving route: ${fromScheduleId || 'accommodation'} → ${toScheduleId} (${profile})`);

      // 1. Mapbox Directions API 호출
      const directions = await getDirections({ from, to, profile });

      // 2. DB 저장
      const now = new Date().toISOString();
      const newRoute: NewRoute = {
        id: generateId(),
        tripId,
        fromScheduleId: fromScheduleId || null,
        toScheduleId,
        profile,
        geometry: directions.geometry,
        distance: directions.distance,
        duration: directions.duration,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 1,
      };

      await db.insert(routes).values(newRoute).run();

      console.log(`✅ Route saved: ${directions.distance}m, ${directions.duration}s`);

      return newRoute;
    },
    onSuccess: (_, variables) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: routeQueryKeys.byTrip(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: routeQueryKeys.toSchedule(variables.toScheduleId) });
    },
  });
}
