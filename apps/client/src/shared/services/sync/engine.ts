import syncApiClient from './api';
import { getPendingTasks, deleteTask, updateTaskStatus } from './queue';

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

    // 2. 순차적으로 처리
    for (const task of tasks) {
      try {
        console.log(`🔄 [Sync] Processing: ${task.action} ${task.tableName}/${task.recordId}`);

        // 상태 변경: PENDING → IN_PROGRESS
        await updateTaskStatus(task.id, 'IN_PROGRESS');

        // 3. Payload 파싱
        const payload = JSON.parse(task.payload);

        // 4. 테이블별 엔드포인트 분기
        let endpoint = '';
        if (task.tableName === 'trips') {
          endpoint = '/api/trips';
        } else if (task.tableName === 'schedules') {
          endpoint = '/api/schedules';
        } else {
          throw new Error(`Unknown table: ${task.tableName}`);
        }

        // 5. 액션별 HTTP 메서드 결정
        if (task.action === 'CREATE') {
          await syncApiClient.post(endpoint, payload);
        } else if (task.action === 'UPDATE') {
          await syncApiClient.put(`${endpoint}/${task.recordId}`, payload);
        } else if (task.action === 'DELETE') {
          await syncApiClient.delete(`${endpoint}/${task.recordId}`);
        } else {
          throw new Error(`Unknown action: ${task.action}`);
        }

        // 6. 성공 시 sync_queue에서 삭제
        await deleteTask(task.id);

        console.log(`✅ [Sync] Success: ${task.action} ${task.tableName}/${task.recordId}`);
      } catch (error) {
        // 7. 실패 시 상태 업데이트
        console.error(`❌ [Sync] Failed: ${task.action} ${task.tableName}/${task.recordId}`, error);

        await updateTaskStatus(task.id, 'FAILED', task.retryCount + 1);
      }
    }

    console.log(`✅ [Sync] Push completed`);
  } catch (error) {
    console.error('❌ [Sync] Push failed:', error);
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

    await pushChanges();

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
