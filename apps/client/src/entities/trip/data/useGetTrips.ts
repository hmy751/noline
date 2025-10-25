import { useQuery } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { isNull, desc } from 'drizzle-orm';

// Query Key Factory
export const tripQueryKeys = {
  base: ['trip'] as const,
  all: () => [...tripQueryKeys.base, 'all'] as const,
};

/**
 * 전체 여행을 조회하는 React Query 훅 (Local-First)
 *
 * 로컬 DB에서 여행 목록 조회
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
      // 로컬 DB에서 조회 (삭제되지 않은 항목만)
      const tripList = await db
        .select()
        .from(trips)
        .where(isNull(trips.deletedAt))
        .orderBy(desc(trips.updatedAt))
        .all();

      console.log(`📋 Trips loaded from local DB: ${tripList.length} items`);

      return tripList;
    },
    staleTime: 5 * 60 * 1000, // 5분 (로컬 DB이지만 캐시 유지)
    gcTime: 10 * 60 * 1000, // 10분
  });
};
