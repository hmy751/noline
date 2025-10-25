/**
 * 날짜/시간 유틸리티 함수
 *
 * ISO 8601 datetime with timezone을 기준으로 사용
 * - DB 저장: ISO string with timezone
 * - API 통신: ISO string with timezone
 * - UI 표시: 사용자 로컬 시간으로 변환
 */

/**
 * 사용자의 현재 타임존 반환
 *
 * @returns 타임존 문자열 (예: "Asia/Seoul", "Europe/Paris")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

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
 * // → "2024-01-15T14:30:00+09:00" (사용자 타임존 기준)
 *
 * combineDateTimeToISO(new Date(), "14:30");
 * // → 오늘 날짜 14:30의 ISO string
 * ```
 */
export function combineDateTimeToISO(date: string | Date, time: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const [hours, minutes] = time.split(':').map(Number);

  // 시간 설정
  dateObj.setHours(hours, minutes, 0, 0);

  // ISO string으로 변환 (UTC 기준)
  return dateObj.toISOString();
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

/**
 * 현재 시간을 ISO string으로 반환
 *
 * @returns ISO 8601 string
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}
