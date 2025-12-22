import { authAxios } from '@/shared/api/axios-instances';
import { loginResponse, refreshTokenResponse, getCurrentUserResponse } from '@repo/schema/responses/auth';
import { z } from 'zod';
import { getAccessToken, getRefreshToken } from './token-storage';

// ========================================
// Types (Zod 스키마에서 추출)
// ========================================

export type AuthResponse = z.infer<typeof loginResponse>['data'];
export type RefreshResponse = z.infer<typeof refreshTokenResponse>['data'];
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
  try {
    const response = await authAxios.post('/api/auth/google', {
      idToken,
      deviceInfo,
    });

    const validated = loginResponse.parse(response.data);
    return validated.data;
  } catch (error) {
    console.error('❌ [Auth API] Google login error:', error);
    throw error;
  }
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
export async function loginWithApple(data: {
  identityToken: string;
  user?: string;
  email?: string;
  fullName?: { firstName?: string; lastName?: string };
  deviceInfo?: string;
}): Promise<AuthResponse> {
  try {
    const response = await authAxios.post('/api/auth/apple', {
      identityToken: data.identityToken,
      user: data.user,
      email: data.email,
      fullName: data.fullName,
      deviceInfo: data.deviceInfo,
    });

    const validated = loginResponse.parse(response.data);
    return validated.data;
  } catch (error) {
    console.error('❌ [Auth API] Apple login error:', error);
    throw error;
  }
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

  try {
    const response = await authAxios.post('/api/auth/refresh', {
      refreshToken,
      deviceInfo,
    });

    const validated = refreshTokenResponse.parse(response.data);
    return validated.data;
  } catch (error) {
    console.error('❌ [Auth API] Token refresh error:', error);
    throw error;
  }
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
      await authAxios.post('/api/auth/logout', { refreshToken });
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
 * - Authorization 헤더를 수동으로 추가 (순환 참조 방지)
 */
export async function getCurrentUser(): Promise<UserResponse> {
  try {
    const accessToken = await getAccessToken();
    const response = await authAxios.get('/api/auth/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });

    const validated = getCurrentUserResponse.parse(response.data);
    return validated.data;
  } catch (error) {
    console.error('❌ [Auth API] Get current user error:', error);
    throw error;
  }
}

// ========================================
// Delete Account
// ========================================

/**
 * 회원 탈퇴
 * - Authorization 헤더를 수동으로 추가 (순환 참조 방지)
 */
export async function deleteAccount(): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    await authAxios.delete('/api/auth/account', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  } catch (error) {
    console.error('❌ [Auth API] Delete account error:', error);
    throw error;
  }
}
