import syncApiClient from './api';
import { getPendingTasks, deleteTask, updateTaskStatus, retryFailedTask } from './queue';
import { getLastSyncedAt, setLastSyncedAt } from './storage';
import { upsertTrips, upsertSchedules, upsertExpenses } from '@/shared/db/utils';
import { queryClient } from '@/shared/lib/queryClient';
import { db, tripActivations } from '@/shared/db';
import { eq } from 'drizzle-orm';
import { processPendingCleanups } from './cleanup-job';
import { AuthRequiredError } from '@/shared/services/auth';

/**
 * Sync push 대상 테이블 → 서버 endpoint 매핑.
 *
 * 새 sync-owned entity가 추가될 때 여기에만 한 줄을 더 한다. push 엔진은
 * tableName 으로 endpoint 만 lookup하고, action 별 HTTP 메서드는
 * 아래 helper에서 결정한다.
 */
const SYNC_PUSH_ENDPOINTS = {
  trips: '/api/trips',
  schedules: '/api/schedules',
  expenses: '/api/expenses',
} as const;

type SyncTable = keyof typeof SYNC_PUSH_ENDPOINTS;
type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

function isSyncTable(tableName: string): tableName is SyncTable {
  return tableName in SYNC_PUSH_ENDPOINTS;
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

/**
 * Push 동기화 엔진
 *
 * sync_queue의 PENDING 작업을 서버로 전송
 * - FIFO 순서 보장 (createdAt 기준)
 * - 성공 시 sync_queue에서 삭제
 * - 실패 시 상태를 FAILED로 변경
 */
export async function pushChanges(): Promise<void> {
  try {
    // 1. PENDING 작업 조회 (FIFO 순서)
    const tasks = await getPendingTasks();

    if (tasks.length === 0) {
      console.log('📭 [Sync] No pending tasks');
      return;
    }

    console.log(`📤 [Sync] Starting push: ${tasks.length} tasks`);

    // 인증 에러 발생 여부 추적
    let authErrorOccurred = false;

    // 2. 순차적으로 처리
    for (const task of tasks) {
      try {
        console.log(`🔄 [Sync] Processing: ${task.action} ${task.tableName}/${task.recordId}`);

        // 상태 변경: PENDING → IN_PROGRESS
        await updateTaskStatus(task.id, 'IN_PROGRESS');

        if (!isSyncTable(task.tableName)) {
          throw new Error(`Unknown table: ${task.tableName}`);
        }

        const payload = JSON.parse(task.payload);
        await pushTaskToServer(task.tableName, task.action as SyncAction, task.recordId, payload);

        // 성공 시 sync_queue에서 삭제
        await deleteTask(task.id);

        console.log(`✅ [Sync] Success: ${task.action} ${task.tableName}/${task.recordId}`);
      } catch (error) {
        // 7. AuthRequiredError: PENDING 유지 + 루프 중단
        if (error instanceof AuthRequiredError) {
          console.warn(`🔐 [Sync] AuthRequiredError: ${task.tableName}/${task.recordId} - keeping PENDING`);
          // 상태를 다시 PENDING으로 복구 (IN_PROGRESS → PENDING)
          await retryFailedTask(task.id);
          // 인증 에러 플래그 설정
          authErrorOccurred = true;
          // 인증 에러 시 나머지 작업도 실패할 것이므로 루프 중단
          break;
        }

        // 8. 그 외 에러: FAILED로 변경
        console.error(`❌ [Sync] Failed: ${task.action} ${task.tableName}/${task.recordId}`, error);
        await updateTaskStatus(task.id, 'FAILED', task.retryCount + 1);
      }
    }

    // 인증 에러 발생 시 cleanup 건너뛰기
    if (authErrorOccurred) {
      console.log('⏭️ [Sync] Skipping cleanup due to auth error');
      return;
    }

    console.log(`✅ [Sync] Push completed`);

    // 9. Push 완료 후 pending cleanup 처리
    try {
      console.log('🧹 [Sync] Checking for pending cleanups...');
      const processedCount = await processPendingCleanups();
      if (processedCount > 0) {
        console.log(`✅ [Sync] Processed ${processedCount} pending cleanups`);
        // React Query 캐시 무효화 (cleanup으로 deletedAt 업데이트됨)
        queryClient.invalidateQueries({ queryKey: ['trip'] });
        queryClient.invalidateQueries({ queryKey: ['schedule'] });
        queryClient.invalidateQueries({ queryKey: ['expense'] });
      }
    } catch (error) {
      console.error('⚠️ [Sync] Failed to process pending cleanups (ignored):', error);
      // cleanup 실패해도 Push는 성공으로 처리
    }
  } catch (error) {
    console.error('❌ [Sync] Push failed:', error);
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
    // 1. 마지막 동기화 시간 조회
    const lastSyncedAt = await getLastSyncedAt();

    // 2. 활성화된 여행 ID 조회 (tripActivations 테이블 사용)
    const activatedTrips = await db
      .select({ tripId: tripActivations.tripId })
      .from(tripActivations)
      .where(eq(tripActivations.isActivated, true));
    const activatedTripIds = activatedTrips.map((activation) => activation.tripId);

    // ✅ 활성화된 여행이 없으면 Pull 건너뛰기
    // (비활성 상태에서는 로컬 DB에 데이터를 저장하지 않음)
    if (activatedTripIds.length === 0) {
      console.log('⏭️ [Sync] Skipping pull: No activated trips');
      return;
    }

    console.log('📥 [Sync] Starting pull...', {
      lastSyncedAt: lastSyncedAt?.toISOString() || 'Never synced (초기 동기화)',
      activatedTripIds,
    });

    // 3. 서버에서 데이터 가져오기 (이 시점에 activatedTripIds.length > 0 임이 보장됨)
    const response = await syncApiClient.get('/api/sync/pull', {
      params: {
        lastSyncedAt: lastSyncedAt?.toISOString(),
        activatedTripIds: activatedTripIds.join(','),
      },
    });

    // 정책: 서버 응답은 { success, data } 구조
    const { trips, schedules, expenses, serverTime } = response.data.data;

    console.log('📥 [Sync] Received from server:', {
      trips: trips?.length || 0,
      schedules: schedules?.length || 0,
      expenses: expenses?.length || 0,
      serverTime,
    });

    // 3. 로컬 DB에 Upsert (ISO string 그대로 저장)
    if (trips && trips.length > 0) {
      const normalizedTrips = (trips as Array<Record<string, unknown>>).map((trip) => ({
        ...trip,
        // ✅ ISO string 그대로 저장 (TEXT 컬럼)
        version: trip.version ?? 1,
      }));
      await upsertTrips(normalizedTrips as never[]);
    }

    if (schedules && schedules.length > 0) {
      const normalizedSchedules = (schedules as Array<Record<string, unknown>>).map((schedule) => ({
        ...schedule,
        // ✅ ISO string 그대로 저장 (TEXT 컬럼)
        version: schedule.version ?? 1,
      }));
      await upsertSchedules(normalizedSchedules as never[]);
    }

    if (expenses && expenses.length > 0) {
      const normalizedExpenses = (expenses as Array<Record<string, unknown>>).map((expense) => ({
        ...expense,
        // ✅ ISO string 그대로 저장 (TEXT 컬럼)
        version: expense.version ?? 1,
      }));
      await upsertExpenses(normalizedExpenses as never[]);
    }

    // 4. React Query 캐시 무효화 → UI 자동 갱신
    queryClient.invalidateQueries({ queryKey: ['trip'] });
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    queryClient.invalidateQueries({ queryKey: ['expense'] });

    console.log('✅ [Sync] React Query cache invalidated');

    // 5. 마지막 동기화 시간 업데이트
    await setLastSyncedAt(new Date(serverTime));

    console.log('✅ [Sync] Pull completed');
  } catch (error) {
    console.error('❌ [Sync] Pull failed:', error);
    throw error;
  }
}

/**
 * 통합 동기화 (Push + Pull)
 *
 * 1. Push: 로컬 변경사항을 서버로 전송
 * 2. Pull: 서버 최신 데이터를 로컬로 가져오기
 *
 * SyncProvider에서 자동으로 호출됨:
 * - 앱 시작 시
 * - 네트워크 복구 시
 * - 주기적 동기화 (5분마다)
 *
 * push는 가볍기 때문에 pull과 같이 동작하는것으로 결정, 다만 순서는 지켜야 됨
 *
 * @example
 * ```typescript
 * await syncData();  // Push → Pull 순차 실행
 * ```
 */
export async function syncData(): Promise<void> {
  try {
    console.log('🔄 [Sync] Starting full sync (Push + Pull)...');

    // Push 먼저! (로컬 변경사항 전송)
    await pushChanges();

    // Pull 나중! (서버 최신 데이터 가져오기)
    await pullChanges();

    console.log('✅ [Sync] Full sync completed');
  } catch (error) {
    console.error('❌ [Sync] Full sync failed:', error);
    throw error;
  }
}

/**
 * 수동 동기화 트리거 (디버깅용)
 *
 * 사용자가 명시적으로 동기화를 실행할 때 사용
 *
 * @example
 * ```typescript
 * <Button onPress={triggerSync}>수동 동기화</Button>
 * ```
 */
export async function triggerSync(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 [Sync] Manual sync triggered');

    await syncData(); // Push + Pull

    return {
      success: true,
      message: '동기화가 완료되었습니다.',
    };
  } catch (error) {
    console.error('❌ [Sync] Manual sync failed:', error);

    return {
      success: false,
      message: '동기화에 실패했습니다.',
    };
  }
}
