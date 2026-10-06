/**
 * 날짜/시간 유틸리티 함수
 *
 * 시점은 ISO datetime으로 저장·전송한다. 여행 시점은 명시한 도시 시간대로 표시한다.
 * 달력 날짜(YYYY-MM-DD)는 시점으로 변환하지 않는다.
 */

import { Temporal } from '@js-temporal/polyfill';

type DateFormat = 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
type TimeFormat = 'HH:mm' | 'HH:mm:ss';

// 1. 도시 날짜·시각 → UTC 저장 시점

/** 도시의 달력 날짜·시각을 UTC 시점으로 만든다. 반복 시각은 첫 시점, 누락 시각은 오류다. */
export function combineDateTimeInTimeZoneToISO(date: string, time: string, timeZone: string): string {
  requireTimeZone(timeZone);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('시간을 다시 선택해주세요.');

  const local = calendarDate(date).toPlainDateTime(Temporal.PlainTime.from(time));
  const zoned = local.toZonedDateTime(timeZone, { disambiguation: 'earlier' });

  if (!zoned.toPlainDateTime().equals(local)) {
    throw new Error('여행 도시 시간대에서 사용할 수 없는 날짜·시간입니다. 다시 선택해주세요.');
  }

  return zoned.toInstant().toString({ fractionalSecondDigits: 3 });
}

/** 해당 도시 날짜의 첫 유효 시점. 자정 DST 전환은 그 날짜의 첫 존재하는 시각을 사용한다. */
export function getTimeZoneDayStartISO(date: string, timeZone: string): string {
  requireTimeZone(timeZone);

  const day = calendarDate(date);
  const start = day.toZonedDateTime(timeZone).startOfDay();

  if (!start.toPlainDate().equals(day)) throw new Error('여행 도시 시간대에 존재하지 않는 날짜입니다.');

  return start.toInstant().toString({ fractionalSecondDigits: 3 });
}

// 이미 만든 Date → UTC ISO 문자열

/**
 * Date 객체를 ISO 8601 string with timezone으로 변환
 *
 * @param date - Date 객체
 * @returns ISO 8601 string (예: "2024-01-15T14:30:00.000Z")
 *
 * @example
 * ```ts
 * const date = new Date('2024-01-15T14:30:00');
 * toISOString(date);
 * // → "2024-01-15T14:30:00.000Z"
 * ```
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

// 2. UTC 저장 시점 → 도시 날짜·시각 표시

/** 시간대 미확정 기존 여행의 표시·선택만 UTC로 읽는다. 입력·만료 시각 계산에 쓰지 않는다. */
export function getTripDisplayTimeZone(timeZone: string | null | undefined): string {
  if (timeZone == null) return 'UTC';

  requireTimeZone(timeZone);

  return timeZone;
}

export function formatISOToTimeZoneDate(iso: string, timeZone: string, format: DateFormat = 'YYYY-MM-DD'): string {
  const date = zonedInstant(iso, timeZone).toPlainDate().toString();
  const [year, month, day] = date.split('-');

  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;

  return date;
}

export function formatISOToTimeZoneTime(iso: string, timeZone: string, format: TimeFormat = 'HH:mm'): string {
  const time = zonedInstant(iso, timeZone).toPlainTime().toString({ smallestUnit: 'second' });
  return format === 'HH:mm:ss' ? time : time.slice(0, 5);
}

export function formatISOToTimeZoneDateTime(iso: string, timeZone: string): string {
  return `${formatISOToTimeZoneDate(iso, timeZone)} ${formatISOToTimeZoneTime(iso, timeZone)}`;
}

// 기기 시간대·현재 시점 기준의 표시 유틸리티

