import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { routeChildMutation } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';
import type { UpdateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 수정 Mutation Hook (Router 적용)
 *
 * 활성화 여부에 따라 로컬/서버 분기:
 * - 활성화된 Trip: 로컬 DB 수정 + sync_queue
 * - 비활성 Trip: 서버 직접 수정
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
      // Router를 통한 Trip 수정 (해당 Trip이 활성화되어 있으면 local, 아니면 remote)
      return await routeChildMutation(id, {
        local: async () => {
          // 활성화된 Trip → 로컬 DB 수정 + sync_queue
          await withTransaction(async () => {
            await db.update(trips).set({ ...data, updatedAt: getCurrentISOString(), version: sql`${trips.version} + 1` }).where(eq(trips.id, id));
            await addToSyncQueue('trips', id, 'UPDATE', data);
          });
          console.log(`✅ Trip updated locally: ${id}`);
          return { id, ...data };
        },
        remote: async () => {
          // 비활성 Trip → 서버 직접 수정
          const response = await axios.put(`/api/trips/${id}`, data);
          console.log(`✅ Trip updated on server: ${id}`);
          return response.data.data;
        },
      });
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
