import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID } from '@env';

// OAuth 세션 완료 처리 (필수)
WebBrowser.maybeCompleteAuthSession();

// ========================================
// Types
// ========================================

export interface GoogleAuthResult {
  success: true;
  idToken: string;
}

export interface GoogleAuthError {
  success: false;
  error: 'CANCELLED' | 'FAILED' | 'NOT_CONFIGURED';
  message: string;
}

export type GoogleAuthResponse = GoogleAuthResult | GoogleAuthError;

// ========================================
// Configuration Check
// ========================================

/**
 * Google OAuth 설정 확인
 */
export function isGoogleAuthConfigured(): boolean {
  return !!(EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
}

// ========================================
// Google Auth Hook
// ========================================

/**
 * Google 로그인 훅
 * - Expo AuthSession 사용
 * - ID Token 반환 (서버에서 검증)
 */
export function useGoogleAuth(): {
  signIn: () => Promise<GoogleAuthResponse>;
  isLoading: boolean;
} {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // androidClientId는 필요시 추가
  });

  const signIn = async (): Promise<GoogleAuthResponse> => {
    // 설정 확인
    if (!isGoogleAuthConfigured()) {
      return {
        success: false,
        error: 'NOT_CONFIGURED',
        message: 'Google OAuth가 설정되지 않았습니다',
      };
    }

    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        const idToken = result.params.id_token;

        if (!idToken) {
          return {
            success: false,
            error: 'FAILED',
            message: 'ID Token을 받지 못했습니다',
          };
        }

        return {
          success: true,
          idToken,
        };
      }

      if (result.type === 'cancel') {
        return {
          success: false,
          error: 'CANCELLED',
          message: '로그인이 취소되었습니다',
        };
      }

      return {
        success: false,
        error: 'FAILED',
        message: '로그인에 실패했습니다',
      };
    } catch (error) {
      console.error('Google 로그인 에러:', error);
      return {
        success: false,
        error: 'FAILED',
        message: error instanceof Error ? error.message : '알 수 없는 에러',
      };
    }
  };

  return {
    signIn,
    isLoading: !request,
  };
}
