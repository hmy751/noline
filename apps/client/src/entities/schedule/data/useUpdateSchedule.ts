import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { eq, sql } from 'drizzle-orm';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { scheduleQueryKeys } from './keys';
import { routeChildMutation } from '@/shared/services/offline-prep/router';
import apiClient from '@/shared/api/fetcher';

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
 * 일정 수정 Mutation Hook (라우팅 레이어 적용)
 *
 * - 활성화된 여행: 로컬 DB 업데이트 + sync_queue 기록
 * - 비활성 여행: 서버 API 직접 호출
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
      // 1. 일정의 tripId 조회 (라우팅을 위해 필요)
      const schedule = await db.select({ tripId: schedules.tripId }).from(schedules).where(eq(schedules.id, id)).get();

      if (!schedule) {
        throw new Error(`Schedule not found: ${id}`);
      }

      return await routeChildMutation(schedule.tripId, {
        // 로컬: 로컬 DB 업데이트 + sync_queue 기록
        local: async () => {
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
            // 서버 전송용 데이터 준비 (latitude/longitude를 number로 변환)
            const syncData = {
              ...data,
              latitude: data.latitude ? parseFloat(data.latitude) : null,
              longitude: data.longitude ? parseFloat(data.longitude) : null,
            };
            await addToSyncQueue('schedules', id, 'UPDATE', syncData);
          });

          console.log(`✅ Schedule updated locally: ${id}`);

          return { id, ...data };
        },

        // 원격: 서버 API 직접 호출
        remote: async () => {
          // 서버 전송용 데이터 준비 (latitude/longitude를 number로 변환)
          const serverData = {
            ...data,
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null,
          };
          const response = await apiClient.put(`/api/schedules/${id}`, serverData);
          console.log(`✅ Schedule updated on server: ${id}`);
          return response.data.data;
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
      console.error('❌ Failed to update schedule:', error);
    },
  });
};
