import { withDatabaseTransactionsPaused } from '@/shared/db';
import { withSyncPaused } from '@/shared/services/sync/lifecycle';
import { withPendingCleanupsPaused } from '@/shared/services/sync/cleanup-job';

let pendingSessionChange: Promise<unknown> = Promise.resolve();

/** 로그인·로그아웃·계정 삭제의 전체 절차를 순서대로 실행한다.
 * sync와 cleanup을 먼저 종료시킨 뒤 로컬 저장을 멈춰 상호 대기를 피한다.
 * Store의 저장 큐는 토큰 갱신까지 포함한 기기 저장 순서를 별도로 보장한다.
 */
export function withSessionChange<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingSessionChange.then(() =>
    withSyncPaused(() => withPendingCleanupsPaused(() => withDatabaseTransactionsPaused(operation))),
  );
  pendingSessionChange = result.catch(() => undefined);
  return result;
}
