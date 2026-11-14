/**
 * Offline Map Cleanup Service
 * 여행 종료 후 7일이 지난 오프라인 지도 자동 삭제
 */

import MapboxGL from '@rnmapbox/maps';
import { eq, and, isNull } from 'drizzle-orm';
import { getDatabase, runDatabaseTransaction, tripActivations } from '@/shared/db';
import { trips, offlineCities } from '@/shared/db/schema';
import { queryClient } from '@/shared/lib/queryClient';
import { offlineCityKeys } from '@/entities/offline-city/data/keys';
import { isTripExpired } from '@/shared/lib/lifecycle';

import { countCityMapHolders, withCityMapOperation } from './city-sharing';

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

      return isTripExpired(trip, now);
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

/** 마지막 보유 여행이 반납했을 때 도시 파일과 등록 정보를 정리한다. */
async function removeUnclaimedPack(cityId: number): Promise<void> {
  const db = getDatabase();
  const city = db.select().from(offlineCities).where(eq(offlineCities.cityId, cityId)).get();
  if (!city || city.referenceCount !== 0 || countCityMapHolders(cityId) !== 0) return;

  if (city.mapboxRegionName) {
    const packs = await MapboxGL.offlineManager.getPacks();
    if (packs.some((pack) => pack.name === city.mapboxRegionName)) {
      await MapboxGL.offlineManager.deletePack(city.mapboxRegionName);
    }
  }
  await runDatabaseTransaction(async () => {
    db.delete(offlineCities)
      .where(and(eq(offlineCities.cityId, cityId), eq(offlineCities.referenceCount, 0)))
      .run();
  });
}

/** 비활성화한 여행의 지도 보유 표시만 반납한다. 같은 도시의 다른 여행은 그대로 둔다. */
export async function cleanupOfflineMapForTrip(tripId: string): Promise<void> {
  const db = getDatabase();
  const trip = db
    .select({ cityId: trips.cityId, preparationId: tripActivations.id })
    .from(trips)
    .innerJoin(tripActivations, eq(tripActivations.tripId, trips.id))
    .where(eq(trips.id, tripId))
    .get();
  if (!trip?.cityId) return;
  const cityId = trip.cityId;
  await withCityMapOperation(cityId, async () => {
    const released = await runDatabaseTransaction(async () => {
      const preparation = and(
        eq(tripActivations.id, trip.preparationId),
        eq(tripActivations.tripId, tripId),
        eq(tripActivations.isActivated, false),
        eq(tripActivations.cleanupPending, false),
      );
      const activation = db
        .select({ held: tripActivations.mapDownloaded })
        .from(tripActivations)
        .innerJoin(trips, eq(trips.id, tripActivations.tripId))
        .where(and(preparation, eq(trips.cityId, cityId)))
        .get();
      if (!activation?.held) return false;
      const now = new Date().toISOString();
      db.update(tripActivations).set({ mapDownloaded: false, updatedAt: now }).where(preparation).run();
      db.update(offlineCities)
        .set({ referenceCount: countCityMapHolders(cityId), updatedAt: now })
        .where(eq(offlineCities.cityId, cityId))
        .run();
      return true;
    });
    if (released) {
      await removeUnclaimedPack(cityId);
      queryClient.invalidateQueries({ queryKey: offlineCityKeys.all() });
    }
  });
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

    return !isTripExpired(trip, now);
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
