import { db } from './index';

/**
 * 트랜잭션 헬퍼 함수
 *
 * 데이터 변경과 sync_queue 기록을 원자적으로 처리
 * - 둘 중 하나라도 실패하면 전체 롤백
 * - 데이터 정합성 보장
 *
 * @example
 * ```ts
 * await withTransaction(async () => {
 *   // 1. 데이터 저장
 *   await db.insert(trips).values(newTrip);
 *
 *   // 2. sync_queue 기록
 *   await db.insert(syncQueue).values(queueItem);
 * });
 * ```
 */
export async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    return await callback();
  });
}

/**
 * 현재 타임스탬프 반환 (SQLite 호환)
 * - JavaScript Date를 Unix timestamp로 변환
 */
export function getCurrentTimestamp(): Date {
  return new Date();
}

/**
 * Date를 SQLite timestamp로 변환
 */
export function dateToTimestamp(date: Date | string | null): Date | null {
  if (!date) return null;
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * SQLite timestamp를 ISO string으로 변환
 */
export function timestampToISOString(timestamp: Date | null): string | null {
  if (!timestamp) return null;
  return timestamp.toISOString();
}
