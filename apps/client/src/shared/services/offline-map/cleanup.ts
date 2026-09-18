/**
 * Offline Map Cleanup Service
 * 여행 종료 후 7일이 지난 오프라인 지도 자동 삭제
 */

import MapboxGL from '@rnmapbox/maps';
import { eq, and, isNull } from 'drizzle-orm';
import { getDatabase } from '@/shared/db';
import { trips, offlineCities } from '@/shared/db/schema';
import { queryClient } from '@/shared/lib/queryClient';
import { offlineCityKeys } from '@/entities/offline-city/data/keys';
import { TRIP_ACTIVATION_GRACE_DAYS } from '@/shared/lib/lifecycle';

/** 종료 유예 기간이 지난 여행의 도시 참조를 다시 계산한다. */
export async function cleanupExpiredOfflineMaps(): Promise<void> {
  try {
    console.log('[OfflineMapCleanup] Starting cleanup...');

    // 삭제되지 않은 여행 조회
    const nonDeletedTrips = await getDatabase().select().from(trips).where(isNull(trips.deletedAt)).all();

    console.log(`[OfflineMapCleanup] Found ${nonDeletedTrips.length} non-deleted trips`);

    // 종료일 + 7일 지난 여행 필터링
    const now = new Date();
    const expiredTrips = nonDeletedTrips.filter((trip) => {
      if (!trip.endDate) {
        return false;
      }

      const endDate = new Date(trip.endDate);
      const expiryDate = new Date(endDate);
      expiryDate.setDate(expiryDate.getDate() + TRIP_ACTIVATION_GRACE_DAYS);

      return now > expiryDate;
    });

    console.log(`[OfflineMapCleanup] Found ${expiredTrips.length} expired trips`);

    if (expiredTrips.length === 0) {
      console.log('[OfflineMapCleanup] No expired trips to clean up');
      return;
    }

    // 정리가 필요한 도시 수집
    const cityIdsToReconcile = new Set<number>();

    for (const trip of expiredTrips) {
      if (trip.cityId) {
        cityIdsToReconcile.add(trip.cityId);
      }
    }

    console.log(`[OfflineMapCleanup] Cities to check: ${Array.from(cityIdsToReconcile).join(', ')}`);

    // 도시별 참조 카운트 재계산 및 삭제 처리
    for (const cityId of cityIdsToReconcile) {
      await reconcileCityReferenceCount(cityId);
    }

    console.log('[OfflineMapCleanup] Cleanup completed');
  } catch (error) {
    console.error('[OfflineMapCleanup] Error during cleanup:', error);
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
  console.log(`[OfflineMapCleanup] Starting offline map cleanup for trip: ${tripId}`);

  // Trip의 cityId 조회
  const trip = await getDatabase()
    .select({
      cityId: trips.cityId,
    })
    .from(trips)
    .where(eq(trips.id, tripId))
    .get();

  if (!trip?.cityId) {
    console.log(`[OfflineMapCleanup] Trip has no cityId, skipping map cleanup: ${tripId}`);
    return;
  }

  // offlineCities에서 해당 도시 조회
  const offlineCity = await getDatabase()
    .select()
    .from(offlineCities)
    .where(eq(offlineCities.cityId, trip.cityId))
    .get();

  if (!offlineCity) {
    console.log(`[OfflineMapCleanup] No offline map found for city: ${trip.cityId}`);
    return;
  }

  // 참조 카운트 감소
  const newReferenceCount = offlineCity.referenceCount - 1;

  if (newReferenceCount > 0) {
    // 아직 다른 여행이 참조 중 - 카운트만 감소
    await getDatabase()
      .update(offlineCities)
      .set({
        referenceCount: newReferenceCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(offlineCities.cityId, trip.cityId))
      .run();

    console.log(
      `[OfflineMapCleanup] Offline map reference count decreased: ${trip.cityId} (${offlineCity.referenceCount} -> ${newReferenceCount})`,
    );
    return;
  }

  // 참조 카운트가 0이 되면 완전 삭제
  try {
    // Mapbox 네이티브 팩 삭제
    const regionName = offlineCity.mapboxRegionName;
    if (regionName) {
      const existingPacks = await MapboxGL.offlineManager.getPacks();
      const pack = existingPacks.find((p) => p.name === regionName);

      if (pack) {
        await MapboxGL.offlineManager.deletePack(regionName);
        console.log(`[OfflineMapCleanup] Deleted Mapbox native pack: ${regionName}`);
      } else {
        console.log(`[OfflineMapCleanup] Mapbox pack not found (may already be deleted): ${regionName}`);
      }
    }

    // DB에서 삭제
    await getDatabase().delete(offlineCities).where(eq(offlineCities.cityId, trip.cityId)).run();

    // 캐시 재조회 요청
    queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });

    console.log(`[OfflineMapCleanup] Offline map completely removed: ${trip.cityId}`);
  } catch (error) {
    console.error(`[OfflineMapCleanup] Failed to delete offline map:`, error);
    // 에러가 나도 계속 진행 (이미 삭제되었거나 다른 이유로 실패할 수 있음)
  }
}

/**
 * 도시를 참조하는 미만료 여행 수로 참조 카운트를 다시 계산한다.
 */
async function reconcileCityReferenceCount(cityId: number): Promise<void> {
  const offlineCity = await getDatabase().select().from(offlineCities).where(eq(offlineCities.cityId, cityId)).get();

  if (!offlineCity) {
    console.log(`[OfflineMapCleanup] City ${cityId} not found in offline cities`);
    return;
  }

  // 해당 도시를 사용하는 삭제되지 않은 여행 조회
  const tripsUsingCity = await getDatabase()
    .select()
    .from(trips)
    .where(and(eq(trips.cityId, cityId), isNull(trips.deletedAt)))
    .all();

  // 종료일 + 7일 이내인 여행만 카운트
  const now = new Date();
  const referenceCount = tripsUsingCity.filter((trip) => {
    if (!trip.endDate) {
      return true; // 종료일이 없으면 지도 참조 유지
    }

    const endDate = new Date(trip.endDate);
    const expiryDate = new Date(endDate);
    expiryDate.setDate(expiryDate.getDate() + TRIP_ACTIVATION_GRACE_DAYS);

    return now <= expiryDate; // 아직 만료 안됨
  }).length;

  console.log(
    `[OfflineMapCleanup] City ${offlineCity.cityName} (${cityId}): ${referenceCount} trips retaining the map`,
  );

  if (referenceCount === 0) {
    // 참조하는 여행이 없으면 삭제
    try {
      // 이 만료 정리 경로는 DB 레코드만 삭제한다.
      await getDatabase().delete(offlineCities).where(eq(offlineCities.cityId, cityId)).run();

      // 캐시 재조회 요청
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });

      console.log(`[OfflineMapCleanup] Deleted offline city record for ${offlineCity.cityName} (${cityId})`);
    } catch (error) {
      console.error(`[OfflineMapCleanup] Failed to delete city ${cityId}:`, error);
    }
  } else {
    // 참조 카운트 업데이트
    await getDatabase()
      .update(offlineCities)
      .set({
        referenceCount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(offlineCities.cityId, cityId))
      .run();

    console.log(`[OfflineMapCleanup] Updated reference count for ${offlineCity.cityName}: ${referenceCount}`);
  }
}