/**
 * 사용자의 현재 타임존 반환
 *
 * @returns 타임존 문자열 (예: "Asia/Seoul", "Europe/Paris")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * ISO string을 로컬 날짜 문자열로 변환
 *
 * @param isoString - ISO 8601 string
 * @param format - 날짜 형식 (기본: "YYYY-MM-DD")
 * @returns 로컬 날짜 문자열
 *
 * @example
 * ```ts
 * formatISOToLocalDate("2024-01-15T14:30:00.000Z");
 * // → "2024-01-15"
 *
 * formatISOToLocalDate("2024-01-15T14:30:00.000Z", "MM/DD/YYYY");
 * // → "01/15/2024"
 * ```
 */
export function formatISOToLocalDate(
  isoString: string,
  format: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' = 'YYYY-MM-DD',
): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * ISO string을 로컬 시간 문자열로 변환
 *
 * @param isoString - ISO 8601 string
 * @param format - 시간 형식 (기본: "HH:mm")
 * @returns 로컬 시간 문자열
 *
 * @example
 * ```ts
 * formatISOToLocalTime("2024-01-15T14:30:00.000Z");
 * // → "14:30" (사용자 타임존 기준)
 *
 * formatISOToLocalTime("2024-01-15T14:30:00.000Z", "HH:mm:ss");
 * // → "14:30:00"
 * ```
 */
export function formatISOToLocalTime(isoString: string, format: 'HH:mm' | 'HH:mm:ss' = 'HH:mm'): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format === 'HH:mm:ss' ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

/**
 * ISO string을 로컬 날짜+시간 문자열로 변환
 *
 * @param isoString - ISO 8601 string
 * @returns 로컬 날짜+시간 문자열
 *
 * @example
 * ```ts
 * formatISOToLocalDateTime("2024-01-15T14:30:00.000Z");
 * // → "2024-01-15 14:30"
 * ```
 */
export function formatISOToLocalDateTime(isoString: string): string {
  const date = formatISOToLocalDate(isoString);
  const time = formatISOToLocalTime(isoString);
  return `${date} ${time}`;
}

/**
 * ISO string을 상대 시간으로 변환
 *
 * @param isoString - ISO 8601 string
 * @returns 상대 시간 문자열 (예: "2 hours ago", "in 3 days")
 *
 * @example
 * ```ts
 * formatISOToRelative("2024-01-15T14:30:00.000Z");
 * // → "2 hours ago" (현재 시간 기준)
 * ```
 */
export function formatISOToRelative(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatISOToLocalDate(isoString);
}

// 3. 달력 날짜·범위 계산

export function getTimeZoneToday(timeZone: string, now: Date = new Date()): string {
  return formatISOToTimeZoneDate(now.toISOString(), timeZone);
}

/** 24시간을 더하지 않고 달력 날짜를 이동한다. Expense date-only에도 시간대 변환 없이 쓸 수 있다. */
export function addCalendarDays(date: string, days: number): string {
  return calendarDate(date).add({ days }).toString();
}

/** 저장된 두 시점이 속한 도시 날짜를 포함해 나열한다. 23/25시간 날짜에도 중복·누락이 없다. */
export function getTimeZoneDateRange(startISO: string, endISO: string, timeZone: string): string[] {
  let current = calendarDate(formatISOToTimeZoneDate(startISO, timeZone));

  const end = calendarDate(formatISOToTimeZoneDate(endISO, timeZone));
  const dates: string[] = [];

  while (Temporal.PlainDate.compare(current, end) <= 0) {
    dates.push(current.toString());
    current = current.add({ days: 1 });
  }

  return dates;
}

// 기기 시간대 기준의 날짜 비교

/**
 * 두 ISO string 날짜가 같은 날인지 확인
 *
 * @param isoString1 - 첫 번째 ISO string
 * @param isoString2 - 두 번째 ISO string
 * @returns 같은 날이면 true
 *
 * @example
 * ```ts
 * isSameDay(
 *   "2024-01-15T14:30:00.000Z",
 *   "2024-01-15T20:00:00.000Z"
 * );
 * // → true
 * ```
 */
export function isSameDay(isoString1: string, isoString2: string): boolean {
  const date1 = formatISOToLocalDate(isoString1);
  const date2 = formatISOToLocalDate(isoString2);
  return date1 === date2;
}

