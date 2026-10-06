import type { TripData } from '../model';
import {
  addCalendarDays,
  formatISOToTimeZoneDate,
  getTimeZoneDayStartISO,
  getTimeZoneToday,
  getTripDisplayTimeZone,
} from '@/shared/lib/datetime';

/**
 * 메인 여행 선택 로직
 * 1. 진행 중인 여행 (오늘이 여행 기간 안에 포함)
 * 2. 가장 가까운 미래 여행
 * 3. 가장 최근 과거 여행
 * 4. 날짜가 없는 여행만 있으면 첫 번째 여행
 */
export const selectMainTrip = (trips: TripData[], now: Date = new Date()): TripData | null => {
  if (!trips || trips.length === 0) return null;

  const calendarTrips = trips.map((trip) => {
    const zone = getTripDisplayTimeZone(trip.timeZone);
    const start = trip.startDate ? formatISOToTimeZoneDate(trip.startDate, zone) : null;
    const end = trip.endDate ? formatISOToTimeZoneDate(trip.endDate, zone) : null;
    return {
      trip,
      today: getTimeZoneToday(zone, now),
      start,
      end,
      startAt: start ? Date.parse(getTimeZoneDayStartISO(start, zone)) : 0,
      endAt: end ? Date.parse(getTimeZoneDayStartISO(addCalendarDays(end, 1), zone)) : 0,
    };
  });

  // 1. 진행 중인 여행 찾기
  const ongoingTrips = calendarTrips.filter(({ start, end, today }) => start && end && start <= today && end >= today);

  if (ongoingTrips.length > 0) {
    // 진행 중인 여행이 여러 개면 시작일이 가장 빠른 것
    return ongoingTrips.sort((a, b) => a.startAt - b.startAt)[0].trip;
  }

  // 2. 가장 가까운 미래 여행 찾기
  const futureTrips = calendarTrips.filter(({ start, today }) => start && start > today);

  if (futureTrips.length > 0) {
    return futureTrips.sort((a, b) => a.startAt - b.startAt)[0].trip;
  }

  // 3. 가장 최근 과거 여행 찾기
  const pastTrips = calendarTrips.filter(({ end, today }) => end && end < today);

  if (pastTrips.length > 0) {
    return pastTrips.sort((a, b) => b.endAt - a.endAt)[0].trip;
  }

  // 4. 날짜가 없는 여행만 있으면 첫 번째 여행
  const noDateTrips = trips.filter((trip) => !trip.startDate && !trip.endDate);
  if (noDateTrips.length > 0) {
    return noDateTrips[0];
  }

  return null;
};
