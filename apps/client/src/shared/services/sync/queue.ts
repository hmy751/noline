import { and, eq, ne } from 'drizzle-orm';

import { getDatabase, runDatabaseOperation } from '@/shared/db';
import { type NewSyncQueueItem, syncQueue, type SyncQueueItem } from '@/shared/db/schema';
import { getCurrentISOString } from '@/shared/db/utils';
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

  await getDatabase().insert(syncQueue).values(queueItem);

  console.log(`[SyncQueue] Sync queue added: ${action} ${tableName}/${recordId}`);

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
  const tasks = await runDatabaseOperation(() =>
    getDatabase().select().from(syncQueue).where(eq(syncQueue.status, 'PENDING')).orderBy(syncQueue.createdAt).all(),
  );

  return tasks;
}

/**
 * 격리 작업을 제외한 FIFO에서 전송 가능한 앞부분만 반환한다. 나머지 막힌 작업은 건너뛰지 않는다.
 *
 * FAILED는 실패 횟수와 관계없이 다시 보낸다. 재전송은 서버가 같은 결과로 받으므로
 * 횟수로 막으면 일시 오류가 쌓인 작업이 영구히 멈춘다. retryCount는 계속 센다.
 */
export const getSyncableTasks = async (): Promise<SyncQueueItem[]> => {
  const tasks = await quarantineOrphanedTasks();
  const blockedIndex = tasks.findIndex((task) => task.status !== 'PENDING' && task.status !== 'FAILED');

  return blockedIndex === -1 ? tasks : tasks.slice(0, blockedIndex);
};

/**
 * 지난 실행이 끝나지 못하고 남긴 IN_PROGRESS를 PENDING으로 되돌린다.
 *
 * 동기화는 executeSync 잠금 안에서 한 번에 하나만 실행되므로, push를 시작하는 순간의
 * IN_PROGRESS는 앱 종료 등으로 중단된 이전 실행의 흔적이다. retryCount는 유지한다.
 */
export const recoverInterruptedTasks = async (): Promise<void> => {
  await quarantineOrphanedTasks('IN_PROGRESS');
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
 * 작업 삭제 (성공 시)
 *
 * 서버 Push 성공 후 호출
 *
 * @param taskId - sync_queue 작업 ID
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  await runDatabaseOperation(() =>
    getDatabase()
      .delete(syncQueue)
      .where(and(eq(syncQueue.id, taskId), ne(syncQueue.status, 'QUARANTINED'))),
  );
};

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
  const tasks = await runDatabaseOperation(() =>
    getDatabase()
      .select()
      .from(syncQueue)
      .where(and(eq(syncQueue.tableName, tableName), eq(syncQueue.recordId, recordId), eq(syncQueue.status, 'PENDING')))
      .limit(1)
      .all(),
  );

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
  const tasks = await runDatabaseOperation(() =>
    getDatabase().select().from(syncQueue).where(eq(syncQueue.status, 'FAILED')).orderBy(syncQueue.createdAt).all(),
  );

  return tasks;
}

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

  console.log('[SyncQueue] Sync queue cleared');
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

  const stats = {
    pending: allTasks.filter((t) => t.status === 'PENDING').length,
    inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    failed: allTasks.filter((t) => t.status === 'FAILED').length,
    quarantined: allTasks.filter((t) => t.status === 'QUARANTINED').length,
    total: allTasks.length,
  };

  console.log('[SyncQueue] Sync Queue Stats:', stats);

  return stats;
};

/**
 * 특정 여행의 PENDING 작업 조회
 *
 * 여행 비활성화 전 동기화되지 않은 데이터 확인용
 *
 * @param tripId - 여행 ID
 * @returns 해당 여행의 PENDING 상태 sync_queue 항목 배열
 *
 */
export async function getPendingTasksForTrip(tripId: string): Promise<SyncQueueItem[]> {
  const tasks = await runDatabaseOperation(() =>
    getDatabase().select().from(syncQueue).where(eq(syncQueue.status, 'PENDING')).orderBy(syncQueue.createdAt).all(),
  );

  // Trip 자체 또는 Child Entity (schedules, expenses) 필터링
  return tasks.filter((task) => {
    if (task.tableName === 'trips' && task.recordId === tripId) {
      return true;
    }
    // Child entities의 경우 payload에서 tripId 확인.
    // CREATE/UPDATE payload는 entity 전체, DELETE payload는 { tripId } 만 포함.
    // 이전 버전이 남긴 payload === "null"도 옵셔널 체이닝으로 안전하게 처리.
    if (task.tableName === 'schedules' || task.tableName === 'expenses') {
      try {
        const payload = JSON.parse(task.payload) as { tripId?: string } | null;
        return payload?.tripId === tripId;
      } catch {
        return false;
      }
    }
    return false;
  });
}

/**
 * 특정 여행의 PENDING 작업 존재 여부 확인
 *
 * 여행 비활성화 가능 여부 판단용
 *
 * @param tripId - 여행 ID
 * @returns PENDING 작업 존재 여부
 *
 */
export async function hasPendingTasksForTrip(tripId: string): Promise<boolean> {
  const tasks = await getPendingTasksForTrip(tripId);
  return tasks.length > 0;
}
