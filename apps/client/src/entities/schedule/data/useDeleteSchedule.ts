import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { scheduleQueryKeys } from './keys';

/**
 * 일정 삭제 Mutation Hook (Local-First)
 *
 * Soft Delete: deletedAt 설정 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 삭제됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteSchedule();
 * mutate('schedule-id');
 * ```
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // 트랜잭션: Soft Delete + sync_queue 기록
      await withTransaction(async () => {
        // 1. Soft Delete (deletedAt 설정)
        await db
          .update(schedules)
          .set({
            deletedAt: getCurrentISOString(),
            updatedAt: getCurrentISOString(),
            version: sql`${schedules.version} + 1`, // version 증가
          })
          .where(eq(schedules.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('schedules', id, 'DELETE', null);
      });

      console.log(`✅ Schedule deleted locally (soft): ${id}`);

      return { id };
    },
    onSuccess: () => {
      // 캐시 무효화 - 일정 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to delete schedule:', error);
    },
  });
};
