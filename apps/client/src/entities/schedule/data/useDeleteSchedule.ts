import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { scheduleQueryKeys } from './keys';
import { routeChildMutation } from '@/shared/services/offline-prep/router';
import axios from '@/shared/api/fetcher';

/**
 * 일정 삭제 Mutation Hook (Soft Delete)
 *
 * - 활성화된 여행: 로컬 DB Soft Delete + sync_queue
 * - 비활성 여행: 서버 직접 호출 (오프라인시 에러)
 *
 * ✅ Soft Delete: deletedAt 필드를 현재 시간으로 설정
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
      // 1. schedule 조회하여 tripId 확인
      const schedule = await db.select().from(schedules).where(eq(schedules.id, id)).get();

      if (!schedule) {
        throw new Error(`Schedule not found: ${id}`);
      }

      const tripId = schedule.tripId;
      const deletedAt = getCurrentISOString();

      // 2. 라우팅 레이어 적용
      return await routeChildMutation(tripId, {
        // 로컬: 활성화된 여행
        local: async () => {
          await withTransaction(async () => {
            // Soft Delete (deletedAt 설정)
            await db
              .update(schedules)
              .set({
                deletedAt,
                updatedAt: deletedAt,
                version: sql`${schedules.version} + 1`, // version 증가
              })
              .where(eq(schedules.id, id));

            // sync_queue에 기록 (서버 Push 대기)
            await addToSyncQueue('schedules', id, 'DELETE', null);
          });

          console.log(`✅ Schedule deleted locally (soft): ${id}`);
          return { id };
        },

        // 원격: 비활성 여행
        remote: async () => {
          await axios.delete(`/schedules/${id}`);

          console.log(`✅ Schedule deleted on server: ${id}`);
          return { id };
        },
      });
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
