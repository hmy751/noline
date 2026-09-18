/**
 * useManageOfflineCityReference
 * 오프라인 지도 참조 카운트 관리 및 삭제
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import MapboxGL from '@rnmapbox/maps';

import { getDatabase } from '@/shared/db';
import { offlineCities } from '@/shared/db/schema';

import { offlineCityKeys } from './keys';

interface DecrementReferenceParams {
  cityId: number;
}

/**
 * 참조 카운트 감소 및 자동 삭제
 *
 * 동작:
 * 1. referenceCount를 1 감소
 * 2. 0이 되면 Mapbox 오프라인 팩 삭제
 * 3. DB에서 레코드 삭제
 */
export function useDecrementOfflineCityReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cityId }: DecrementReferenceParams) => {
      // 현재 참조 카운트 조회
      const offlineCity = await getDatabase()
        .select()
        .from(offlineCities)
        .where(eq(offlineCities.cityId, cityId))
        .get();

      if (!offlineCity) {
        console.warn(`[OfflineCity] City ${cityId} not found`);
        return;
      }

      const newReferenceCount = offlineCity.referenceCount - 1;

      // 참조 카운트가 0이 되면 삭제
      if (newReferenceCount <= 0) {
        // Mapbox 오프라인 팩 삭제
        if (offlineCity.mapboxRegionName) {
          try {
            const packs = await MapboxGL.offlineManager.getPacks();
            const pack = packs.find((p) => p.name === offlineCity.mapboxRegionName);

            if (pack) {
              await MapboxGL.offlineManager.deletePack(offlineCity.mapboxRegionName);
              console.log(`[OfflineCity] Deleted Mapbox pack: ${offlineCity.mapboxRegionName}`);
            }
          } catch (error) {
            console.error('[OfflineCity] Failed to delete Mapbox pack:', error);
            // Mapbox 삭제 실패해도 DB는 삭제 진행
          }
        }

        // DB에서 삭제
        await getDatabase().delete(offlineCities).where(eq(offlineCities.cityId, cityId)).run();

        console.log(`[OfflineCity] Deleted offline city: ${offlineCity.cityName} (${cityId})`);
      } else {
        // 참조 카운트만 감소
        await getDatabase()
          .update(offlineCities)
          .set({
            referenceCount: newReferenceCount,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(offlineCities.cityId, cityId))
          .run();

        console.log(`[OfflineCity] Decremented reference count for city ${cityId}: ${newReferenceCount}`);
      }
    },
    onSuccess: () => {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });
    },
    onError: (error) => {
      console.error('[OfflineCity] Error:', error);
    },
  });
}
