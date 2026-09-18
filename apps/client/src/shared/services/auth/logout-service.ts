import { getSyncQueueStats, clearSyncQueue } from '@/shared/services/sync/queue';
import { logout as logoutApi, deleteAccount } from './auth-api';
import { authStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store/useTripStore';
import { withPendingCleanupsPaused } from '@/shared/services/sync/cleanup-job';
import { resetDatabase } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';

export interface LogoutOptions {
  /**
   * 동기화되지 않은 데이터가 있어도 강제 로그아웃
   * @default false
   */
  force?: boolean;
}

export interface LogoutResult {
  success: boolean;
  hasPendingSync?: boolean;
  pendingCount?: number;
  message?: string;
}

/**
 * 로그아웃 전 sync_queue 상태 확인
 *
 * @returns sync_queue 통계
 */
export async function checkPendingSync(): Promise<{
  hasPending: boolean;
  pendingCount: number;
  failedCount: number;
}> {
  const stats = await getSyncQueueStats();

  return {
    hasPending: stats.pending > 0 || stats.inProgress > 0,
    pendingCount: stats.pending + stats.inProgress,
    failedCount: stats.failed,
  };
}

/** 미동기화 작업이 있으면 종료를 보류한다. force는 이 확인을 건너뛴다. */
export async function performLogout(options: LogoutOptions = {}): Promise<LogoutResult> {
  const { force = false } = options;

  try {
    console.log('[AuthSession] Starting logout process...');

    const syncStatus = await checkPendingSync();

    if (syncStatus.hasPending && !force) {
      console.warn(`[AuthSession] Pending sync: ${syncStatus.pendingCount} items`);
      return {
        success: false,
        hasPendingSync: true,
        pendingCount: syncStatus.pendingCount,
        message: `동기화되지 않은 데이터가 ${syncStatus.pendingCount}개 있습니다. 로그아웃하면 이 데이터는 손실됩니다.`,
      };
    }

    // 서버 로그아웃 (Refresh Token 무효화)
    try {
      await logoutApi();
      console.log('[AuthSession] Server logout successful');
    } catch (error) {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn('[AuthSession] Server logout failed (continuing with local logout):', error);
    }

    await clearLocalSession();

    console.log('[AuthSession] Logout completed successfully');

    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  } catch (error) {
    console.error('[AuthSession] Logout failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '로그아웃에 실패했습니다.',
    };
  }
}

/**
 * 강제 로그아웃 (데이터 손실 확인 없이)
 *
 * 세션 만료 시 재로그인 후 다른 계정으로 로그인한 경우 사용
 */
export async function forceLogout(): Promise<LogoutResult> {
  return performLogout({ force: true });
}

/** 서버 계정 삭제 성공 뒤 로컬 세션을 비운다. 미동기화 확인은 로그아웃과 동일하다. */
export async function performDeleteAccount(options: LogoutOptions = {}): Promise<LogoutResult> {
  const { force = false } = options;

  try {
    console.log('[AuthSession] Starting account deletion process...');

    const syncStatus = await checkPendingSync();

    if (syncStatus.hasPending && !force) {
      console.warn(`[AuthSession] Pending sync: ${syncStatus.pendingCount} items`);
      return {
        success: false,
        hasPendingSync: true,
        pendingCount: syncStatus.pendingCount,
        message: `동기화되지 않은 데이터가 ${syncStatus.pendingCount}개 있습니다. 계정을 삭제하면 이 데이터는 손실됩니다.`,
      };
    }

    // 서버 계정 삭제 API 호출 (CASCADE로 모든 데이터 삭제)
    await deleteAccount();
    console.log('[AuthSession] Server account deleted');

    await clearLocalSession();

    console.log('[AuthSession] Account deletion completed successfully');

    return {
      success: true,
      message: '계정이 삭제되었습니다.',
    };
  } catch (error) {
    console.error('[AuthSession] Account deletion failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '계정 삭제에 실패했습니다.',
    };
  }
}

/**
 * 강제 계정 삭제 (데이터 손실 확인 없이)
 */
export async function forceDeleteAccount(): Promise<LogoutResult> {
  return performDeleteAccount({ force: true });
}

/** 로그아웃과 회원 탈퇴가 공유하는 로컬 세션 종료 순서. */
async function clearLocalSession() {
  await withPendingCleanupsPaused(async () => {
    await clearSyncQueue();
    await resetDatabase();
    await authStore.logout();
    useTripStore.getState().setSelectedTripId(null);
    queryClient.clear();
  });
}
