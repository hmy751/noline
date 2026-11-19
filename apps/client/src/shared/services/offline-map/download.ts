import MapboxGL from '@rnmapbox/maps';
import { and, eq, isNull } from 'drizzle-orm';

import { getDatabase, offlineCities, runDatabaseTransaction, trips, tripActivations } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/shared/store/auth';

import { countCityMapHolders, withCityMapOperation } from './city-sharing';

/** 활성 여행이 도시 지도를 확보한다. 같은 준비의 재시도는 보유 여행 수를 늘리지 않는다. */
export async function downloadOfflineMapInBackground(tripId: string): Promise<void> {
  const { sessionId, userId } = useAuthStore.getState();
  if (!userId || !sessionId) return;

  const db = getDatabase();
  const trip = db
    .select({
      preparationId: tripActivations.id,
      cityId: trips.cityId,
      destination: trips.destination,
      latitude: trips.latitude,
      longitude: trips.longitude,
      country: trips.country,
    })
    .from(trips)
    .innerJoin(tripActivations, eq(tripActivations.tripId, trips.id))
    .where(
      and(
        eq(trips.id, tripId),
        eq(trips.userId, userId),
        eq(tripActivations.isActivated, true),
        isNull(trips.deletedAt),
      ),
    )
    .get();
  if (!trip) return;
  const { cityId, latitude, longitude } = trip;
  if (!cityId || !latitude || !longitude) throw new Error('Trip에 도시 정보가 없습니다.');

  const preparation = and(
    eq(tripActivations.id, trip.preparationId),
    eq(tripActivations.tripId, tripId),
    eq(tripActivations.userId, userId),
    eq(tripActivations.isActivated, true),
  );
  const isCurrent = () =>
    useAuthStore.getState().sessionId === sessionId &&
    !!db
      .select({ id: trips.id })
      .from(tripActivations)
      .innerJoin(trips, eq(tripActivations.tripId, trips.id))
      .where(and(preparation, eq(trips.cityId, cityId), isNull(trips.deletedAt)))
      .get();

  await withCityMapOperation(cityId, async () => {
    if (!isCurrent()) return;
    const regionName = `offline_city_${cityId}`;
    const styleURL = 'mapbox://styles/mapbox/streets-v11';
    const minZoom = 10;
    const maxZoom = 16;
    const findPack = async () => (await MapboxGL.offlineManager.getPacks()).find((pack) => pack.name === regionName);
    let pack = await findPack();
    const needsPack = !pack;
    if (!pack) {
      if (!isCurrent()) return;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const bounds: [[number, number], [number, number]] = [
        [lng - 0.09, lat - 0.09],
        [lng + 0.09, lat + 0.09],
      ];
      let lastProgress = 0;
      await MapboxGL.offlineManager.createPack(
        { name: regionName, styleURL, bounds, minZoom, maxZoom },
        async (_region, status) => {
          // native Mapbox v11(rnmapbox 10.3)은 받을 양을 아직 모를 때 percentage를 null로 보낸다. 진행률만 건너뛴다.
          if (status.percentage === null) return;
          const percentage = Math.round(status.percentage);
          if (percentage < lastProgress + 10 && percentage !== 100) return;
          lastProgress = percentage;
          try {
            await runDatabaseTransaction(async () => {
              if (isCurrent()) {
                db.update(tripActivations)
                  .set({ syncProgress: percentage, updatedAt: new Date().toISOString() })
                  .where(preparation)
                  .run();
              }
            });
            queryClient.invalidateQueries({ queryKey: ['trip'] });
          } catch (error) {
            console.error('[OfflineMapDownload] Failed to update progress:', error);
          }
        },
        (_region, error) => console.error('[OfflineMapDownload] Mapbox download failed:', error),
      );
      pack = await findPack();
      if (!pack) throw new Error('다운로드된 오프라인 팩을 찾을 수 없습니다.');
    }

    const sizeBytes = 'size' in pack && typeof pack.size === 'number' ? pack.size : 0;
    const tileCount = 'tileCount' in pack && typeof pack.tileCount === 'number' ? pack.tileCount : null;
    const registered = await runDatabaseTransaction(async () => {
      if (!isCurrent()) return false;
      const now = new Date().toISOString();
      db.update(tripActivations).set({ mapDownloaded: true, updatedAt: now }).where(preparation).run();
      const referenceCount = countCityMapHolders(cityId);
      db.insert(offlineCities)
        .values({
          cityId,
          cityName: trip.destination,
          country: trip.country,
          centerLatitude: latitude,
          centerLongitude: longitude,
          radiusKm: 10,
          downloadedAt: now,
          sizeBytes,
          tileCount,
          referenceCount,
          mapboxRegionName: regionName,
          styleUrl: styleURL,
          minZoom,
          maxZoom,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({ target: offlineCities.cityId, set: { referenceCount, updatedAt: now } })
        .run();
      return true;
    });

    if (!registered && needsPack && countCityMapHolders(cityId) === 0) {
      await MapboxGL.offlineManager.deletePack(regionName);
    }
    if (registered) {
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      queryClient.invalidateQueries({ queryKey: ['offline-city'] });
    }
  });
}
