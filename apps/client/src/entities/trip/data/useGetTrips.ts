import { useQuery } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { isNull, desc } from 'drizzle-orm';
import { routeTripQuery } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';
import { tripQueryKeys } from './keys';

/**
 * 전체 여행을 조회하는 React Query 훅 (Router 적용)
 *
 * 활성화 여부에 따라 로컬/서버 분기:
 * - 활성화된 Trip 있음: 로컬 DB 조회
 * - 비활성 상태: 서버 API 조회
 * - deletedAt이 null인 항목만 조회 (Soft Delete)
 * - updatedAt 기준 내림차순 정렬
 *
 * @example
 * ```tsx
 * const { data: trips, isLoading } = useGetTrips();
 * ```
 */
export const useGetTrips = () => {
  return useQuery({
    queryKey: tripQueryKeys.all(),
    queryFn: async () => {
      // Router를 통한 Trip 조회 (활성화된 Trip이 있으면 local, 없으면 remote)
      return await routeTripQuery({
        local: async () => {
          // 활성화된 Trip 있음 → 로컬 DB 조회
          const tripList = await db
            .select()
            .from(trips)
            .where(isNull(trips.deletedAt))
            .orderBy(desc(trips.updatedAt))
            .all();
          console.log(`📋 Trips loaded from local DB: ${tripList.length} items`);
          return tripList;
        },
        remote: async () => {
          // 비활성 상태 → 서버 API 조회
          const response = await axios.get('/api/trips');

          const tripList = Array.isArray(response.data) ? response.data : response.data.data;

          return tripList;
        },
      });
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
