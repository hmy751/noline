/**
 * 오프라인 지도 다운로드 헬퍼 함수
 *
 * React Hook을 사용할 수 없는 컨텍스트(mutation callback 등)에서
 * 백그라운드로 지도 다운로드를 시작하기 위한 유틸리티
 */

import MapboxGL from '@rnmapbox/maps';
import { eq } from 'drizzle-orm';
import { db, offlineCities, trips, tripActivations } from '@/shared/db';
import type { NewOfflineCity } from '@/shared/db/schema';

/**
 * 백그라운드로 오프라인 지도 다운로드 시작
 *
 * @param tripId - 여행 ID
 * @returns Promise<void>
 */
export async function downloadOfflineMapInBackground(tripId: string): Promise<void> {
  console.log(`🗺️ Starting background map download for trip: ${tripId}`);

  // 1. Trip의 cityId, destination, coordinates 조회
  const trip = await db
    .select({
      cityId: trips.cityId,
      destination: trips.destination,
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

    // mapDownloaded 플래그 업데이트
    await db
      .update(tripActivations)
      .set({
        mapDownloaded: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tripActivations.tripId, tripId))
      .run();

    console.log(`✅ Reusing existing offline map: ${trip.cityId} (ref count: ${existingCity.referenceCount + 1})`);
    return;
  }

  // 3. 새로 다운로드
  const regionName = `offline_city_${trip.cityId}`;
  const centerLat = parseFloat(trip.latitude);
  const centerLng = parseFloat(trip.longitude);
  const radiusKm = 10;

  // 10km 반경을 위도/경도 차이로 변환 (대략 0.09도 ≈ 10km)
  const latDelta = 0.09;
  const lngDelta = 0.09;

  // Mapbox bounds 형식: [[west, south], [east, north]]
  const bounds: [[number, number], [number, number]] = [
    [centerLng - lngDelta, centerLat - latDelta], // southwest
    [centerLng + lngDelta, centerLat + latDelta], // northeast
  ];

  const styleURL = 'mapbox://styles/mapbox/streets-v11';
  const minZoom = 10;
  const maxZoom = 16;

  // 먼저 기존 팩이 네이티브에 있는지 확인
  const existingPacks = await MapboxGL.offlineManager.getPacks();
  let pack = existingPacks.find((p) => p.name === regionName);

  if (!pack) {
    // 없으면 새로 다운로드
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

    // 다운로드 완료 후 다시 조회
    const packs = await MapboxGL.offlineManager.getPacks();
    pack = packs.find((p) => p.name === regionName);

    if (!pack) {
      throw new Error('다운로드된 오프라인 팩을 찾을 수 없습니다.');
    }

    console.log('✅ New offline pack created:', regionName);
  } else {
    console.log('♻️ Reusing existing offline pack:', regionName);
  }

  // 4. DB에 저장
  const now = new Date().toISOString();
  const newOfflineCity: NewOfflineCity = {
    cityId: trip.cityId,
    cityName: trip.destination,
    country: trip.country ?? null,
    centerLatitude: trip.latitude,
    centerLongitude: trip.longitude,
    radiusKm,
    downloadedAt: now,
    sizeBytes: pack?.size ?? 0,
    tileCount: pack?.tileCount ?? null,
    referenceCount: 1,
    mapboxRegionName: regionName,
    styleUrl: styleURL,
    minZoom,
    maxZoom,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(offlineCities).values(newOfflineCity).run();

  // 5. mapDownloaded 플래그 업데이트
  await db
    .update(tripActivations)
    .set({
      mapDownloaded: true,
      updatedAt: now,
    })
    .where(eq(tripActivations.tripId, tripId))
    .run();

  console.log(`✅ Offline map download completed for trip: ${tripId}`);
}
