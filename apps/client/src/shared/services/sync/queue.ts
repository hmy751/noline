import { eq, and } from 'drizzle-orm';
import { db } from '@/shared/db';
import { syncQueue, type NewSyncQueueItem, type SyncQueueItem } from '@/shared/db/schema';
import { generateId } from '../id/ulid';
import { getCurrentISOString } from '@/shared/db/utils';

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
 * @example
 * ```ts
 * await withTransaction(async () => {
 *   await db.insert(trips).values(newTrip);
 *   await addToSyncQueue('trips', newTrip.id, 'CREATE', newTrip);
 * });
 * ```
 */
export async function addToSyncQueue(
  tableName: string,
  recordId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
): Promise<string> {
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

  await db.insert(syncQueue).values(queueItem);

  console.log(`✅ Sync queue added: ${action} ${tableName}/${recordId}`);

  return queueItem.id;
}

/**
 * PENDING 상태 작업 조회
 *
 * 동기화 엔진이 서버로 Push할 작업 목록 조회
 * FIFO 순서 보장 (createdAt 기준 오름차순)
 *
 * @returns PENDING 상태의 sync_queue 항목 배열
 */
export async function getPendingTasks(): Promise<SyncQueueItem[]> {
  const tasks = await db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, 'PENDING'))
    .orderBy(syncQueue.createdAt)
    .all();

  return tasks;
}

/**
 * 특정 작업 조회
 *
 * @param taskId - sync_queue 작업 ID
 * @returns sync_queue 항목 또는 null
 */
export async function getTaskById(taskId: string): Promise<SyncQueueItem | null> {
  const tasks = await db.select().from(syncQueue).where(eq(syncQueue.id, taskId)).limit(1).all();

  return tasks[0] || null;
}

/**
 * 작업 상태 업데이트
 *
 * @param taskId - sync_queue 작업 ID
 * @param status - 변경할 상태 ('IN_PROGRESS', 'FAILED')
 * @param retryCount - 재시도 횟수 (선택)
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'IN_PROGRESS' | 'FAILED',
  retryCount?: number,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    status,
    updatedAt: getCurrentISOString(),
  };

  if (retryCount !== undefined) {
    updateData.retryCount = retryCount;
  }

  await db.update(syncQueue).set(updateData).where(eq(syncQueue.id, taskId));

  console.log(`🔄 Task ${taskId} status updated: ${status}`);
}

/**
 * 작업 삭제 (성공 시)
 *
 * 서버 Push 성공 후 호출
 *
 * @param taskId - sync_queue 작업 ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  await db.delete(syncQueue).where(eq(syncQueue.id, taskId));

  console.log(`✅ Task ${taskId} deleted (synced successfully)`);
}

/**
 * 특정 테이블의 특정 레코드에 대한 PENDING 작업 존재 여부 확인
 *
 * 중복 작업 방지용
 *
 * @param tableName - 대상 테이블명
 * @param recordId - 대상 레코드 ID
 * @returns PENDING 작업 존재 여부
 */
export async function hasPendingTask(tableName: string, recordId: string): Promise<boolean> {
  const tasks = await db
    .select()
    .from(syncQueue)
    .where(and(eq(syncQueue.tableName, tableName), eq(syncQueue.recordId, recordId), eq(syncQueue.status, 'PENDING')))
    .limit(1)
    .all();

  return tasks.length > 0;
}

/**
 * FAILED 상태 작업 조회
 *
 * 재시도가 필요한 작업 목록
 *
 * @returns FAILED 상태의 sync_queue 항목 배열
 */
export async function getFailedTasks(): Promise<SyncQueueItem[]> {
  const tasks = await db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, 'FAILED'))
    .orderBy(syncQueue.createdAt)
    .all();

  return tasks;
}

/**
 * FAILED 작업을 PENDING으로 재설정
 *
 * 수동 재시도용
 *
 * @param taskId - sync_queue 작업 ID
 */
export async function retryFailedTask(taskId: string): Promise<void> {
  await db
    .update(syncQueue)
    .set({
      status: 'PENDING',
      updatedAt: getCurrentISOString(),
    })
    .where(eq(syncQueue.id, taskId));

  console.log(`🔄 Task ${taskId} reset to PENDING for retry`);
}

/**
 * 모든 sync_queue 작업 삭제 (개발용)
 *
 * ⚠️ 주의: 동기화되지 않은 데이터가 손실될 수 있음
 */
export async function clearSyncQueue(): Promise<void> {
  await db.delete(syncQueue);

  console.log('🗑️ Sync queue cleared');
}

/**
 * sync_queue 통계 조회 (디버깅용)
 *
 * @returns 상태별 작업 개수
 */
export async function getSyncQueueStats(): Promise<{
  pending: number;
  inProgress: number;
  failed: number;
  total: number;
}> {
  const allTasks = await db.select().from(syncQueue).all();

  const stats = {
    pending: allTasks.filter((t) => t.status === 'PENDING').length,
    inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    failed: allTasks.filter((t) => t.status === 'FAILED').length,
    total: allTasks.length,
  };

  console.log('📊 Sync Queue Stats:', stats);

  return stats;
}
