/**
 * Trip 및 데이터 lifecycle 상수
 *
 * 의미가 다른 두 종류의 7일을 명시적으로 분리한다.
 */

import { addCalendarDays, formatISOToTimeZoneDate, getTimeZoneDayStartISO } from './datetime';

/**
 * 여행 활성화 grace 기간 (일).
 *
 * 종료일 전체와 그 뒤 도시 달력의 7일을 보유한다. 다음 날 시작부터 만료된다.
 */
export const TRIP_ACTIVATION_GRACE_DAYS = 7;

/** 마지막 포함 날짜 + 유예일 전체가 끝난 뒤의 도시 날짜 경계. 미확정 시간대는 받지 않는다. */
export function getTripExpiryISO(endISO: string, timeZone: string): string {
  const finalDay = formatISOToTimeZoneDate(endISO, timeZone);
  return getTimeZoneDayStartISO(addCalendarDays(finalDay, TRIP_ACTIVATION_GRACE_DAYS + 1), timeZone);
}

/** 시간대가 미확정이면 기존 지도와 데이터를 보존한다. */
export function isTripExpired(trip: { endDate: string; timeZone?: string | null }, now: Date = new Date()): boolean {
  if (!trip.timeZone) return false;
  return now.getTime() >= Date.parse(getTripExpiryISO(trip.endDate, trip.timeZone));
}

/**
 * Soft delete vacuum 기간 (일).
 *
 * deletedAt 이 설정된 뒤 이 기간이 지난 schedule/expense 레코드는
 * cleanup-job 의 vacuum 단계에서 hard delete 된다.
 */
export const SOFT_DELETE_VACUUM_DAYS = 7;
