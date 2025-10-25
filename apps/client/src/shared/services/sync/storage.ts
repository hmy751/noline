import { db } from '@/shared/db';
import { syncMetadata } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentISOString } from '@/shared/db/utils';

/**
 * 동기화 관련 메타데이터를 SQLite에 저장/조회
 *
 * AsyncStorage 대신 SQLite 사용:
 * - 추가 의존성 없음 (이미 SQLite 사용 중)
 * - 데이터 일관성 (모든 데이터가 SQLite에)
 * - 트랜잭션 지원 (Pull 성공 시에만 업데이트)
 */

const LAST_SYNCED_KEY = 'lastSyncedAt';

/**
 * 마지막 동기화 시간 조회
 *
 * @returns {Promise<Date | null>} 마지막 동기화 시간 (없으면 null)
 *
 * @example
 * const lastSyncedAt = await getLastSyncedAt();
 * if (lastSyncedAt) {
 *   console.log('Last synced:', lastSyncedAt.toISOString());
 * } else {
 *   console.log('Never synced');
 * }
 */
export async function getLastSyncedAt(): Promise<Date | null> {
  try {
    const result = await db.select().from(syncMetadata).where(eq(syncMetadata.key, LAST_SYNCED_KEY)).get();

    if (!result) {
      return null;
    }

    return new Date(result.value);
  } catch (error) {
    console.error('❌ [Storage] Failed to get lastSyncedAt:', error);
    return null;
  }
}

/**
 * 마지막 동기화 시간 저장
 *
 * @param {Date} date - 저장할 날짜
 *
 * @example
 * await setLastSyncedAt(new Date());
 */
export async function setLastSyncedAt(date: Date): Promise<void> {
  try {
    const now = getCurrentISOString();

    // Upsert: 존재하면 업데이트, 없으면 삽입
    await db
      .insert(syncMetadata)
      .values({
        key: LAST_SYNCED_KEY,
        value: date.toISOString(),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: syncMetadata.key,
        set: {
          value: date.toISOString(),
          updatedAt: now,
        },
      });

    console.log('✅ [Storage] lastSyncedAt saved:', date.toISOString());
  } catch (error) {
    console.error('❌ [Storage] Failed to set lastSyncedAt:', error);
  }
}

/**
 * 마지막 동기화 시간 삭제 (디버그용)
 *
 * @example
 * await clearLastSyncedAt();
 */
export async function clearLastSyncedAt(): Promise<void> {
  try {
    await db.delete(syncMetadata).where(eq(syncMetadata.key, LAST_SYNCED_KEY));

    console.log('✅ [Storage] lastSyncedAt cleared');
  } catch (error) {
    console.error('❌ [Storage] Failed to clear lastSyncedAt:', error);
  }
}
