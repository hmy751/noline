import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { scheduleQueryKeys } from './keys';

/**
 * 일정 수정 요청 데이터 타입
 */
export type UpdateScheduleRequest = {
  title?: string;
  scheduledAt?: string; // ISO string
  location?: string;
  latitude?: string;
  longitude?: string;
  memo?: string;
};

/**
 * 일정 수정 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 업데이트 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 업데이트됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useUpdateSchedule();
 * mutate({
 *   id: 'schedule-id',
 *   data: {
 *     title: 'Updated Schedule',
 *     scheduledAt: '2024-03-15T14:30:00.000Z',
 *   },
 * });
 * ```
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleRequest }) => {
      // 트랜잭션: 로컬 DB 업데이트 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB 업데이트
        await db
          .update(schedules)
          .set({
            ...data,
            updatedAt: getCurrentISOString(),
            version: sql`${schedules.version} + 1`, // version 증가
          })
          .where(eq(schedules.id, id));

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('schedules', id, 'UPDATE', data);
      });

      console.log(`✅ Schedule updated locally: ${id}`);

      return { id, ...data };
    },
    onSuccess: () => {
      // 캐시 무효화 - 일정 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.base,
      });
    },
    onError: (error) => {
      console.error('❌ Failed to update schedule:', error);
    },
  });
};
