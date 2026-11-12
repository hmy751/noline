import type { Query } from '@tanstack/react-query';
import axios from 'axios';
import { and, eq } from 'drizzle-orm';

import { expenseEntity } from '@repo/schema/entities/expense';
import { scheduleEntity } from '@repo/schema/entities/schedule';
import { tripEntity } from '@repo/schema/entities/trip';
import { deleteTripResponse } from '@repo/schema/responses/trip';
import { deleteQueuePayloadSchema } from '@repo/schema/sync/sync-queue';
import { syncPullResponseSchema } from '@repo/schema/sync/sync-status';

import {
  type SyncQueueItem,
  getDatabase,
  tripActivations,
  runDatabaseTransaction,
  syncQueue,
  trips as localTrips,
  schedules as localSchedules,
  expenses as localExpenses,
} from '@/shared/db';
import { reportSyncSignal, type SyncRun } from '@/shared/diagnostics/sentry';
import { cancelAndInvalidateQueries } from '@/shared/lib/query-refresh';
import { queryClient } from '@/shared/lib/queryClient';
import { isSessionRefreshFailure } from '@/shared/services/auth/auth-interceptor';
import { getQueueOwner } from '@/shared/services/auth/local-account';
import { AuthRequiredError, requireLocalUserId, selectLocalUserId, useAuthStore } from '@/shared/store/auth';

import syncApiClient from './api';
import { processPendingCleanups } from './cleanup-job';
import {
  getTaskById,
  getSyncableTasks,
  getSyncQueueStats,
  updateTaskStatus,
  retryFailedTask,
  recoverInterruptedTasks,
} from './queue';
import { reconcileServerRecord, reconcileRecordInTransaction } from './reconcile';
import { applyConfirmedDeletionInTransaction } from './confirmed-deletion';
import { rememberConfirmedDeletionInTransaction } from './server-state';
import { getLastSyncedAt, setLastSyncedAt } from './storage';

/** sync-owned table의 endpoint는 여기서 관리하고 HTTP method는 action으로 결정한다. */
const SYNC_PUSH_ENDPOINTS = {
  trips: '/api/trips',
  schedules: '/api/schedules',
  expenses: '/api/expenses',
} as const;

type SyncTable = keyof typeof SYNC_PUSH_ENDPOINTS;
const LOCAL_TABLES = { trips: localTrips, schedules: localSchedules, expenses: localExpenses };
const RESPONSE_ENTITIES = { trips: tripEntity, schedules: scheduleEntity, expenses: expenseEntity };
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

