import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { UpdateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 수정 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 업데이트 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 업데이트됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateTrip();
 * mutate({
 *   id: 'trip-id',
 *   data: {
 *     name: 'Updated Trip Name',
 *     destination: 'New Destination',
 *   },
 * });
 * ```
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTripRequest }) => {
      // 트랜잭션: 로컬 DB 업데이트 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB 업데이트
        await db
          .update(trips)
          .set({
            ...data,
            updatedAt: getCurrentISOString(),
            version: sql`${trips.version} + 1`, // version 증가
          })
          .where(eq(trips.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('trips', id, 'UPDATE', data);
      });

      console.log(`✅ Trip updated locally: ${id}`);

      return { id, ...data };
    },
    onSuccess: () => {
      // 캐시 무효화 - 여행 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update trip:', error);
    },
  });
};
