import { create } from 'zustand';
import { getAuthData, saveAuthData, updateTokens, clearAuthData, type UserInfo } from '../services/auth/token-storage';

interface AuthState {
  userId: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  restoreSessionOnce: () => Promise<void>;
  login: (data: { accessToken: string; refreshToken: string; userId: string; userInfo?: UserInfo }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: (data: { accessToken: string; refreshToken: string }) => Promise<void>;
  setSessionExpired: (expired: boolean) => void;
}

const SIGNED_OUT_STATE = {
  userId: null,
  userInfo: null,
  isAuthenticated: false,
  isSessionExpired: false,
};

export function createAuthStore() {
  return create<AuthState>((set) => {
    let sessionRestore: Promise<void> | null = null;

    // 오프라인 진입을 위해 서버 검증 없이 저장된 사용자와 토큰의 존재로 복원한다.
    async function restoreStoredSession() {
      try {
        const { userId, accessToken, userInfo } = await getAuthData();

        if (!userId || !accessToken) {
          console.log('[AuthStore] session not found');
          set(SIGNED_OUT_STATE);
          return;
        }

        console.log('[AuthStore] session restored');
        set({
          userId,
          userInfo,
          isAuthenticated: true,
          isSessionExpired: false,
        });
      } catch (error) {
        console.error('[AuthStore] session restore failed', { error });
        // 읽기 실패는 로그인 화면으로 보내되 저장된 인증 정보는 지우지 않는다.
        set(SIGNED_OUT_STATE);
      }
    }

    return {
      ...SIGNED_OUT_STATE,
      restoreSessionOnce: () => {
        // 완료 후에도 재사용해 이후 로그인·로그아웃 상태를 저장소 값으로 덮지 않는다.
        if (!sessionRestore) {
          sessionRestore = restoreStoredSession();
        }

        return sessionRestore;
      },

      login: async (data) => {
        await saveAuthData(data);
        console.log('[AuthStore] logged in', { userId: data.userId });
        set({
          userId: data.userId,
          userInfo: data.userInfo ?? null,
          isAuthenticated: true,
          isSessionExpired: false,
        });
      },

      logout: async () => {
        await clearAuthData();
        console.log('[AuthStore] logged out');
        set(SIGNED_OUT_STATE);
      },

      refreshTokens: async (data) => {
        await updateTokens(data);
        console.log('[AuthStore] tokens refreshed');
        set({
          isSessionExpired: false,
        });
      },

      // 인증 갱신까지 실패했을 때 세션 만료 안내에 사용한다.
      setSessionExpired: (expired) => {
        console.log('[AuthStore] session expiry changed', { expired });
        set({ isSessionExpired: expired });
      },
    };
  });
}

export const useAuthStore = createAuthStore();

// React 밖의 서비스에서 동일한 인증 상태와 action을 사용한다.
export const authStore = {
  get userId() {
    return useAuthStore.getState().userId;
  },
  get userInfo() {
    return useAuthStore.getState().userInfo;
  },
  get isAuthenticated() {
    return useAuthStore.getState().isAuthenticated;
  },
  get isSessionExpired() {
    return useAuthStore.getState().isSessionExpired;
  },
  async restoreSessionOnce() {
    await useAuthStore.getState().restoreSessionOnce();
  },
  async login(data: { accessToken: string; refreshToken: string; userId: string; userInfo?: UserInfo }) {
    await useAuthStore.getState().login(data);
  },
  async logout() {
    await useAuthStore.getState().logout();
  },
  async refreshTokens(data: { accessToken: string; refreshToken: string }) {
    await useAuthStore.getState().refreshTokens(data);
  },
  setSessionExpired(expired: boolean) {
    useAuthStore.getState().setSessionExpired(expired);
  },
};
