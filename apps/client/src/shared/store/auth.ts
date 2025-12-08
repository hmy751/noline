import { create } from 'zustand';
import { getAuthData, saveAuthData, updateTokens, clearAuthData, hasAuthData } from '../services/auth/token-storage';

// ========================================
// Types
// ========================================

interface AuthState {
  // State
  userId: string | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  isInitialized: boolean;

  // Actions
  init: () => Promise<void>;
  login: (data: { accessToken: string; refreshToken: string; userId: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: (data: { accessToken: string; refreshToken: string }) => Promise<void>;
  setSessionExpired: (expired: boolean) => void;
}

// ========================================
// Store
// ========================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  userId: null,
  isAuthenticated: false,
  isSessionExpired: false,
  isInitialized: false,

  /**
   * 앱 시작 시 SecureStore에서 인증 데이터 복원
   * - 토큰 존재 여부만 확인 (만료 무시 - 오프라인 지원)
   */
  init: async () => {
    if (get().isInitialized) return;

    try {
      const { userId, accessToken } = await getAuthData();

      if (userId && accessToken) {
        console.log('🔐 [AuthStore] Restored auth from SecureStore');
        set({
          userId,
          isAuthenticated: true,
          isSessionExpired: false,
          isInitialized: true,
        });
      } else {
        console.log('🔐 [AuthStore] No auth data found');
        set({
          userId: null,
          isAuthenticated: false,
          isSessionExpired: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('🔐 [AuthStore] Failed to restore auth:', error);
      set({
        userId: null,
        isAuthenticated: false,
        isSessionExpired: false,
        isInitialized: true,
      });
    }
  },

  /**
   * 로그인 성공 시 토큰 저장 + 상태 업데이트
   */
  login: async (data) => {
    await saveAuthData(data);
    console.log('🔐 [AuthStore] Login successful');
    set({
      userId: data.userId,
      isAuthenticated: true,
      isSessionExpired: false,
    });
  },

  /**
   * 로그아웃 시 토큰 삭제 + 상태 초기화
   */
  logout: async () => {
    await clearAuthData();
    console.log('🔐 [AuthStore] Logout completed');
    set({
      userId: null,
      isAuthenticated: false,
      isSessionExpired: false,
    });
  },

  /**
   * 토큰 갱신 성공 시 새 토큰 저장
   */
  refreshTokens: async (data) => {
    await updateTokens(data);
    console.log('🔐 [AuthStore] Tokens refreshed');
    set({
      isSessionExpired: false,
    });
  },

  /**
   * 세션 만료 상태 설정
   * - 401 에러 + refresh 실패 시 true로 설정
   * - 재로그인 성공 시 false로 복구
   */
  setSessionExpired: (expired) => {
    console.log(`🔐 [AuthStore] Session expired: ${expired}`);
    set({ isSessionExpired: expired });
  },
}));

// ========================================
// Non-React Access Helper
// ========================================

/**
 * 비-React 환경(일반 함수 등)에서 상태 접근을 위한 헬퍼
 */
export const authStore = {
  get userId() {
    return useAuthStore.getState().userId;
  },
  get isAuthenticated() {
    return useAuthStore.getState().isAuthenticated;
  },
  get isSessionExpired() {
    return useAuthStore.getState().isSessionExpired;
  },
  get isInitialized() {
    return useAuthStore.getState().isInitialized;
  },
  async init() {
    await useAuthStore.getState().init();
  },
  async login(data: { accessToken: string; refreshToken: string; userId: string }) {
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