// 4. 내부 Temporal·시간대 검증 helper (DST 처리는 변환 함수에서 수행)

/** 여행 계산은 IANA 시간대를 명시해야 한다. 누락·오류를 기기 시간대로 보정하지 않는다. */
function requireTimeZone(timeZone: string): void {
  if (!timeZone || /^[+-]/.test(timeZone)) throw new Error('여행 도시의 시간대를 확인해주세요.');

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
  } catch {
    throw new Error('여행 도시의 시간대를 확인해주세요.');
  }
}

function calendarDate(date: string): Temporal.PlainDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('날짜를 다시 선택해주세요.');
  return Temporal.PlainDate.from(date, { overflow: 'reject' });
}

function zonedInstant(iso: string, timeZone: string): Temporal.ZonedDateTime {
  requireTimeZone(timeZone);
  return Temporal.Instant.from(iso).toZonedDateTimeISO(timeZone);
}

/**
 * 날짜와 시간을 조합해서 ISO string으로 변환
 *
 * @param date - 날짜 ("2024-01-15" 또는 Date 객체)
 * @param time - 시간 ("14:30" 형식)
 * @returns ISO 8601 string with timezone
 *
 * @example
 * ```ts
 * combineDateTimeToISO("2024-01-15", "14:30");
 * // → "2024-01-15T05:30:00.000Z" (기기가 Asia/Seoul인 경우)
 *
 * combineDateTimeToISO(new Date(), "14:30");
 * // → 오늘 날짜 14:30의 ISO string
 * ```
 */
export function combineDateTimeToISO(date: string | Date, time: string): string {
  const dateString = typeof date === 'string' ? date : formatISOToLocalDate(date.toISOString());

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('날짜와 시간을 다시 선택해주세요.');
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  // 날짜 문자열을 UTC 자정으로 읽지 않고 로컬 달력의 구성요소로 만든다.
  const dateObj = new Date(0);

  dateObj.setFullYear(year, month - 1, day);
  dateObj.setHours(hours, minutes, 0, 0);

  if (
    !Number.isFinite(dateObj.getTime()) ||
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day ||
    dateObj.getHours() !== hours ||
    dateObj.getMinutes() !== minutes
  ) {
    // 존재하지 않는 날짜 또는 DST 전환으로 건너뛴 시간을 자동 보정하지 않는다.
    throw new Error('현재 기기 시간대에서 사용할 수 없는 날짜·시간입니다. 다시 선택해주세요.');
  }

  return dateObj.toISOString();
}

/** 기존 Trip timestamp의 UTC 날짜 기준으로 달력 날짜를 나열한다. */
export function getUTCDateRange(startISO: string, endISO: string): string[] {
  const current = new Date(startISO);
  const end = new Date(endISO);

  if (!Number.isFinite(current.getTime()) || !Number.isFinite(end.getTime())) return [];

  current.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const dates: string[] = [];

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * 날짜 문자열을 ISO datetime string으로 변환 (UTC 자정 기준)
 *
 * @param dateString - 날짜 문자열 ("2024-03-15" 형식 또는 ISO datetime)
 * @returns ISO 8601 datetime string
 *
 * @example
 * ```ts
 * dateToISODateTime("2024-03-15");
 * // → "2024-03-15T00:00:00.000Z"
 *
 * dateToISODateTime("2024-03-15T10:30:00.000Z");
 * // → "2024-03-15T10:30:00.000Z" (이미 ISO datetime이면 그대로 반환)
 * ```
 */
export function dateToISODateTime(dateString: string): string {
  if (!dateString) {
    throw new Error('dateString is required');
  }

  // 이미 ISO datetime 형식인 경우 (T 포함)
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid datetime string: ${dateString}`);
    }
    return date.toISOString();
  }

  // "YYYY-MM-DD" 형식인 경우
  // YYYY-MM-DD 형식 검증
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyRegex.test(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD or ISO datetime`);
  }

  const date = new Date(dateString + 'T00:00:00.000Z'); // UTC 자정
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date.toISOString();
}