const pushTaskToServer = async (
  tableName: SyncTable,
  action: SyncAction,
  recordId: string,
  payload: unknown,
): Promise<unknown> => {
  const endpoint = SYNC_PUSH_ENDPOINTS[tableName];

  switch (action) {
    case 'CREATE':
      return (await syncApiClient.post(endpoint, payload)).data;
    case 'UPDATE':
      return (await syncApiClient.put(`${endpoint}/${recordId}`, payload)).data;
    case 'DELETE':
      return (await syncApiClient.delete(`${endpoint}/${recordId}`)).data;
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown sync action: ${exhaustive}`);
    }
  }
};

type RequestStage = 'local-before-send' | 'sending' | 'local-after-response';

function failureDetails(error: unknown, stage: RequestStage) {
  if (isSessionRefreshFailure(error)) {
    return {
      stage: 'auth-refresh-failed',
      httpStatus: axios.isAxiosError(error) ? error.response?.status : undefined,
    } as const;
  }

  if (error instanceof AuthRequiredError) {
    return { stage: 'auth-blocked' } as const;
  }

  if (stage !== 'sending') {
    return { stage };
  }

  if (axios.isAxiosError(error) && error.response) {
    return { stage: 'server-rejected', httpStatus: error.response.status } as const;
  }
  return { stage: 'response-unconfirmed' } as const;
}

/** 중단된 작업을 되돌린 뒤 PENDING과 FAILED 작업을 FIFO로 전송하고 첫 실패에서 멈춘다. */
export async function pushChanges(run?: SyncRun): Promise<void> {
  let serverChanged = false;
  let reportedBlock = false;
  let stage: RequestStage = 'local-before-send';

  try {
    await recoverInterruptedTasks(run);
    const tasks = await getSyncableTasks(run);

    if (tasks.length === 0) {
      // 복구·선택 뒤 맨 앞에는 PENDING·FAILED만 오므로, 이 검사는 알 수 없는 status가
      // 맨 앞을 막고 그 뒤에 미전송이 남은 경우를 위한 방어용이다.
      const stats = await getSyncQueueStats();
      if (stats.failed + stats.inProgress > 0) {
        throw new SyncIncompleteError(stats.failed + stats.inProgress);
      }
      console.log('[Sync] No pending tasks');
      return;
    }

    console.log(`[Sync] Starting push: ${tasks.length} tasks`);

    for (const [index, task] of tasks.entries()) {
      if (!(await getTaskById(task.id))) {
        continue;
      }
      stage = 'local-before-send';
      const hasWaiting = index + 1 < tasks.length;

      const taskOwnerId = await getQueueOwner(task);

      if (
        useAuthStore.getState().status !== 'signed-in' ||
        !taskOwnerId ||
        taskOwnerId !== selectLocalUserId(useAuthStore.getState())
      ) {
        reportSyncSignal({ kind: 'sync.push.blocked', stage: 'auth-blocked', task, hasWaiting }, run);
        reportedBlock = true;
        throw new AuthRequiredError('현재 계정으로 전송할 수 없는 작업입니다');
      }

      try {
        console.log(`[Sync] Processing: ${task.action} ${task.tableName}/${task.recordId}`);

        await updateTaskStatus(task.id, 'IN_PROGRESS');

        if (!isSyncTable(task.tableName)) {
          throw new Error(`Unknown table: ${task.tableName}`);
        }

        const payload = JSON.parse(task.payload);

        if (task.action !== 'CREATE' && task.action !== 'UPDATE' && task.action !== 'DELETE') {
          throw new Error(`Unknown sync action: ${task.action}`);
        }

        stage = 'sending';
        const result = await pushTaskToServer(task.tableName, task.action, task.recordId, payload);
        stage = 'local-after-response';
        serverChanged = true;

        await applyPushResponse(task, task.tableName, taskOwnerId, payload, result);

        console.log(`[Sync] Success: ${task.action} ${task.tableName}/${task.recordId}`);
      } catch (error) {
        reportedBlock = true;
        reportSyncSignal({ kind: 'sync.push.blocked', ...failureDetails(error, stage), task, hasWaiting }, run);

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
    if (!reportedBlock) {
      reportSyncSignal({ kind: 'sync.push.blocked', ...failureDetails(error, stage) }, run);
    }

    console.error('[Sync] Push failed:', error);
    throw error;
  } finally {
    // 일부 전송만 성공하거나 다음 pull이 생략·실패해도 성공한 변경은 다시 읽는다.
    if (serverChanged) {
      await refreshSyncQueries().catch((error: unknown) => {
        reportSyncSignal({ kind: 'sync.push.blocked', stage: 'local-after-response' }, run);
        throw error;
      });
    }
  }
}

/**
 * Pull 동기화 엔진
 *
 * 서버의 최신 데이터를 로컬 DB에 반영
 * - lastSyncedAt 이후 변경된 데이터만 가져옴 (증분 동기화)
 * - 서버 확인본 위에 미전송 입력을 투영해 로컬 DB 업데이트
 * - React Query 캐시 무효화 → UI 자동 갱신
 * - lastSyncedAt 업데이트
 */
export async function pullChanges(run?: SyncRun): Promise<void> {
  let stage: RequestStage = 'local-before-send';

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
    stage = 'sending';
    const response = await syncApiClient.get('/api/sync/pull', {
      params: {
        lastSyncedAt: lastSyncedAt?.toISOString(),
        activatedTripIds: activatedTripIds.join(','),
      },
    });

    stage = 'local-after-response';
    // 정책: 서버 응답은 { success, data } 구조
    // entity와 checkpoint 모두 검증한 뒤 첫 Local 쓰기를 시작한다.
    const { trips, schedules, expenses, serverTime } = syncPullResponseSchema.parse(response.data).data;
    const userId = requireLocalUserId();
    const rows = [...trips, ...schedules, ...expenses];
    if (rows.some((row) => row.userId !== userId)) {
      throw new Error('다른 계정의 동기화 응답입니다');
    }

    console.log('[Sync] Received from server:', {
      trips: trips?.length || 0,
      schedules: schedules?.length || 0,
      expenses: expenses?.length || 0,
      serverTime,
    });

    await runDatabaseTransaction(async () => {
      for (const row of trips) {
        await reconcileRecordInTransaction('trips', row);
      }
      for (const row of schedules) {
        await reconcileRecordInTransaction('schedules', row);
      }
      for (const row of expenses) {
        await reconcileRecordInTransaction('expenses', row);
      }
    });

    await refreshSyncQueries();

    console.log('[Sync] cache refresh requested');

    // 마지막 동기화 시간 업데이트
    await setLastSyncedAt(new Date(serverTime));

    console.log('[Sync] Pull completed');
  } catch (error) {
    reportSyncSignal({ kind: 'sync.pull.blocked', ...failureDetails(error, stage) }, run);
    console.error('[Sync] Pull failed:', error);
    throw error;
  }
}

/** 로컬 변경을 먼저 Push한 뒤 서버 변경을 Pull한다. */
export async function syncData(run?: SyncRun): Promise<void> {
  try {
    console.log('[Sync] Starting full sync (Push + Pull)...');

    await pushChanges(run);
    await pullChanges(run);

    console.log('[Sync] Full sync completed');
  } catch (error) {
    console.error('[Sync] Full sync failed:', error);
    throw error;
  }
}

/** 2xx 응답의 대상과 소유권을 확인하고 해당 요청의 SQLite 반영과 ACK를 함께 확정한다. */
const applyPushResponse = async (
  task: SyncQueueItem,
  tableName: SyncTable,
  taskOwnerId: string,
  payload: unknown,
  result: unknown,
): Promise<void> => {
  if (!result || typeof result !== 'object' || !('success' in result) || result.success !== true) {
    throw new Error('동기화 응답이 유효하지 않습니다');
  }
  if (task.action !== 'DELETE') {
    const row = 'data' in result ? result.data : undefined;
    const parsed = RESPONSE_ENTITIES[tableName].parse(row);

    if (parsed.id !== task.recordId) {
      throw new Error('동기화 응답의 기록이 일치하지 않습니다');
    }

    await reconcileServerRecord(tableName, parsed, task.id);
    return;
  }

  const deletion = deleteTripResponse.parse(result).data;

  if (deletion.id !== task.recordId) {
    throw new Error('삭제 확인 응답의 기록이 일치하지 않습니다');
  }

  await runDatabaseTransaction(async () => {
    requireLocalUserId(taskOwnerId);
    const db = getDatabase();
    const entityTable = LOCAL_TABLES[tableName];
    const original = await db.select().from(entityTable).where(eq(entityTable.id, task.recordId)).get();

    if (original && original.userId !== taskOwnerId) {
      throw new Error('삭제 확인 응답의 소유자가 일치하지 않습니다');
    }

    const saved = deleteQueuePayloadSchema.safeParse(payload);
    const savedTripId = saved.success && saved.data.userId === taskOwnerId ? saved.data.tripId : null;
    const originalTripId = original && 'tripId' in original ? original.tripId : null;
    const tripId =
      tableName === 'trips' ? task.recordId : typeof originalTripId === 'string' ? originalTripId : savedTripId;

    if (tripId) {
      await applyConfirmedDeletionInTransaction(tableName, task.recordId, tripId, deletion.deletedAt, {
        completedTaskId: task.id,
      });
    } else {
      // 이전 앱의 요청에 부모 ID가 없어도, 서버가 확인한 자기 기록의 삭제는 보존한다.
      await rememberConfirmedDeletionInTransaction(tableName, task.recordId, null, deletion.deletedAt);
    }
    await db.delete(syncQueue).where(eq(syncQueue.id, task.id));
  });
};
