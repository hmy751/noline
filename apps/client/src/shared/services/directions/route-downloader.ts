import { and, eq, isNull } from 'drizzle-orm';

import { routeQueryKeys } from '@/entities/route/data/keys';
import {
  getDatabase,
  routes,
  schedules as scheduleTable,
  tripActivations,
  trips,
  type NewRoute,
  type Route,
} from '@/shared/db';
import { withTransaction } from '@/shared/db/utils';
import { formatISOToTimeZoneDate } from '@/shared/lib/datetime';
import { queryClient } from '@/shared/lib/queryClient';
import { generateId } from '@/shared/services/id/ulid';
import { AuthRequiredError, requireLocalUserId, useAuthStore } from '@/shared/store/auth';

import { getDirections, type Coordinate, type MapboxProfile } from './mapbox';
import { buildRouteSegments, findSavedRoute, isSameRouteSegment, type RouteSegment } from './route-plan';

export type DownloadRoutesParams = {
  tripId: string;
  accommodationCoords?: Coordinate;
};

const PROFILES: MapboxProfile[] = ['walking', 'cycling', 'driving-traffic'];

// 경로 요청끼리만 직렬화한다. 일정 저장·삭제와 DB transaction은 네트워크를 기다리지 않는다.
const pendingDownloads = new Map<string, { sessionId: symbol | null; promise: Promise<unknown> }>();

/** 저장 성공과 독립적인 서비스 캐시 준비. 실패 profile은 비워 두고 다음 요청에서 다시 계산한다. */
export const downloadRoutesForSchedules = async (params: DownloadRoutesParams): Promise<{ savedCount: number }> => {
  const userId = requireLocalUserId();
  const sessionId = useAuthStore.getState().sessionId;
  const key = `${userId}:${params.tripId}`;
  const previous = pendingDownloads.get(key);

  const assertSession = () => {
    if (requireLocalUserId() !== userId || useAuthStore.getState().sessionId !== sessionId) {
      throw new AuthRequiredError();
    }
  };

  const result = (previous?.sessionId === sessionId ? previous.promise : Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      assertSession();
      return refreshRoutes(params, userId, assertSession);
    });
  pendingDownloads.set(key, { sessionId, promise: result });

  try {
    return await result;
  } finally {
    if (pendingDownloads.get(key)?.promise === result) {
      pendingDownloads.delete(key);
    }
  }
};

const refreshRoutes = async (
  { tripId, accommodationCoords }: DownloadRoutesParams,
  userId: string,
  assertSession: () => void,
): Promise<{ savedCount: number }> => {
  const initial = await withTransaction(async () => {
    assertSession();

    const segments = readCurrentSegments(tripId, userId, accommodationCoords);

    if (segments === null) {
      return null;
    }

    const savedRoutes = pruneCache(tripId, segments);
    return { segments, savedRoutes };
  });

  if (!initial) {
    return { savedCount: 0 };
  }

  await queryClient.invalidateQueries({ queryKey: routeQueryKeys.byTrip(tripId) });

  const candidates: NewRoute[] = [];

  for (const segment of initial.segments) {
    for (const profile of PROFILES) {
      assertSession();

      if (findSavedRoute(initial.savedRoutes, segment, profile)) {
        continue;
      }

      const segments = readCurrentSegments(tripId, userId, accommodationCoords);

      if (!segments?.some((live) => isSameRouteSegment(live, segment))) {
        continue;
      }

      try {
        const directions = await getDirections({ from: segment.from, to: segment.to, profile });
        const now = new Date().toISOString();
        candidates.push({
          id: generateId(),
          tripId,
          fromScheduleId: segment.fromScheduleId,
          toScheduleId: segment.toScheduleId,
          coordinatesKey: segment.coordinatesKey,
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
        console.error(
          `[Routes] Failed to download route (${segment.fromScheduleId} → ${segment.toScheduleId}, ${profile}):`,
          error,
        );
      }
    }
  }

  const savedCount = await withTransaction(async () => {
    assertSession();

    const segments = readCurrentSegments(tripId, userId, accommodationCoords);

    if (segments === null) {
      return 0;
    }

    const savedRoutes = pruneCache(tripId, segments);
    let inserted = 0;

    for (const candidate of candidates) {
      const segment = segments.find((live) => isSameRouteSegment(live, candidate));

      if (!segment || findSavedRoute(savedRoutes, segment, candidate.profile)) {
        continue;
      }

      getDatabase().insert(routes).values(candidate).run();
      inserted++;
    }

    return inserted;
  });

  await queryClient.invalidateQueries({ queryKey: routeQueryKeys.byTrip(tripId) });
  return { savedCount };
};

// 제출·활성화 시 캡처한 목록 대신 저장된 Local 원본으로 최신 인접 관계를 정한다.
// null은 기존 캐시 보존, []는 현재 구간이 없어 기존 캐시 전체 정리를 뜻한다.
const readCurrentSegments = (
  tripId: string,
  userId: string,
  accommodationCoords?: Coordinate,
): RouteSegment[] | null => {
  const db = getDatabase();
  const trip = db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .get();

  if (!trip) {
    return null;
  }

  if (trip.deletedAt) {
    return [];
  }

  const activation = db
    .select({ id: tripActivations.id })
    .from(tripActivations)
    .where(
      and(
        eq(tripActivations.tripId, tripId),
        eq(tripActivations.userId, userId),
        eq(tripActivations.isActivated, true),
      ),
    )
    .get();

  if (!activation) {
    return null;
  }

  const currentSchedules = db
    .select()
    .from(scheduleTable)
    .where(and(eq(scheduleTable.tripId, tripId), eq(scheduleTable.userId, userId), isNull(scheduleTable.deletedAt)))
    .all();

  // 지도는 선택한 여행 도시 날짜만 표시하므로 날짜 경계를 잇는 구간은 준비하지 않는다.
  const schedulesByDate = new Map<string, typeof currentSchedules>();

  for (const schedule of currentSchedules) {
    const date = formatISOToTimeZoneDate(schedule.scheduledAt, trip.timeZone ?? 'UTC');
    const daySchedules = schedulesByDate.get(date) ?? [];
    daySchedules.push(schedule);
    schedulesByDate.set(date, daySchedules);
  }

  return [...schedulesByDate.values()].flatMap((daySchedules) => buildRouteSegments(daySchedules, accommodationCoords));
};

// 서비스 캐시만 정리한다. sync-owned 원본과 sync_queue는 건드리지 않는다.
const pruneCache = (tripId: string, segments: readonly RouteSegment[]): Route[] => {
  const db = getDatabase();
  const existing = db.select().from(routes).where(eq(routes.tripId, tripId)).all();
  const retainedIds = new Set<string>();

  for (const segment of segments) {
    for (const profile of PROFILES) {
      const saved = findSavedRoute(existing, segment, profile);

      if (saved) {
        retainedIds.add(saved.id);
      }
    }
  }

  for (const row of existing) {
    if (!retainedIds.has(row.id)) {
      db.delete(routes).where(eq(routes.id, row.id)).run();
    }
  }

  return existing.filter(({ id }) => retainedIds.has(id));
};
