import syncApiClient from './api';
import { getSyncableTasks, getSyncQueueStats, deleteTask, updateTaskStatus, retryFailedTask } from './queue';
import { getLastSyncedAt, setLastSyncedAt } from './storage';
import { upsertTrips, upsertSchedules, upsertExpenses } from '@/shared/db/utils';
import { queryClient } from '@/shared/lib/queryClient';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { getDatabase, tripActivations } from '@/shared/db';
import { and, eq } from 'drizzle-orm';
import { selectLocalUserId, useAuthStore } from '@/shared/store/auth';
import { getQueueOwner } from '@/shared/services/auth/local-account';
import { processPendingCleanups } from './cleanup-job';
import { AuthRequiredError } from '@/shared/store/auth';
import type { Query } from '@tanstack/react-query';
import { expenseEntity } from '@repo/schema/entities/expense';

/** sync-owned table의 endpoint는 여기서 관리하고 HTTP method는 action으로 결정한다. */
const SYNC_PUSH_ENDPOINTS = {
  trips: '/api/trips',
  schedules: '/api/schedules',
  expenses: '/api/expenses',
} as const;

type SyncTable = keyof typeof SYNC_PUSH_ENDPOINTS;
type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export class SyncIncompleteError extends Error {
  constructor(public failedCount: number) {
    super(`동기화하지 못한 변경이 ${failedCount}개 있습니다`);
    this.name = 'SyncIncompleteError';
  }
}

function isSyncTable(tableName: string): tableName is SyncTable {
  return tableName in SYNC_PUSH_ENDPOINTS;
}

/** 변경 이전에 시작한 조회 결과를 버리고, 구독 중인 Query의 갱신을 요청한다. */
async function refreshSyncQueries(): Promise<void> {
  const filters = { predicate: ({ queryKey }: Query) => ['trip', 'schedule', 'expense'].includes(String(queryKey[0])) };
  await cancelAndInvalidateQueries(queryClient, filters);
}

