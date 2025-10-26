import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { tripQueryKeys } from './useGetTrips';

/**
 * 여행 삭제 Mutation Hook (Local-First)
 *
 * Soft Delete: deletedAt 설정 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 삭제됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteTrip();
 * mutate('trip-id');
 * ```
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 트랜잭션: Soft Delete + sync_queue 기록
      await withTransaction(async () => {
        // 1. Soft Delete (deletedAt 설정)
        await db
          .update(trips)
          .set({
            deletedAt: getCurrentISOString(),
            updatedAt: getCurrentISOString(),
            version: sql`${trips.version} + 1`, // version 증가
          })
          .where(eq(trips.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('trips', id, 'DELETE', null);
      });

      console.log(`✅ Trip deleted locally (soft): ${id}`);

      return { id };
    },
    onSuccess: () => {
      // 캐시 무효화 - 여행 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all(),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete trip:', error);
    },
  });
};
