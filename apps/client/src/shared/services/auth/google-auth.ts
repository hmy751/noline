import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
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
 * - Authorization Code를 ID Token으로 교환
 * - ID Token 반환 (서버에서 검증)
 */
export function useGoogleAuth(): {
  signIn: () => Promise<GoogleAuthResponse>;
  isLoading: boolean;
} {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
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

      console.log('🔐 [Google Auth] Result type:', result.type);

      if (result.type === 'success') {
        // 1. 먼저 authentication 객체에서 idToken 확인 (일부 경우 자동 교환됨)
        if (result.authentication?.idToken) {
          console.log('🔐 [Google Auth] ID Token from authentication object');
          return {
            success: true,
            idToken: result.authentication.idToken,
          };
        }

        // 2. Authorization Code가 있으면 수동으로 토큰 교환
        const code = result.params?.code;
        if (code && request?.codeVerifier) {
          console.log('🔐 [Google Auth] Exchanging authorization code for tokens...');

          try {
            const tokenResult = await AuthSession.exchangeCodeAsync(
              {
                clientId: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
                code,
                redirectUri: request.redirectUri,
                extraParams: {
                  code_verifier: request.codeVerifier,
                },
              },
              {
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
              },
            );

            console.log('🔐 [Google Auth] Token exchange successful:', !!tokenResult.idToken);

            if (tokenResult.idToken) {
              return {
                success: true,
                idToken: tokenResult.idToken,
              };
            }
          } catch (exchangeError) {
            console.error('🔐 [Google Auth] Token exchange failed:', exchangeError);
            return {
              success: false,
              error: 'FAILED',
              message: '토큰 교환에 실패했습니다',
            };
          }
        }

        // ID Token을 얻지 못함
        console.error('🔐 [Google Auth] No ID Token available');
        return {
          success: false,
          error: 'FAILED',
          message: 'ID Token을 받지 못했습니다',
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