async function pushTaskToServer(
  tableName: SyncTable,
  action: SyncAction,
  recordId: string,
  payload: unknown,
): Promise<void> {
  const endpoint = SYNC_PUSH_ENDPOINTS[tableName];

  switch (action) {
    case 'CREATE':
      await syncApiClient.post(endpoint, payload);
      return;
    case 'UPDATE':
      await syncApiClient.put(`${endpoint}/${recordId}`, payload);
      return;
    case 'DELETE':
      await syncApiClient.delete(`${endpoint}/${recordId}`);
      return;
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown sync action: ${exhaustive as string}`);
    }
  }
}

/** PENDING과 재시도 가능한 FAILED 작업을 FIFO로 전송한다. */
export async function pushChanges(): Promise<void> {
  let serverChanged = false;
  try {
    const tasks = await getSyncableTasks();

    if (tasks.length === 0) {
      const stats = await getSyncQueueStats();
      if (stats.failed + stats.inProgress > 0) {
        throw new SyncIncompleteError(stats.failed + stats.inProgress);
      }
      console.log('[Sync] No pending tasks');
      return;
    }

    console.log(`[Sync] Starting push: ${tasks.length} tasks`);

    for (const task of tasks) {
      if (
        useAuthStore.getState().status !== 'signed-in' ||
        (await getQueueOwner(task)) !== selectLocalUserId(useAuthStore.getState())
      ) {
        throw new AuthRequiredError('현재 계정으로 전송할 수 없는 작업입니다');
      }
      try {
        console.log(`[Sync] Processing: ${task.action} ${task.tableName}/${task.recordId}`);

        await updateTaskStatus(task.id, 'IN_PROGRESS');

        if (!isSyncTable(task.tableName)) {
          throw new Error(`Unknown table: ${task.tableName}`);
        }

        const payload = JSON.parse(task.payload);
        await pushTaskToServer(task.tableName, task.action as SyncAction, task.recordId, payload);
        serverChanged = true;

        await deleteTask(task.id);

        console.log(`[Sync] Success: ${task.action} ${task.tableName}/${task.recordId}`);
      } catch (error) {
        if (error instanceof AuthRequiredError) {
          console.warn(`[Sync] AuthRequiredError: ${task.tableName}/${task.recordId} - keeping PENDING`);
          await retryFailedTask(task.id);
          throw error;
        }

        console.error(`[Sync] Failed: ${task.action} ${task.tableName}/${task.recordId}`, error);
        await updateTaskStatus(task.id, 'FAILED', task.retryCount + 1);
        break;
      }
    }

    const stats = await getSyncQueueStats();
    if (stats.failed + stats.inProgress > 0) {
      throw new SyncIncompleteError(stats.failed + stats.inProgress);
    }

    console.log('[Sync] Push completed');

    try {
      console.log('[Sync] Checking for pending cleanups...');
      await processPendingCleanups();
    } catch (error) {
      console.error('[Sync] Failed to process pending cleanups (ignored):', error);
    }
  } catch (error) {
    console.error('[Sync] Push failed:', error);
    throw error;
  } finally {
    // 일부 전송만 성공하거나 다음 pull이 생략·실패해도 성공한 변경은 다시 읽는다.
    if (serverChanged) await refreshSyncQueries();
  }
}

/**
 * Pull 동기화 엔진
 *
 * 서버의 최신 데이터를 로컬 DB에 반영
 * - lastSyncedAt 이후 변경된 데이터만 가져옴 (증분 동기화)
 * - Upsert로 로컬 DB 업데이트
 * - React Query 캐시 무효화 → UI 자동 갱신
 * - lastSyncedAt 업데이트
 */
export async function pullChanges(): Promise<void> {
  try {
    // 마지막 동기화 시간 조회
    const lastSyncedAt = await getLastSyncedAt();

    // 활성화된 여행 ID 조회 (tripActivations 테이블 사용)
    const activatedTrips = await getDatabase()
      .select({ tripId: tripActivations.tripId })
      .from(tripActivations)
      .where(
        and(
          eq(tripActivations.isActivated, true),
          eq(tripActivations.userId, selectLocalUserId(useAuthStore.getState()) ?? ''),
        ),
      );
    const activatedTripIds = activatedTrips.map((activation) => activation.tripId);

    // 비활성 여행의 서버 데이터는 local DB에 저장하지 않는다.
    if (activatedTripIds.length === 0) {
      console.log('[Sync] Skipping pull: No activated trips');
      return;
    }

    console.log('[Sync] Starting pull...', {
      lastSyncedAt: lastSyncedAt?.toISOString() || 'Never synced (초기 동기화)',
      activatedTripIds,
    });

    // 서버에서 데이터 가져오기 (이 시점에 activatedTripIds.length > 0 임이 보장됨)
    const response = await syncApiClient.get('/api/sync/pull', {
      params: {
        lastSyncedAt: lastSyncedAt?.toISOString(),
        activatedTripIds: activatedTripIds.join(','),
      },
    });

    // 정책: 서버 응답은 { success, data } 구조
    const { trips, schedules, expenses: expenseRows, serverTime } = response.data.data;
    // 다른 entity 쓰기도 시작하기 전에 경비 응답 계약을 확인한다.
    const expenses = expenseEntity.array().parse(expenseRows);
    const rows = [...(trips ?? []), ...(schedules ?? []), ...(expenses ?? [])];
    if (rows.some((row: { userId: string }) => row.userId !== selectLocalUserId(useAuthStore.getState()))) {
      throw new Error('다른 계정의 동기화 응답입니다');
    }

    console.log('[Sync] Received from server:', {
      trips: trips?.length || 0,
      schedules: schedules?.length || 0,
      expenses: expenses?.length || 0,
      serverTime,
    });

    // 로컬 DB에 Upsert (ISO string 그대로 저장)
    if (trips && trips.length > 0) {
      const normalizedTrips = (trips as Array<Record<string, unknown>>).map((trip) => ({
        ...trip,
        version: trip.version ?? 1,
      }));
      await upsertTrips(normalizedTrips as never[]);
    }

    if (schedules && schedules.length > 0) {
      const normalizedSchedules = (schedules as Array<Record<string, unknown>>).map((schedule) => ({
        ...schedule,
        version: schedule.version ?? 1,
      }));
      await upsertSchedules(normalizedSchedules as never[]);
    }

    if (expenses && expenses.length > 0) {
      const normalizedExpenses = (expenses as Array<Record<string, unknown>>).map((expense) => ({
        ...expense,
        version: expense.version ?? 1,
      }));
      await upsertExpenses(normalizedExpenses as never[]);
    }

    await refreshSyncQueries();

    console.log('[Sync] cache refresh requested');

    // 마지막 동기화 시간 업데이트
    await setLastSyncedAt(new Date(serverTime));

    console.log('[Sync] Pull completed');
  } catch (error) {
    console.error('[Sync] Pull failed:', error);
    throw error;
  }
}

/** 로컬 변경을 먼저 Push한 뒤 서버 변경을 Pull한다. */
export async function syncData(): Promise<void> {
  try {
    console.log('[Sync] Starting full sync (Push + Pull)...');

    await pushChanges();
    await pullChanges();

    console.log('[Sync] Full sync completed');
  } catch (error) {
    console.error('[Sync] Full sync failed:', error);
    throw error;
  }
}
