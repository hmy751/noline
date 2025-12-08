import apiClient from '@/shared/api/fetcher';
import { getRefreshToken } from './token-storage';

// ========================================
// Types
// ========================================

/**
 * 로그인 응답 타입
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    profileImageUrl: string | null;
    provider: 'google' | 'apple';
  };
}

/**
 * 토큰 갱신 응답 타입
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * 사용자 정보 응답 타입
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  profileImageUrl: string | null;
  provider: 'google' | 'apple';
  createdAt: string;
}

// ========================================
// Google Login
// ========================================

/**
 * Google ID Token으로 로그인
 * @param idToken - Google OAuth ID Token
 * @param deviceInfo - 디바이스 정보 (선택)
 */
export async function loginWithGoogle(idToken: string, deviceInfo?: string): Promise<AuthResponse> {
  const response = await apiClient.post('/api/auth/google', {
    idToken,
    deviceInfo,
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Google 로그인 실패');
  }

  return response.data;
}

// ========================================
// Apple Login
// ========================================

/**
 * Apple Identity Token으로 로그인
 * @param identityToken - Apple Identity Token
 * @param user - Apple 사용자 정보 (첫 로그인 시에만 제공)
 * @param deviceInfo - 디바이스 정보 (선택)
 */
export async function loginWithApple(
  identityToken: string,
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  },
  deviceInfo?: string,
): Promise<AuthResponse> {
  const response = await apiClient.post('/api/auth/apple', {
    identityToken,
    user,
    deviceInfo,
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Apple 로그인 실패');
  }

  return response.data;
}

// ========================================
// Token Refresh
// ========================================

/**
 * Refresh Token으로 새 토큰 발급 (Rolling Refresh)
 * @param deviceInfo - 디바이스 정보 (선택)
 */
export async function refreshTokens(deviceInfo?: string): Promise<RefreshResponse> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh Token이 없습니다');
  }

  const response = await apiClient.post('/api/auth/refresh', {
    refreshToken,
    deviceInfo,
  });

  if (!response.success) {
    throw new Error(response.error?.message || '토큰 갱신 실패');
  }

  return response.data;
}

// ========================================
// Logout
// ========================================

/**
 * 로그아웃 (서버에서 Refresh Token 삭제)
 */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();

  // 토큰이 없어도 로컬 로그아웃은 진행
  if (refreshToken) {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } catch (error) {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn('서버 로그아웃 실패:', error);
    }
  }
}

// ========================================
// Get Current User
// ========================================

/**
 * 현재 로그인된 사용자 정보 조회
 * - Authorization 헤더 필요 (interceptor에서 추가)
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get('/api/auth/me');

  if (!response.success) {
    throw new Error(response.error?.message || '사용자 정보 조회 실패');
  }

  return response.data;
}

// ========================================
// Delete Account
// ========================================

/**
 * 회원 탈퇴
 * - Authorization 헤더 필요 (interceptor에서 추가)
 */
export async function deleteAccount(): Promise<void> {
  const response = await apiClient.delete('/api/auth/account');

  if (!response.success) {
    throw new Error(response.error?.message || '회원 탈퇴 실패');
  }
}
