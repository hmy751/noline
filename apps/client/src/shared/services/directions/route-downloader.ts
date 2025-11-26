/**
 * Route Downloader - 경로 다운로드 유틸리티
 * - 일정 목록에서 모든 경로 세그먼트 다운로드
 * - 3가지 이동 수단 (walking, cycling, driving-traffic)
 * - useActivateTrip, useAutoDownloadRoutes 에서 사용
 */

import { generateId } from '@/shared/services/id/ulid';
import { db } from '@/shared/db';
import { routes } from '@/shared/db/schema';
import { getDirections, type MapboxProfile } from './mapbox';
import type { NewRoute } from '@/shared/db/schema';

interface Schedule {
  id: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface DownloadRoutesParams {
  tripId: string;
  schedules: Schedule[];
  accommodationCoords?: { latitude: number; longitude: number };
}

const PROFILES: MapboxProfile[] = ['walking', 'cycling', 'driving-traffic'];

/**
 * 일정 목록에서 모든 경로 세그먼트 다운로드
 * - 숙소 → 첫 일정
 * - 일정 → 일정
 * - 각 세그먼트당 3가지 이동 수단
 *
 * @param tripId - 여행 ID
 * @param schedules - 일정 목록
 * @param accommodationCoords - 숙소 좌표 (선택)
 * @returns 다운로드된 경로 수
 */
export async function downloadRoutesForSchedules({
  tripId,
  schedules,
  accommodationCoords,
}: DownloadRoutesParams): Promise<{ downloaded: number }> {
  const now = new Date().toISOString();
  const newRoutes: NewRoute[] = [];

  // 좌표가 있는 일정만 필터링 (string → number 변환 포함)
  const schedulesWithCoords = schedules
    .map((s) => ({
      id: s.id,
      latitude: typeof s.latitude === 'string' ? parseFloat(s.latitude) : s.latitude,
      longitude: typeof s.longitude === 'string' ? parseFloat(s.longitude) : s.longitude,
    }))
    .filter((s) => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude));

  if (schedulesWithCoords.length === 0) {
    console.log('📍 No schedules with coordinates, skipping route download');
    return { downloaded: 0 };
  }

  console.log(`📍 Downloading routes for ${schedulesWithCoords.length} schedules...`);

  // 1. 숙소 → 첫 일정 (있는 경우)
  if (accommodationCoords && schedulesWithCoords[0]) {
    const firstSchedule = schedulesWithCoords[0];

    for (const profile of PROFILES) {
      try {
        const directions = await getDirections({
          from: { latitude: accommodationCoords.latitude, longitude: accommodationCoords.longitude },
          to: { latitude: firstSchedule.latitude!, longitude: firstSchedule.longitude! },
          profile,
        });

        newRoutes.push({
          id: generateId(),
          tripId,
          fromScheduleId: null, // 숙소
          toScheduleId: firstSchedule.id,
          profile,
          geometry: directions.geometry,
          distance: directions.distance,
          duration: directions.duration,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
        });
      } catch (error) {
        console.error(`Failed to download route (accommodation → ${firstSchedule.id}, ${profile}):`, error);
      }
    }
  }

  // 2. 일정 → 일정 경로들
  for (let i = 0; i < schedulesWithCoords.length - 1; i++) {
    const currentSchedule = schedulesWithCoords[i];
    const nextSchedule = schedulesWithCoords[i + 1];

    for (const profile of PROFILES) {
      try {
        const directions = await getDirections({
          from: { latitude: currentSchedule.latitude!, longitude: currentSchedule.longitude! },
          to: { latitude: nextSchedule.latitude!, longitude: nextSchedule.longitude! },
          profile,
        });

        newRoutes.push({
          id: generateId(),
          tripId,
          fromScheduleId: currentSchedule.id,
          toScheduleId: nextSchedule.id,
          profile,
          geometry: directions.geometry,
          distance: directions.distance,
          duration: directions.duration,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
        });
      } catch (error) {
        console.error(`Failed to download route (${currentSchedule.id} → ${nextSchedule.id}, ${profile}):`, error);
      }
    }
  }

  // 3. DB에 일괄 저장
  if (newRoutes.length > 0) {
    await db.insert(routes).values(newRoutes).run();
    console.log(`✅ Downloaded ${newRoutes.length} routes for trip ${tripId}`);
  }

  return { downloaded: newRoutes.length };
}
