import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { CreateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 생성 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 저장 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 저장됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTrip();
 * mutate({
 *   name: 'Tokyo Trip',
 *   destination: 'Tokyo',
 *   country: 'Japan',
 *   // ...
 * });
 * ```
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      const id = data.id; // ✅ Echo 아키텍처: 외부에서 전달받은 ID 사용
      const now = getCurrentISOString();

      // 사용자 ID (현재는 테스트용 고정값, 추후 인증 구현 시 실제 userId 사용)
      const userId = data.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

      // 로컬 DB에 저장할 데이터 준비 (모두 ISO string)
      const newTrip = {
        id,
        userId,
        name: data.name,
        destination: data.destination,
        country: data.country || null,
        latitude: data.latitude?.toString() || null,
        longitude: data.longitude?.toString() || null,
        cityId: data.cityId || null,
        startDate: data.startDate, // ✅ ISO string
        endDate: data.endDate, // ✅ ISO string
        createdAt: now, // ✅ ISO string
        updatedAt: now, // ✅ ISO string
        deletedAt: null,
        version: 1,
      };

      // 트랜잭션: 로컬 DB 저장 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB에 저장
        await db.insert(trips).values(newTrip);

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('trips', id, 'CREATE', {
          id,
          userId,
          name: data.name,
          destination: data.destination,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          cityId: data.cityId,
          startDate: data.startDate,
          endDate: data.endDate,
        });
      });

      console.log(`✅ Trip created locally: ${id} - ${data.name}`);

      return newTrip;
    },
    onSuccess: () => {
      // 캐시 무효화 - 새 여행이 생성되었으므로 전체 여행 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create trip:', error);
    },
  });
};
