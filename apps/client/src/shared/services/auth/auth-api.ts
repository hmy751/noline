import { authAxios } from '@/shared/api/axios-instances';
import apiClient from '@/shared/api/fetcher';
import { useAuthStore } from '@/shared/store/auth';
import { loginResponse, getCurrentUserResponse } from '@repo/schema/responses/auth';
import { z } from 'zod';

export { refreshTokens, type RefreshResponse } from './auth-transport';

// ========================================
// Types (Zod 스키마에서 추출)
// ========================================

export type AuthResponse = z.infer<typeof loginResponse>['data'];
export type UserResponse = z.infer<typeof getCurrentUserResponse>['data'];

// ========================================
// Google Login
// ========================================

/**
 * Google ID Token으로 로그인
 * @param idToken - Google OAuth ID Token
 * @param deviceInfo - 디바이스 정보 (선택)
 */
export async function loginWithGoogle(idToken: string, deviceInfo?: string): Promise<AuthResponse> {
  const response = await authAxios.post('/api/auth/google', { idToken, deviceInfo });
  return loginResponse.parse(response.data).data;
}

// ========================================
// Apple Login
// ========================================

/**
 * Apple Identity Token으로 로그인
 * @param identityToken - Apple Identity Token
 * @param authorizationCode - Apple Authorization Code (Token Revoke용)
 * @param user - Apple 사용자 정보 (첫 로그인 시에만 제공)
 * @param deviceInfo - 디바이스 정보 (선택)
 */
export async function loginWithApple(data: {
  identityToken: string;
  authorizationCode: string;
  user?: string;
  email?: string;
  fullName?: { firstName?: string; lastName?: string };
  deviceInfo?: string;
}): Promise<AuthResponse> {
  const response = await authAxios.post('/api/auth/apple', {
    identityToken: data.identityToken,
    authorizationCode: data.authorizationCode,
    user: data.user,
    email: data.email,
    fullName: data.fullName,
    deviceInfo: data.deviceInfo,
  });
  return loginResponse.parse(response.data).data;
}

// ========================================
// Logout
// ========================================
/**
 * 로그아웃 (서버에서 Refresh Token 삭제)
 */
export async function logout(): Promise<void> {
  const refreshToken = useAuthStore.getRefreshToken(useAuthStore.getState().sessionId);

  // 토큰이 없어도 로컬 로그아웃은 진행
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch {
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      console.warn('서버 로그아웃 실패');
    }
  }
}

/** 서버에서 발급됐지만 기기에 적용하지 못한 refresh token도 명시적으로 폐기한다. */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await authAxios.post('/api/auth/logout', { refreshToken });
}

// ========================================
// Get Current User
// ========================================

/**
 * 현재 로그인된 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get('/api/auth/me');
  return getCurrentUserResponse.parse(response).data;
}

// ========================================
// Delete Account
// ========================================

/**
 * 회원 탈퇴
 */
export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/api/auth/account');
}
