import * as Crypto from 'expo-crypto';

/**
 * ULID 생성 함수 (Expo Crypto 기반)
 *
 * ULID (Universally Unique Lexicographically Sortable Identifier)
 * - UUID보다 짧고 읽기 쉬움 (26자)
 * - 시간순 정렬 가능 (타임스탬프 포함)
 * - 대소문자 구분 없음 (Crockford's Base32)
 * - 로컬에서 생성해도 충돌 없음
 *
 * @example
 * ```ts
 * const tripId = generateId(); // "01HQZF3K9XYZ6QR7M2N5P8S1VT"
 * const scheduleId = generateId(); // "01HQZF3K9XYZ6QR7M2N5P8S1VU"
 * ```
 *
 * @returns ULID 문자열 (26자)
 */
export function generateId(): string {
  // Expo Crypto를 사용한 간단한 ULID 구현
  const timestamp = Date.now();
  const randomBytes = Crypto.getRandomBytes(16);

  // Crockford's Base32 인코딩 (ULID 표준)
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  // 타임스탬프 부분 (10자)
  let timestampStr = '';
  let ts = timestamp;
  for (let i = 0; i < 10; i++) {
    timestampStr = ENCODING[ts % 32] + timestampStr;
    ts = Math.floor(ts / 32);
  }

  // 랜덤 부분 (16자)
  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += ENCODING[randomBytes[i] % 32];
  }

  return timestampStr + randomStr;
}

/**
 * 특정 시간으로 ULID 생성 (테스트용)
 *
 * @param timestamp - Unix timestamp (밀리초)
 * @returns ULID 문자열
 */
export function generateIdWithTimestamp(timestamp: number): string {
  const randomBytes = Crypto.getRandomBytes(16);
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  let timestampStr = '';
  let ts = timestamp;
  for (let i = 0; i < 10; i++) {
    timestampStr = ENCODING[ts % 32] + timestampStr;
    ts = Math.floor(ts / 32);
  }

  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += ENCODING[randomBytes[i] % 32];
  }

  return timestampStr + randomStr;
}

/**
 * ULID 유효성 검증
 *
 * @param id - 검증할 ID 문자열
 * @returns 유효한 ULID인지 여부
 */
export function isValidULID(id: string): boolean {
  // ULID는 26자, Crockford's Base32 (0-9, A-Z, 소문자 제외 I, L, O, U)
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  return ulidRegex.test(id);
}
