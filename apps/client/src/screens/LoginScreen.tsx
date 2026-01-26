import { View, Text, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Plane } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import {
  useGoogleAuth,
  isGoogleAuthConfigured,
  signInWithApple,
  isAppleAuthAvailable,
  AppleAuthenticationButton,
  AppleAuthenticationButtonType,
  AppleAuthenticationButtonStyle,
  loginWithGoogle,
  loginWithApple,
} from '@/shared/services/auth';
import { useAuthStore } from '@/shared/store/auth';
import { resetDatabase } from '@/shared/db';
import { clearSyncQueue } from '@/shared/services/sync/queue';
import { queryClient } from '@/shared/lib/queryClient';

/**
 * 로그인 화면
 *
 * - Google 로그인 (모든 플랫폼)
 * - Apple 로그인 (iOS only)
 * - Guest 모드 없음 (App Store 심사 시 Sign in with Apple 사용)
 */
export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, userId: currentUserId, isSessionExpired } = useAuthStore();

  // Google OAuth Hook
  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth();

  /**
   * 다른 계정으로 로그인 시 로컬 데이터 정리
   *
   * 세션 만료 후 재로그인 시 다른 계정으로 로그인하면:
   * 1. 기존 로컬 데이터 삭제 (다른 사용자 데이터이므로)
   * 2. sync_queue 삭제 (기존 사용자의 미동기화 데이터)
   * 3. React Query 캐시 초기화
   */
  const handleDifferentAccountLogin = async (newUserId: string): Promise<boolean> => {
    // 기존 userId가 없거나 같은 계정이면 정리 불필요
    if (!currentUserId || currentUserId === newUserId) {
      return true;
    }

    console.log('⚠️ [Login] Different account detected:', { currentUserId, newUserId });

    // 사용자 확인
    return new Promise((resolve) => {
      Alert.alert(
        '다른 계정으로 로그인',
        '이전 계정과 다른 계정으로 로그인하려고 합니다. 이 기기에 저장된 이전 계정의 데이터가 삭제됩니다.',
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '계속',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ [Login] Cleaning up previous account data...');
                await clearSyncQueue();
                await resetDatabase();
                queryClient.clear();
                console.log('✅ [Login] Previous account data cleaned up');
                resolve(true);
              } catch (cleanupError) {
                console.error('❌ [Login] Failed to clean up previous account data:', cleanupError);
                resolve(false);
              }
            },
          },
        ],
      );
    });
  };

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Google OAuth로 idToken 획득
      const googleResult = await signInWithGoogle();

      if (!googleResult.success) {
        if (googleResult.error === 'CANCELLED') {
          console.log('🔐 [Login] Google login cancelled');
          return;
        }
        throw new Error(googleResult.message || 'Google 로그인 실패');
      }

      // 2. 서버로 idToken 전송하여 인증
      const authResponse = await loginWithGoogle(googleResult.idToken);

      // 3. 다른 계정 체크 (세션 만료 재로그인 시)
      if (isSessionExpired) {
        const shouldProceed = await handleDifferentAccountLogin(authResponse.user.id);
        if (!shouldProceed) {
          console.log('🔐 [Login] User cancelled different account login');
          return;
        }
      }

      // 4. Auth Store에 저장 (토큰 + userId + userInfo)
      await login({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        userId: authResponse.user.id,
        userInfo: {
          name: authResponse.user.name,
          email: authResponse.user.email,
          profileImageUrl: authResponse.user.profileImageUrl ?? null,
        },
      });

      console.log('✅ [Login] Google login successful');
    } catch (err) {
      console.error('❌ [Login] Google login failed:', err);
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Apple 로그인 처리
  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Apple OAuth로 credential 획득
      const appleResult = await signInWithApple();

      if (!appleResult.success) {
        if (appleResult.error === 'CANCELLED') {
          console.log('🔐 [Login] Apple login cancelled');
          return;
        }
        throw new Error(appleResult.message || 'Apple 로그인 실패');
      }

      // 2. 서버로 identityToken + authorizationCode 전송하여 인증
      const authResponse = await loginWithApple({
        identityToken: appleResult.identityToken,
        authorizationCode: appleResult.authorizationCode,
        email: appleResult.user?.email,
        fullName: appleResult.user?.name,
      });

      // 3. 다른 계정 체크 (세션 만료 재로그인 시)
      if (isSessionExpired) {
        const shouldProceed = await handleDifferentAccountLogin(authResponse.user.id);
        if (!shouldProceed) {
          console.log('🔐 [Login] User cancelled different account login');
          return;
        }
      }

      // 4. Auth Store에 저장 (토큰 + userId + userInfo)
      await login({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        userId: authResponse.user.id,
        userInfo: {
          name: authResponse.user.name,
          email: authResponse.user.email,
          profileImageUrl: authResponse.user.profileImageUrl ?? null,
        },
      });

      console.log('✅ [Login] Apple login successful');
    } catch (err) {
      console.error('❌ [Login] Apple login failed:', err);
      setError(err instanceof Error ? err.message : 'Apple 로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 items-center justify-center px-lg'>
        {/* Logo & Branding */}
        <View className='mb-2xl items-center'>
          <View className='mb-md h-24 w-24 items-center justify-center rounded-3xl bg-primary'>
            <Plane size={48} color='hsl(120, 61%, 98%)' strokeWidth={2} />
          </View>
          <Text className='mb-2xs text-display text-foreground'>Noline</Text>
          <Text className='text-center text-body text-muted-foreground'>네트워크가 없어도 여행은 계속된다</Text>
        </View>

        {/* Login Buttons */}
        <View className='w-full max-w-sm gap-sm'>
          {/* Error Message */}
          {error && (
            <View className='mb-sm rounded-lg bg-destructive/10 p-sm'>
              <Text className='text-center text-body text-destructive'>{error}</Text>
            </View>
          )}

          {/* Google Login Button */}
          {isGoogleAuthConfigured() && (
            <Pressable
              variant='outline'
              onPress={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className='h-14 flex-row items-center justify-center gap-sm'
            >
              {isLoading ? (
                <ActivityIndicator size='small' color='hsl(0, 0%, 12%)' />
              ) : (
                <>
                  <GoogleIcon />
                  <Text className='text-body-large font-medium text-foreground'>Google로 계속하기</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Apple Login Button (iOS only) */}
          {Platform.OS === 'ios' && isAppleAuthAvailable() && (
            <View className='h-14 overflow-hidden rounded-lg'>
              <AppleAuthenticationButton
                buttonType={AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={{ width: '100%', height: 56 }}
                onPress={handleAppleLogin}
              />
            </View>
          )}
        </View>

        {/* Footer */}
        <View className='absolute bottom-8 px-lg'>
          <Text className='text-center text-caption text-muted-foreground'>
            로그인하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Google 아이콘 (SVG 대체용)
 */
function GoogleIcon() {
  return (
    <View className='h-5 w-5 items-center justify-center'>
      <Text className='text-body-large font-bold'>G</Text>
    </View>
  );
}
