import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, trips } from '@/shared/db';
import { withTransaction, getCurrentISOString } from '@/shared/db/utils';
import { addToSyncQueue } from '@/shared/services/sync/queue';
import { routeTripMutation } from '@/shared/services/offline-prep/router';
import apiClient from '@/shared/api/fetcher';
import type { CreateTripRequest } from '../model';
import { tripQueryKeys } from './keys';

/**
 * 여행 생성 Mutation Hook (Router 적용)
 *
 * 활성화 여부에 따라 로컬/서버 분기:
 * - 활성화된 Trip 있음: 로컬 DB 저장 + sync_queue
 * - 비활성 상태: 서버 직접 생성
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTrip();
 * mutate({
 *   id: ulid(), // Echo Protocol: 외부에서 ID 생성
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
        baseCurrency: data.baseCurrency || 'USD',
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

      // Router를 통한 Trip 생성 (활성화된 Trip이 있으면 local, 없으면 remote)
      return await routeTripMutation({
        local: async () => {
          // 활성화된 Trip 있음 → 로컬 DB 저장 + sync_queue
          await withTransaction(async () => {
            await db.insert(trips).values(newTrip);
            await addToSyncQueue('trips', id, 'CREATE', {
              id,
              userId,
              name: data.name,
              destination: data.destination,
              country: data.country,
              baseCurrency: data.baseCurrency,
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
        remote: async () => {
          // 비활성 상태 → 서버 직접 생성
          const response = await apiClient.post('/api/trips', {
            id,
            userId,
            name: data.name,
            destination: data.destination,
            country: data.country,
            baseCurrency: data.baseCurrency,
            latitude: data.latitude,
            longitude: data.longitude,
            cityId: data.cityId,
            startDate: data.startDate,
            endDate: data.endDate,
          });
          console.log(`✅ Trip created on server: ${id} - ${data.name}`);
          return response.data.data;
        },
      });
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
