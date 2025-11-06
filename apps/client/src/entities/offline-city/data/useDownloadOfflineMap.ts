/**
 * useDownloadOfflineMap Mutation
 * Mapbox 오프라인 지도 다운로드 및 참조 카운트 관리
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import MapboxGL from '@rnmapbox/maps';

import { db } from '@/shared/db';
import { offlineCities, trips } from '@/shared/db/schema';
import type { NewOfflineCity } from '@/shared/db/schema';

import { offlineCityKeys } from './keys';

interface DownloadOfflineMapParams {
  tripId: string;
}

interface DownloadProgress {
  percentage: number;
  completedResourceCount: number;
  completedResourceSize: number;
  completedTileCount: number;
  requiredResourceCount: number;
}

/**
 * 오프라인 지도 다운로드 Mutation
 *
 * 동작:
 * 1. Trip의 cityId 조회
 * 2. 이미 다운로드된 지도가 있으면 referenceCount만 증가
 * 3. 없으면 Mapbox OfflineManager로 다운로드 후 DB 저장
 */
export function useDownloadOfflineMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId }: DownloadOfflineMapParams) => {
      // 1. Trip의 cityId, cityName, coordinates 조회
      const trip = await db
        .select({
          cityId: trips.cityId,
          cityName: trips.cityName,
          latitude: trips.latitude,
          longitude: trips.longitude,
          country: trips.country,
        })
        .from(trips)
        .where(eq(trips.id, tripId))
        .get();

      if (!trip?.cityId || !trip.latitude || !trip.longitude) {
        throw new Error('Trip에 도시 정보가 없습니다.');
      }

      // 2. 이미 다운로드된 지도가 있는지 확인
      const existingCity = await db.select().from(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).get();

      if (existingCity) {
        // 이미 있으면 referenceCount만 증가
        await db
          .update(offlineCities)
          .set({
            referenceCount: existingCity.referenceCount + 1,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(offlineCities.cityId, trip.cityId))
          .run();

        return existingCity;
      }

      // 3. 새로 다운로드
      const regionName = `offline_city_${trip.cityId}`;
      const centerLat = parseFloat(trip.latitude);
      const centerLng = parseFloat(trip.longitude);
      const radiusKm = 10;

      // 10km 반경을 위도/경도 차이로 변환 (대략 0.09도 ≈ 10km)
      const latDelta = 0.09;
      const lngDelta = 0.09;

      const bounds: [number, number, number, number] = [
        centerLng - lngDelta, // west
        centerLat - latDelta, // south
        centerLng + lngDelta, // east
        centerLat + latDelta, // north
      ];

      const styleURL = 'mapbox://styles/mapbox/streets-v11';
      const minZoom = 10;
      const maxZoom = 16;

      // Mapbox Offline Pack 생성
      const progressListener = (offlineRegion: any, status: any) => {
        console.log('[OfflineMap] Download progress:', {
          percentage: status.percentage,
          completedTileCount: status.completedTileCount,
        });
      };

      const errorListener = (offlineRegion: any, error: any) => {
        console.error('[OfflineMap] Download error:', error);
        throw new Error(`오프라인 지도 다운로드 실패: ${error.message}`);
      };

      // Mapbox 오프라인 팩 다운로드
      await MapboxGL.offlineManager.createPack(
        {
          name: regionName,
          styleURL,
          bounds,
          minZoom,
          maxZoom,
        },
        progressListener,
        errorListener,
      );

      // 다운로드 완료 후 메타데이터 저장
      const packs = await MapboxGL.offlineManager.getPacks();
      const pack = packs.find((p) => p.name === regionName);

      if (!pack) {
        throw new Error('다운로드된 오프라인 팩을 찾을 수 없습니다.');
      }

      const now = new Date().toISOString();
      const newOfflineCity: NewOfflineCity = {
        cityId: trip.cityId,
        cityName: trip.cityName,
        country: trip.country ?? null,
        centerLatitude: trip.latitude,
        centerLongitude: trip.longitude,
        radiusKm,
        downloadedAt: now,
        sizeBytes: pack.size ?? 0, // Mapbox SDK에서 제공하는 크기
        tileCount: pack.tileCount ?? null,
        referenceCount: 1,
        mapboxRegionName: regionName,
        styleUrl: styleURL,
        minZoom,
        maxZoom,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(offlineCities).values(newOfflineCity).run();

      return newOfflineCity;
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
