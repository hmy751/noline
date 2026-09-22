import { queryClient } from '@/shared/lib/queryClient';
import { useAuthStore } from '@/shared/store/auth';
import { withSessionChange } from './session-lifecycle';
import { revokeRefreshToken } from './auth-api';
import type { LoginData } from './token-storage';

/** 서버 로그인 성공 뒤 같은 로컬 계정의 인증만 복구한다. */
export async function completeLogin(data: LoginData): Promise<void> {
  try {
    await withSessionChange(() => useAuthStore.getState().saveAndApplySession(data));
  } catch (error) {
    try {
      await revokeRefreshToken(data.refreshToken);
    } catch {
      console.warn('[Auth] failed to revoke unapplied login token');
    }
    throw error;
  }

  // 세션 저장이 끝난 시점에 로그인은 완료다. 이후 화면 갱신 실패가
  // 저장된 인증까지 실패한 것처럼 보이지 않게 분리한다.
  try {
    await queryClient.invalidateQueries();
  } catch (error) {
    console.error('[Auth] query refresh after login failed', error);
  }
}
