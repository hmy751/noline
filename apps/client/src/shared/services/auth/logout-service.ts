import { getSyncQueueStats, clearSyncQueue } from '@/shared/services/sync/queue';
import { logout as logoutApi, deleteAccount } from './auth-api';
import { authStore } from '@/shared/store/auth';
import { resetDatabase } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';

// ========================================
// Types
// ========================================

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

// ========================================
// Logout Service
// ========================================

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

/**
 * 전체 로그아웃 프로세스
 *
 * 1. sync_queue 확인 (동기화되지 않은 데이터 경고)
 * 2. 서버 로그아웃 (Refresh Token 무효화)
 * 3. 로컬 DB 삭제
 * 4. Auth Store 초기화
 * 5. React Query 캐시 무효화
 *
 * @param options - 로그아웃 옵션
 * @returns 로그아웃 결과
 *
 * @example
 * ```ts
 * // 일반 로그아웃 (pending이 있으면 경고)
 * const result = await performLogout();
 * if (!result.success && result.hasPendingSync) {
 *   // 사용자에게 확인 요청
 *   const confirmed = await confirm('동기화되지 않은 데이터가 있습니다. 계속하시겠습니까?');
 *   if (confirmed) {
 *     await performLogout({ force: true });
 *   }
 * }
 *
 * // 강제 로그아웃
 * await performLogout({ force: true });
 * ```
 */
export async function performLogout(options: LogoutOptions = {}): Promise<LogoutResult> {
  const { force = false } = options;

  try {
    console.log('🔐 [Logout] Starting logout process...');

    // 1. sync_queue 확인
    const syncStatus = await checkPendingSync();

    if (syncStatus.hasPending && !force) {
      console.warn(`⚠️ [Logout] Pending sync: ${syncStatus.pendingCount} items`);
      return {
        success: false,
        hasPendingSync: true,
        pendingCount: syncStatus.pendingCount,
        message: `동기화되지 않은 데이터가 ${syncStatus.pendingCount}개 있습니다. 로그아웃하면 이 데이터는 손실됩니다.`,
      };
    }

    // 2. 서버 로그아웃 (Refresh Token 무효화)
    try {
      await logoutApi();
      console.log('✅ [Logout] Server logout successful');
    } catch (error) {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn('⚠️ [Logout] Server logout failed (continuing with local logout):', error);
    }

    // 3. sync_queue 삭제
    await clearSyncQueue();
    console.log('✅ [Logout] Sync queue cleared');

    // 4. 로컬 DB 리셋 (모든 테이블 재생성)
    await resetDatabase();
    console.log('✅ [Logout] Local database reset');

    // 5. Auth Store 초기화
    await authStore.logout();
    console.log('✅ [Logout] Auth store cleared');

    // 6. React Query 캐시 전체 무효화
    queryClient.clear();
    console.log('✅ [Logout] React Query cache cleared');

    console.log('✅ [Logout] Logout completed successfully');

    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  } catch (error) {
    console.error('❌ [Logout] Logout failed:', error);
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

// ========================================
// Delete Account Service
// ========================================

/**
 * 회원 탈퇴 프로세스
 *
 * 1. sync_queue 확인 (동기화되지 않은 데이터 경고)
 * 2. 서버 계정 삭제 (CASCADE로 모든 데이터 삭제)
 * 3. 로컬 DB 삭제
 * 4. Auth Store 초기화
 * 5. React Query 캐시 무효화
 *
 * @param options - 삭제 옵션
 * @returns 삭제 결과
 *
 * @example
 * ```ts
 * // 일반 삭제 (pending이 있으면 경고)
 * const result = await performDeleteAccount();
 * if (!result.success && result.hasPendingSync) {
 *   // 사용자에게 확인 요청
 *   const confirmed = await confirm('동기화되지 않은 데이터가 있습니다. 계속하시겠습니까?');
 *   if (confirmed) {
 *     await performDeleteAccount({ force: true });
 *   }
 * }
 *
 * // 강제 삭제
 * await performDeleteAccount({ force: true });
 * ```
 */
export async function performDeleteAccount(options: LogoutOptions = {}): Promise<LogoutResult> {
  const { force = false } = options;

  try {
    console.log('🗑️ [DeleteAccount] Starting account deletion process...');

    // 1. sync_queue 확인
    const syncStatus = await checkPendingSync();

    if (syncStatus.hasPending && !force) {
      console.warn(`⚠️ [DeleteAccount] Pending sync: ${syncStatus.pendingCount} items`);
      return {
        success: false,
        hasPendingSync: true,
        pendingCount: syncStatus.pendingCount,
        message: `동기화되지 않은 데이터가 ${syncStatus.pendingCount}개 있습니다. 계정을 삭제하면 이 데이터는 손실됩니다.`,
      };
    }

    // 2. 서버 계정 삭제 API 호출 (CASCADE로 모든 데이터 삭제)
    await deleteAccount();
    console.log('✅ [DeleteAccount] Server account deleted');

    // 3. sync_queue 삭제
    await clearSyncQueue();
    console.log('✅ [DeleteAccount] Sync queue cleared');

    // 4. 로컬 DB 리셋 (모든 테이블 재생성)
    await resetDatabase();
    console.log('✅ [DeleteAccount] Local database reset');

    // 5. Auth Store 초기화
    await authStore.logout();
    console.log('✅ [DeleteAccount] Auth store cleared');

    // 6. React Query 캐시 전체 무효화
    queryClient.clear();
    console.log('✅ [DeleteAccount] React Query cache cleared');

    console.log('✅ [DeleteAccount] Account deletion completed successfully');

    return {
      success: true,
      message: '계정이 삭제되었습니다.',
    };
  } catch (error) {
    console.error('❌ [DeleteAccount] Account deletion failed:', error);
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
