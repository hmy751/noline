/**
 * useOfflineCity Hook
 * Trip의 오프라인 지도 정보 조회
 */

import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { db } from '@/shared/db';
import { offlineCities, trips } from '@/shared/db/schema';

import { offlineCityKeys } from './keys';

/**
 * Trip ID로 오프라인 지도 조회
 * - Trip의 cityId를 조회 후 offlineCities 테이블에서 검색
 * - 지도가 다운로드되어 있으면 OfflineCity 반환, 없으면 null
 */
export function useOfflineCity(tripId: string | null) {
  return useQuery({
    queryKey: offlineCityKeys.byTrip(tripId ?? ''),
    queryFn: async () => {
      if (!tripId) return null;

      // 1. Trip의 cityId 조회
      const trip = await db.select({ cityId: trips.cityId }).from(trips).where(eq(trips.id, tripId)).get();

      if (!trip?.cityId) {
        return null; // 도시 정보 없음
      }

      // 2. offlineCities 조회
      const offlineCity = await db.select().from(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).get();

      return offlineCity ?? null;
    },
    enabled: !!tripId,
    staleTime: Infinity, // 로컬 DB이므로 항상 최신
  });
}
