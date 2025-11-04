import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import type { CreateScheduleRequest } from '../model';
import { scheduleQueryKeys } from './keys';

/**
 * 일정 생성 Mutation Hook (Local-First)
 *
 * 로컬 DB 우선 저장 후, sync_queue에 기록
 * 네트워크 상태와 무관하게 즉시 저장됨
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateSchedule();
 * mutate({
 *   tripId: 'trip-id',
 *   title: 'Eiffel Tower Visit',
 *   location: 'Eiffel Tower',
 *   scheduledAt: '2024-03-15T09:00:00+09:00',
 * });
 * ```
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleRequest) => {
      // ✅ Echo Protocol: Use client-provided ID
      const { id, ...rest } = data;
      const now = getCurrentISOString();

      // 사용자 ID (현재는 테스트용 고정값, 추후 인증 구현 시 실제 userId 사용)
      const userId = rest.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

      // 로컬 DB에 저장할 데이터 준비 (모두 ISO string)
      const newSchedule = {
        id, // ✅ Use provided ID
        userId,
        tripId: rest.tripId,
        title: rest.title,
        location: rest.location,
        address: rest.address || null,
        scheduledAt: rest.scheduledAt, // ✅ ISO string
        latitude: rest.latitude?.toString() || null,
        longitude: rest.longitude?.toString() || null,
        createdAt: now, // ✅ ISO string
        updatedAt: now, // ✅ ISO string
        deletedAt: null,
        version: 1,
      };

      // 트랜잭션: 로컬 DB 저장 + sync_queue 기록
      await withTransaction(async () => {
        // 1. 로컬 DB에 저장
        await db.insert(schedules).values(newSchedule);

        // 2. sync_queue에 기록 (서버 Push 대기)
        await addToSyncQueue('schedules', id, 'CREATE', {
          id,
          userId,
          tripId: rest.tripId,
          title: rest.title,
          location: rest.location,
          address: rest.address,
          scheduledAt: rest.scheduledAt,
          latitude: rest.latitude,
          longitude: rest.longitude,
        });
      });

      console.log(`✅ Schedule created locally: ${id} - ${rest.title}`);

      return newSchedule;
    },
    onSuccess: (_, variables) => {
      // 캐시 무효화 - 해당 여행의 일정 목록 다시 조회
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.list(variables.tripId),
      });
    },
    onError: (error) => {
      console.error('❌ Failed to create schedule:', error);
    },
  });
};
