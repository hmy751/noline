import { useQuery } from '@tanstack/react-query';
import { db, tripActivations } from '@/shared/db';
import { eq } from 'drizzle-orm';
import { tripQueryKeys } from './keys';

/**
 * 여행 활성화 상태 조회 Hook
 *
 * - tripActivations 테이블에서 활성화 정보 조회
 * - 활성화 여부, 동기화 상태, 만료 시간 등 제공
 *
 * @param tripId 여행 ID
 *
 * @example
 * ```tsx
 * const { data: activation, isLoading } = useGetTripActivation(tripId);
 * if (activation?.isActivated) {
 *   // 활성화된 여행
 * }
 * ```
 */
export const useGetTripActivation = (tripId: string) => {
  return useQuery({
    queryKey: tripQueryKeys.activation(tripId),
    queryFn: async () => {
      const activation = await db.select().from(tripActivations).where(eq(tripActivations.tripId, tripId)).get();

      if (!activation) {
        return null;
      }

      console.log(`📋 Trip activation loaded: ${tripId} (activated: ${activation.isActivated})`);
      return activation;
    },
    enabled: !!tripId,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 현재 활성화된 여행 조회 Hook
 *
 * - 동시에 1개만 활성화 가능하므로, 현재 활성화된 여행 반환
 *
 * @example
 * ```tsx
 * const { data: activeTrip } = useGetActiveTrip();
 * ```
 */
export const useGetActiveTrip = () => {
  return useQuery({
    queryKey: tripQueryKeys.activeTrip(),
    queryFn: async () => {
      const activation = await db.select().from(tripActivations).where(eq(tripActivations.isActivated, true)).get();

      if (!activation) {
        console.log(`📋 No active trip found`);
        return null;
      }

      console.log(`📋 Active trip loaded: ${activation.tripId}`);
      return activation;
    },
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};
