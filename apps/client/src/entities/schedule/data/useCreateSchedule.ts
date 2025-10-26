import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, schedules } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { generateId } from '@/shared/services/id/ulid';
import type { CreateScheduleRequest } from '../model';
import { scheduleQueryKeys } from './useGetSchedules';

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
      const id = generateId(); // ✅ Echo 아키텍처: 클라이언트에서 ID 생성
      const now = getCurrentISOString();

      // 사용자 ID (현재는 테스트용 고정값, 추후 인증 구현 시 실제 userId 사용)
      const userId = data.userId || '01HZQ8K9X7M2N3P4Q5R6S7T8V9';

      // 로컬 DB에 저장할 데이터 준비 (모두 ISO string)
      const newSchedule = {
        id,
        userId,
        tripId: data.tripId,
        title: data.title,
        location: data.location,
        address: data.address || null,
        scheduledAt: data.scheduledAt, // ✅ ISO string
        latitude: data.latitude?.toString() || null,
        longitude: data.longitude?.toString() || null,
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
          tripId: data.tripId,
          title: data.title,
          location: data.location,
          address: data.address,
          scheduledAt: data.scheduledAt,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      });

      console.log(`✅ Schedule created locally: ${id} - ${data.title}`);

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
