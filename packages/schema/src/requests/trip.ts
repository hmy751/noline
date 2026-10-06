import { z } from 'zod';
import { tripEntity, ianaTimeZone } from '../entities/trip';
import { isoDateTime } from '../primitives/datetime';

/** 여행 기간 검증이다. 도시 시간대가 확인되면 달력 날짜를, 미확정 legacy는 기존 시점 순서를 비교한다. */
export function isTripDateRangeValid(startDate: string, endDate: string, timeZone: string | null): boolean {
  if (!isoDateTime.safeParse(startDate).success || !isoDateTime.safeParse(endDate).success) return false;
  if (timeZone === null) return Date.parse(startDate) <= Date.parse(endDate);
  if (!ianaTimeZone.safeParse(timeZone).success) return false;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'iso8601',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    era: 'short',
  });

  const calendarDate = (iso: string): number => {
    const parts = formatter.formatToParts(new Date(iso));
    const field = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    const displayedYear = Number(field('year'));
    const year = field('era') === 'BC' ? 1 - displayedYear : displayedYear;
    return year * 10000 + Number(field('month')) * 100 + Number(field('day'));
  };

  return calendarDate(startDate) <= calendarDate(endDate);
}

// ========================================
// Trip Request Schemas (API 요청)
// ========================================

/**
 * 여행 생성 요청 스키마
 * - 클라이언트 → 서버
 * - ✨ Client-Side ID: 클라이언트가 ID 생성
 */
export const createTripRequest = tripEntity
  .pick({
    id: true, // ✨ 클라이언트가 생성한 ULID
    userId: true,
    name: true,
    destination: true,
    country: true,
    baseCurrency: true,
    latitude: true,
    longitude: true,
    cityId: true,
    timeZone: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    // 요청 시에는 userId를 optional로 (테스트용)
    userId: z.string().ulid().optional(),
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    // 필수 필드 검증 추가
    name: z.string().min(1, 'Name is required'),
    destination: z.string().min(1, 'Destination is required'),
    baseCurrency: z.string().default('USD'),
    timeZone: ianaTimeZone.nullable().optional(),
  });

/** 시간대 도입 전 전송 대기 CREATE의 서버 수신에만 쓰는 호환 계약. 새 client 생성에는 쓰지 않는다. */
export const legacyCreateTripRequest = createTripRequest.extend({
  timeZone: ianaTimeZone.nullable().default(null),
});

/**
 * 여행 수정 요청 스키마
 * - 클라이언트 → 서버
 * - 모든 필드 optional (partial update)
 */
export const updateTripRequest = tripEntity
  .pick({
    name: true,
    destination: true,
    country: true,
    baseCurrency: true,
    latitude: true,
    longitude: true,
    cityId: true,
    timeZone: true,
    startDate: true,
    endDate: true,
  })
  .partial()
  .extend({
    // 요청 시 숫자로 받을 수 있도록
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    timeZone: ianaTimeZone.optional(),
  });
