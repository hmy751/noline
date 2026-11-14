import { sql, and, eq, ne, inArray } from 'drizzle-orm';

import { getDatabase, runDatabaseOperation, legacySyncHolds, schedules, expenses } from '@/shared/db';
import { type NewSyncQueueItem, syncQueue, type SyncQueueItem } from '@/shared/db/schema';
import { getCurrentISOString } from '@/shared/db/utils';
import type { SyncRun } from '@/shared/diagnostics/sentry';
import { quarantineOrphanedTasks } from '@/shared/services/auth/local-account';

import { generateId } from '../id/ulid';

/**
 * sync_queue에 작업 추가
 *
 * 로컬 데이터 변경(CREATE/UPDATE/DELETE) 발생 시 호출
 * 트랜잭션 내에서 데이터 저장과 함께 호출되어야 함
 *
 * @param tableName - 대상 테이블명 ('trips', 'schedules')
 * @param recordId - 대상 레코드 ID (ULID)
 * @param action - 작업 타입 ('CREATE', 'UPDATE', 'DELETE')
 * @param payload - 서버로 전송할 데이터 (객체)
 *
 */
export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: unknown,
): Promise<void> {
  const queueItem: NewSyncQueueItem = {
    id: generateId(),
    tableName,
    recordId,
    action,
    payload: JSON.stringify(payload),
    status: 'PENDING',
    retryCount: 0,
    createdAt: getCurrentISOString(),
  };

  await getDatabase().insert(syncQueue).values(queueItem);
}

/**
 * PENDING 상태 작업 조회
 *
 * 동기화 엔진이 서버로 Push할 작업 목록 조회
 * 같은 저장 시각을 가진 요청도 SQLite에 추가된 순서대로 전송한다.
 *
 * @returns PENDING 상태의 sync_queue 항목 배열
 */
export const getPendingTasks = async (): Promise<SyncQueueItem[]> => {
  const tasks = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'PENDING'))
      .orderBy(sql`rowid`)
      .all(),
  );

  return tasks;
};

/**
 * 격리 작업을 제외한 FIFO에서 전송 가능한 앞부분만 반환한다. 나머지 막힌 작업은 건너뛰지 않는다.
 *
 * FAILED는 실패 횟수와 관계없이 다시 보낸다. 재전송은 서버가 같은 결과로 받으므로
 * 횟수로 막으면 일시 오류가 쌓인 작업이 영구히 멈춘다. retryCount는 계속 센다.
 */
export const getSyncableTasks = async (run?: SyncRun): Promise<SyncQueueItem[]> => {
  const tasks = await quarantineOrphanedTasks(undefined, run);
  const blockedIndex = tasks.findIndex((task) => task.status !== 'PENDING' && task.status !== 'FAILED');

  return blockedIndex === -1 ? tasks : tasks.slice(0, blockedIndex);
};

/**
 * 지난 실행이 끝나지 못하고 남긴 IN_PROGRESS를 PENDING으로 되돌린다.
 *
 * 동기화는 executeSync 잠금 안에서 한 번에 하나만 실행되므로, push를 시작하는 순간의
 * IN_PROGRESS는 앱 종료 등으로 중단된 이전 실행의 흔적이다. retryCount는 유지한다.
 */
export const recoverInterruptedTasks = async (run?: SyncRun): Promise<void> => {
  await quarantineOrphanedTasks('IN_PROGRESS', run);
  await runDatabaseOperation(() =>
    getDatabase()
      .update(syncQueue)
      .set({ status: 'PENDING', updatedAt: getCurrentISOString() })
      .where(eq(syncQueue.status, 'IN_PROGRESS')),
  );
};

/**
 * 특정 작업 조회
 *
 * @param taskId - sync_queue 작업 ID
 * @returns sync_queue 항목 또는 null
 */
export const getTaskById = async (taskId: string): Promise<SyncQueueItem | null> => {
  const tasks = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(syncQueue)
      .where(and(eq(syncQueue.id, taskId), ne(syncQueue.status, 'QUARANTINED')))
      .limit(1)
      .all(),
  );

  return tasks[0] || null;
};

/**
 * 작업 상태 업데이트
 *
 * @param taskId - sync_queue 작업 ID
 * @param status - 변경할 상태 ('IN_PROGRESS', 'FAILED')
 * @param retryCount - 재시도 횟수 (선택)
 */
