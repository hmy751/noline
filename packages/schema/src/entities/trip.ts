import { z } from 'zod';
import { isoDateTime } from '../primitives/datetime';

/** IANA 시간대만 허용한다. 기기 기본 시간대나 UTC offset은 도시 시간대를 대신하지 않는다. */
export const ianaTimeZone = z.string().refine((value) => {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)+$/.test(value) && value !== 'UTC') return false;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}, 'Invalid IANA time zone');

// ========================================
// Trip Entity Schema (DB와 1:1 매핑)
// ========================================

/**
 * Trip Entity Schema (강제 계약)
 * - 모든 앱이 준수해야 하는 도메인 모델
 * - DB와 1:1 매핑
 * - 날짜: ISO 8601 datetime string
 */
export const tripEntity = z.object({
  // Client-Side ID 필드
  id: z.string().ulid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  deletedAt: isoDateTime.nullable().optional(),
  version: z.number().default(1).optional(),

  // 비즈니스 필드
  userId: z.string().ulid().nullable(), // 인증 추가 전까지 nullable
  name: z.string(),
  destination: z.string(),
  country: z.string().nullable(),
  baseCurrency: z.string(), // 여행 기본 통화
  latitude: z.string().nullable(), // DB decimal → string
  longitude: z.string().nullable(),
  cityId: z.number().nullable(),
  // null은 시간대 도입 전 여행의 미확정 상태다. 기존 timestamp는 그대로 보존한다.
  timeZone: ianaTimeZone.nullable().default(null),
  startDate: isoDateTime,
  endDate: isoDateTime,
});
