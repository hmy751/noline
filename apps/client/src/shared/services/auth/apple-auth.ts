import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// ========================================
// Types
// ========================================

export interface AppleAuthResult {
  success: true;
  identityToken: string;
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface AppleAuthError {
  success: false;
  error: 'CANCELLED' | 'FAILED' | 'NOT_AVAILABLE';
  message: string;
}

export type AppleAuthResponse = AppleAuthResult | AppleAuthError;

// ========================================
// Availability Check
// ========================================

/**
 * Apple 로그인 가능 여부 확인 (동기)
 * - iOS에서만 사용 가능
 * - Android/Web에서는 사용 불가
 */
export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios';
}

// ========================================
// Apple Sign In
// ========================================

/**
 * Apple 로그인 실행
 * - Identity Token 반환 (서버에서 검증)
 * - 첫 로그인 시에만 email/name 제공
 */
export async function signInWithApple(): Promise<AppleAuthResponse> {
  // 가용성 확인
  const isAvailable = isAppleAuthAvailable();
  if (!isAvailable) {
    return {
      success: false,
      error: 'NOT_AVAILABLE',
      message: 'Apple 로그인은 iOS 13 이상에서만 사용 가능합니다',
    };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });

    // Identity Token 필수
    if (!credential.identityToken) {
      return {
        success: false,
        error: 'FAILED',
        message: 'Identity Token을 받지 못했습니다',
      };
    }

    return {
      success: true,
      identityToken: credential.identityToken,
      user: {
        email: credential.email ?? undefined,
        name: credential.fullName
          ? {
              firstName: credential.fullName.givenName ?? undefined,
              lastName: credential.fullName.familyName ?? undefined,
            }
          : undefined,
      },
    };
  } catch (error) {
    // 사용자 취소
    if (error instanceof Error && error.message.includes('ERR_CANCELED')) {
      return {
        success: false,
        error: 'CANCELLED',
        message: '로그인이 취소되었습니다',
      };
    }

    // AppleAuthentication 에러 코드 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'CANCELLED',
        message: '로그인이 취소되었습니다',
      };
    }

    console.error('Apple 로그인 에러:', error);
    return {
      success: false,
      error: 'FAILED',
      message: error instanceof Error ? error.message : '알 수 없는 에러',
    };
  }
}

// ========================================
// Apple Sign In Button Component Export
// ========================================

/**
 * Apple 로그인 버튼 컴포넌트 재export
 * - 네이티브 Apple 버튼 스타일 사용
 */
export { AppleAuthenticationButton } from 'expo-apple-authentication';
export { AppleAuthenticationButtonType, AppleAuthenticationButtonStyle } from 'expo-apple-authentication';
