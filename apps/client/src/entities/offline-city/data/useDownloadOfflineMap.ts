/**
 * useDownloadOfflineMap Mutation
 * Mapbox 오프라인 지도 다운로드 및 참조 카운트 관리
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadOfflineMapInBackground } from '@/shared/services/offline-map/download';
import { offlineCityKeys } from './keys';

interface DownloadOfflineMapParams {
  tripId: string;
}

/**
 * 오프라인 지도 다운로드 Mutation (React Hook 버전)
 *
 * - 내부적으로 downloadOfflineMapInBackground 헬퍼 함수 사용
 * - React Query 캐시 무효화 처리
 * - tripActivations.mapDownloaded 플래그 자동 업데이트 ✅
 *
 * @example
 * ```tsx
 * const { mutate: downloadMap, isPending } = useDownloadOfflineMap();
 * downloadMap({ tripId: 'trip-id' });
 * ```
 */
export function useDownloadOfflineMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId }: DownloadOfflineMapParams) => {
      // 헬퍼 함수에 위임 (tripActivations.mapDownloaded 자동 업데이트 포함)
      await downloadOfflineMapInBackground(tripId);
    },
    onSuccess: (_, variables) => {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.byTrip(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });
    },
    onError: (error) => {
      console.error('[useDownloadOfflineMap] Error:', error);
    },
  });
}
