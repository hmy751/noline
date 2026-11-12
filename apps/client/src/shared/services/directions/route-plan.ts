import type { Coordinate } from './mapbox';

export type ScheduleCoordinates = {
  id: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  scheduledAt?: string;
};

export type RouteSegment = {
  fromScheduleId: string | null;
  toScheduleId: string;
  from: Coordinate;
  to: Coordinate;
  coordinatesKey: string;
};

/** 0은 유효한 좌표다. 빈 문자열과 부분 숫자 문자열은 좌표로 해석하지 않는다. */
export const getScheduleCoordinate = (
  schedule: Pick<ScheduleCoordinates, 'latitude' | 'longitude'>,
): Coordinate | null => {
  const normalize = (value: ScheduleCoordinates['latitude']): number | null => {
    if (value == null || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const latitude = normalize(schedule.latitude);
  const longitude = normalize(schedule.longitude);

  if (latitude == null || longitude == null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
};

/** 시각이 있으면 실제 시각순. 동시각·시각 없는 기존 호출은 입력 순서를 유지한다. */
export const buildRouteSegments = (
  schedules: readonly ScheduleCoordinates[],
  accommodationCoords?: Coordinate,
): RouteSegment[] => {
  const ordered = schedules.map((schedule, index) => ({ schedule, index }));
  ordered.sort((a, b) => {
    const aTime = a.schedule.scheduledAt ? Date.parse(a.schedule.scheduledAt) : NaN;
    const bTime = b.schedule.scheduledAt ? Date.parse(b.schedule.scheduledAt) : NaN;

    if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
      return aTime - bTime || a.index - b.index;
    }
    if (Number.isFinite(aTime)) {
      return -1;
    }
    if (Number.isFinite(bTime)) {
      return 1;
    }
    return a.index - b.index;
  });

  const segments: RouteSegment[] = [];
  let previous: { id: string | null; coordinate: Coordinate } | null = null;
  const accommodation = accommodationCoords && getScheduleCoordinate(accommodationCoords);

  if (accommodation) {
    previous = { id: null, coordinate: accommodation };
  }

  for (const { schedule } of ordered) {
    const coordinate = getScheduleCoordinate(schedule);

    if (!coordinate) {
      continue;
    }

    if (previous) {
      segments.push({
        fromScheduleId: previous.id,
        toScheduleId: schedule.id,
        from: previous.coordinate,
        to: coordinate,
        coordinatesKey: JSON.stringify([
          previous.coordinate.latitude,
          previous.coordinate.longitude,
          coordinate.latitude,
          coordinate.longitude,
        ]),
      });
    }

    previous = { id: schedule.id, coordinate };
  }

  return segments;
};

type SavedRoute = {
  id: string;
  fromScheduleId: string | null;
  toScheduleId: string;
  profile: string;
  coordinatesKey?: string | null;
  deletedAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

type RouteSegmentIdentity = {
  fromScheduleId?: string | null;
  toScheduleId: string;
  coordinatesKey?: string | null;
};

export const isSameRouteSegment = (left: RouteSegmentIdentity, right: RouteSegmentIdentity): boolean => {
  return (
    left.fromScheduleId === right.fromScheduleId &&
    left.toScheduleId === right.toScheduleId &&
    left.coordinatesKey === right.coordinatesKey
  );
};

/** 같은 입력의 중복이 남아 있어도 항상 같은 최신 row를 선택한다. */
export const findSavedRoute = <T extends SavedRoute>(
  rows: readonly T[],
  segment: RouteSegment,
  profile: string,
): T | undefined => {
  return rows
    .filter((row) => !row.deletedAt && isSameRouteSegment(row, segment) && row.profile === profile)
    .sort(
      (a, b) =>
        (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') ||
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
        b.id.localeCompare(a.id),
    )[0];
};
