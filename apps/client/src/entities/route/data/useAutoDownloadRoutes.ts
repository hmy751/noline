/**
 * useAutoDownloadRoutes
 * 일정 변경 시 자동으로 경로 다운로드
 * - 3가지 이동 수단 모두 다운로드 (walking, cycling, driving-traffic)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateId } from '@/shared/services/id/ulid';
import { db } from '@/shared/db';
import { routes } from '@/shared/db/schema';
import { getDirections, type MapboxProfile } from '@/shared/services/directions/mapbox';
import type { NewRoute } from '@/shared/db/schema';

interface Schedule {
  id: string;
  latitude?: number;
  longitude?: number;
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
 */
export function useAutoDownloadRoutes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, schedules, accommodationCoords }: DownloadRoutesParams) => {
      const now = new Date().toISOString();
      const newRoutes: NewRoute[] = [];

      // 좌표가 있는 일정만 필터링
      const schedulesWithCoords = schedules.filter(
        (s) => s.latitude && s.longitude && !isNaN(s.latitude) && !isNaN(s.longitude),
      );

      if (schedulesWithCoords.length === 0) {
        return { downloaded: 0 };
      }

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
      }

      return { downloaded: newRoutes.length };
    },
    onSuccess: (_, variables) => {
      // 경로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['routes', 'trip', variables.tripId] });
      console.log(`✅ Downloaded ${_.downloaded} routes for trip ${variables.tripId}`);
    },
    onError: (error) => {
      console.error('Failed to download routes:', error);
    },
  });
}