export const updateTaskStatus = async (
  taskId: string,
  status: 'IN_PROGRESS' | 'FAILED',
  retryCount?: number,
): Promise<void> => {
  const updateData: Pick<NewSyncQueueItem, 'status' | 'updatedAt' | 'retryCount'> = {
    status,
    updatedAt: getCurrentISOString(),
  };

  if (retryCount !== undefined) {
    updateData.retryCount = retryCount;
  }

  await runDatabaseOperation(() =>
    getDatabase()
      .update(syncQueue)
      .set(updateData)
      .where(and(eq(syncQueue.id, taskId), ne(syncQueue.status, 'QUARANTINED'))),
  );
};

/**
 * FAILED 상태 작업 조회
 *
 * 재시도가 필요한 작업 목록
 *
 * @returns FAILED 상태의 sync_queue 항목 배열
 */
export const getFailedTasks = async (): Promise<SyncQueueItem[]> => {
  const tasks = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'FAILED'))
      .orderBy(sql`rowid`)
      .all(),
  );

  return tasks;
};

/**
 * FAILED 작업을 PENDING으로 재설정
 *
 * 수동 재시도용
 *
 * @param taskId - sync_queue 작업 ID
 */
export const retryFailedTask = async (taskId: string): Promise<void> => {
  await runDatabaseOperation(() =>
    getDatabase()
      .update(syncQueue)
      .set({
        status: 'PENDING',
        updatedAt: getCurrentISOString(),
      })
      .where(and(eq(syncQueue.id, taskId), ne(syncQueue.status, 'QUARANTINED'))),
  );
};

/**
 * 모든 sync_queue 작업 삭제 (개발용)
 *
 * 동기화되지 않은 데이터가 손실될 수 있으므로 명시적인 폐기 흐름에서만 호출한다.
 */
export async function clearSyncQueue(): Promise<void> {
  await runDatabaseOperation(() => getDatabase().delete(syncQueue));
}

/**
 * sync_queue 통계 조회 (디버깅용)
 *
 * @returns 상태별 작업 개수
 */
export const getSyncQueueStats = async (): Promise<{
  pending: number;
  inProgress: number;
  failed: number;
  quarantined: number;
  total: number;
}> => {
  const allTasks = await runDatabaseOperation(() => getDatabase().select().from(syncQueue).all());

  return {
    pending: allTasks.filter((t) => t.status === 'PENDING').length,
    inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    failed: allTasks.filter((t) => t.status === 'FAILED').length,
    quarantined: allTasks.filter((t) => t.status === 'QUARANTINED').length,
    total: allTasks.length,
  };
};

/** 정리 판단과 쓰기를 같은 transaction에 묶을 때 사용한다. */
export const hasUnresolvedTripChangesInTransaction = async (tripId: string): Promise<boolean> => {
  const tasks = await getDatabase()
    .select()
    .from(syncQueue)
    .where(inArray(syncQueue.status, ['PENDING', 'FAILED', 'IN_PROGRESS']))
    .orderBy(sql`rowid`)
    .all();
  const childIds = new Set(
    [
      ...(await getDatabase().select({ id: schedules.id }).from(schedules).where(eq(schedules.tripId, tripId)).all()),
      ...(await getDatabase().select({ id: expenses.id }).from(expenses).where(eq(expenses.tripId, tripId)).all()),
    ].map((row) => row.id),
  );
  const holds = await getDatabase().select().from(legacySyncHolds).where(eq(legacySyncHolds.tripId, tripId)).all();
  // 보류 입력은 전송을 막지 않지만 기기 사본 정리 전에는 미해결 입력으로 보호한다.
  const hasRelatedTasks = tasks.some((task) => {
    if (task.tableName === 'trips' && task.recordId === tripId) {
      return true;
    }

    // 부분 수정에는 tripId가 없을 수 있어 기기 원본의 귀속도 확인한다.
    if (task.tableName === 'schedules' || task.tableName === 'expenses') {
      if (childIds.has(task.recordId)) {
        return true;
      }

      try {
        const payload: unknown = JSON.parse(task.payload);
        return !!payload && typeof payload === 'object' && 'tripId' in payload && payload.tripId === tripId;
      } catch {
        return false;
      }
    }

    return false;
  });

  return holds.length > 0 || hasRelatedTasks;
};
