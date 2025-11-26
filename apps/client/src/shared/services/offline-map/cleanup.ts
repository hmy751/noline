/**
 * Offline Map Cleanup Service
 * 여행 종료 후 7일이 지난 오프라인 지도 자동 삭제
 */

import MapboxGL from '@rnmapbox/maps';
import { eq, and, isNull, lt } from 'drizzle-orm';
import { db } from '@/shared/db';
import { trips, offlineCities } from '@/shared/db/schema';
import { queryClient } from '@/shared/lib/queryClient';
import { offlineCityKeys } from '@/entities/offline-city/data/keys';

/**
 * 오프라인 지도 자동 정리
 *
 * 동작:
 * 1. 모든 여행 조회
 * 2. 종료일 + 7일 지난 여행 필터링
 * 3. 해당 여행들의 cityId로 참조 카운트 감소
 * 4. 참조 카운트가 0이 되면 Mapbox 팩 및 DB 레코드 삭제
 */
export async function cleanupExpiredOfflineMaps(): Promise<void> {
  try {
    console.log('[OfflineMapCleanup] Starting cleanup...');

    // 1. 모든 활성 여행 조회 (soft delete 제외)
    const allTrips = await db.select().from(trips).where(isNull(trips.deletedAt)).all();

    console.log(`[OfflineMapCleanup] Found ${allTrips.length} active trips`);

    // 2. 종료일 + 7일 지난 여행 필터링
    const now = new Date();
    const expiredTrips = allTrips.filter((trip) => {
      if (!trip.endDate) return false;

      const endDate = new Date(trip.endDate);
      const expiryDate = new Date(endDate);
      expiryDate.setDate(expiryDate.getDate() + 7); // +7일

      return now > expiryDate;
    });

    console.log(`[OfflineMapCleanup] Found ${expiredTrips.length} expired trips`);

    if (expiredTrips.length === 0) {
      console.log('[OfflineMapCleanup] No expired trips to clean up');
      return;
    }

    // 3. 각 여행의 cityId에 대해 참조 카운트 감소
    const cityIdsToDecrement = new Set<number>();

    for (const trip of expiredTrips) {
      if (trip.cityId) {
        cityIdsToDecrement.add(trip.cityId);
      }
    }

    console.log(`[OfflineMapCleanup] Cities to check: ${Array.from(cityIdsToDecrement).join(', ')}`);

    // 4. 각 cityId에 대해 참조 카운트 감소 및 삭제 처리
    for (const cityId of cityIdsToDecrement) {
      await decrementCityReference(cityId);
    }

    console.log('[OfflineMapCleanup] Cleanup completed');
  } catch (error) {
    console.error('[OfflineMapCleanup] Error during cleanup:', error);
  }
}

/**
 * 특정 cityId의 참조 카운트 감소 및 삭제
 */
async function decrementCityReference(cityId: number): Promise<void> {
  const offlineCity = await db.select().from(offlineCities).where(eq(offlineCities.cityId, cityId)).get();

  if (!offlineCity) {
    console.log(`[OfflineMapCleanup] City ${cityId} not found in offline cities`);
    return;
  }

  // 해당 cityId를 사용하는 활성 여행 개수 확인
  const activeTripsWithCity = await db
    .select()
    .from(trips)
    .where(and(eq(trips.cityId, cityId), isNull(trips.deletedAt)))
    .all();

  // 종료일 + 7일 이내인 여행만 카운트
  const now = new Date();
  const activeCount = activeTripsWithCity.filter((trip) => {
    if (!trip.endDate) return true; // 종료일 없으면 활성으로 간주

    const endDate = new Date(trip.endDate);
    const expiryDate = new Date(endDate);
    expiryDate.setDate(expiryDate.getDate() + 7);

    return now <= expiryDate; // 아직 만료 안됨
  }).length;

  console.log(`[OfflineMapCleanup] City ${offlineCity.cityName} (${cityId}): ${activeCount} active trips`);

  if (activeCount === 0) {
    // 참조하는 여행이 없으면 삭제
    try {
      // Mapbox 오프라인 팩 삭제는 useDecrementOfflineCityReference에서 처리됨
      // 여기서는 DB만 삭제
      await db.delete(offlineCities).where(eq(offlineCities.cityId, cityId)).run();

      // ✅ UI 갱신 요청
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });

      console.log(`[OfflineMapCleanup] ✅ Deleted offline map for ${offlineCity.cityName} (${cityId})`);
    } catch (error) {
      console.error(`[OfflineMapCleanup] ❌ Failed to delete city ${cityId}:`, error);
    }
  } else {
    // 참조 카운트 업데이트
    await db
      .update(offlineCities)
      .set({
        referenceCount: activeCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(offlineCities.cityId, cityId))
      .run();

    console.log(`[OfflineMapCleanup] Updated reference count for ${offlineCity.cityName}: ${activeCount}`);
  }
}

/**
 * 특정 여행의 오프라인 지도 즉시 정리
 * (여행 비활성화시 사용)
 *
 * @param tripId - 여행 ID
 * @returns Promise<void>
 */
export async function cleanupOfflineMapForTrip(tripId: string): Promise<void> {
  console.log(`🗑️ Starting offline map cleanup for trip: ${tripId}`);

  // 1. Trip의 cityId 조회
  const trip = await db
    .select({
      cityId: trips.cityId,
    })
    .from(trips)
    .where(eq(trips.id, tripId))
    .get();

  if (!trip?.cityId) {
    console.log(`⚠️ Trip has no cityId, skipping map cleanup: ${tripId}`);
    return;
  }

  // 2. offlineCities에서 해당 도시 조회
  const offlineCity = await db.select().from(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).get();

  if (!offlineCity) {
    console.log(`⚠️ No offline map found for city: ${trip.cityId}`);
    return;
  }

  // 3. 참조 카운트 감소
  const newReferenceCount = offlineCity.referenceCount - 1;

  if (newReferenceCount > 0) {
    // 아직 다른 여행이 참조 중 - 카운트만 감소
    await db
      .update(offlineCities)
      .set({
        referenceCount: newReferenceCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(offlineCities.cityId, trip.cityId))
      .run();

    console.log(
      `✅ Offline map reference count decreased: ${trip.cityId} (${offlineCity.referenceCount} -> ${newReferenceCount})`,
    );
    return;
  }

  // 4. 참조 카운트가 0이 되면 완전 삭제
  try {
    // 4-1. Mapbox 네이티브 팩 삭제
    const regionName = offlineCity.mapboxRegionName;
    if (regionName) {
      const existingPacks = await MapboxGL.offlineManager.getPacks();
      const pack = existingPacks.find((p) => p.name === regionName);

      if (pack) {
        await MapboxGL.offlineManager.deletePack(regionName);
        console.log(`🗑️ Deleted Mapbox native pack: ${regionName}`);
      } else {
        console.log(`⚠️ Mapbox pack not found (may already be deleted): ${regionName}`);
      }
    }

    // 4-2. DB에서 삭제
    await db.delete(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).run();

    // ✅ UI 갱신 요청
    queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });

    console.log(`✅ Offline map completely removed: ${trip.cityId}`);
  } catch (error) {
    console.error(`❌ Failed to delete offline map:`, error);
    // 에러가 나도 계속 진행 (이미 삭제되었거나 다른 이유로 실패할 수 있음)
  }
}
