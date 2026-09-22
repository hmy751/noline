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
import { performLogout } from '@/shared/services/auth/logout-service';
import { completeLogin } from '@/shared/services/auth/login-service';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = useAuthStore((state) => state.status);

  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const googleResult = await signInWithGoogle();

      if (!googleResult.success) {
        if (googleResult.error === 'CANCELLED') {
          return;
        }
        throw new Error(googleResult.message || 'Google 로그인 실패');
      }

      const authResponse = await loginWithGoogle(googleResult.idToken);

      await completeLogin({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        userId: authResponse.user.id,
        userInfo: {
          name: authResponse.user.name,
          email: authResponse.user.email,
          profileImageUrl: authResponse.user.profileImageUrl ?? null,
        },
      });
    } catch (loginError) {
      console.error('[Login] Google login failed', loginError);
      setError(loginError instanceof Error ? loginError.message : 'Google 로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const appleResult = await signInWithApple();

      if (!appleResult.success) {
        if (appleResult.error === 'CANCELLED') {
          return;
        }
        throw new Error(appleResult.message || 'Apple 로그인 실패');
      }

      const authResponse = await loginWithApple({
        identityToken: appleResult.identityToken,
        authorizationCode: appleResult.authorizationCode,
        email: appleResult.user?.email,
        fullName: appleResult.user?.name,
      });

      await completeLogin({
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        userId: authResponse.user.id,
        userInfo: {
          name: authResponse.user.name,
          email: authResponse.user.email,
          profileImageUrl: authResponse.user.profileImageUrl ?? null,
        },
      });
    } catch (loginError) {
      console.error('[Login] Apple login failed', loginError);
      setError(loginError instanceof Error ? loginError.message : 'Apple 로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceLogout = () => {
    Alert.alert(
      '이 기기의 데이터 정리',
      '기기에 저장된 여행과 로그인 정보를 지웁니다. 서버에 전송하지 못한 변경은 복구할 수 없습니다. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '데이터 지우고 로그아웃',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setError(null);
            try {
              const result = await performLogout({ force: true });
              if (!result.success) {
                setError(result.message ?? '기기의 데이터를 정리하지 못했습니다');
              }
            } catch (cleanupError) {
              setError(cleanupError instanceof Error ? cleanupError.message : '기기의 데이터를 정리하지 못했습니다');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSessionRestore = async () => {
    await useAuthStore.getState().retrySessionRestore();
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 items-center justify-center px-lg'>
        <View className='mb-2xl items-center'>
          <View className='mb-md h-24 w-24 items-center justify-center rounded-3xl bg-primary'>
            <Plane size={48} color='hsl(120, 61%, 98%)' strokeWidth={2} />
          </View>
          <Text className='mb-2xs text-display text-foreground'>Noline</Text>
          <Text className='text-center text-body text-muted-foreground'>네트워크가 없어도 여행은 계속된다</Text>
        </View>

        <View className='w-full max-w-sm gap-sm'>
          {status === 'restore-failed' && (
            <View className='gap-sm'>
              <Text>저장된 로그인 정보를 확인하지 못했어요. 기기의 여행 데이터는 보존되어 있어요.</Text>
              <Pressable onPress={handleSessionRestore}>복원 다시 시도</Pressable>
            </View>
          )}
          {status === 'initializing' && <ActivityIndicator accessibilityLabel='로그인 정보 복원 중' />}
          {status === 'reauth-required' && (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              여행으로 돌아가기
            </Pressable>
          )}
          <Text className='text-caption text-muted-foreground'>
            여행 데이터가 남아 있으면 같은 계정으로만 다시 로그인할 수 있습니다. 계정을 바꾸려면 먼저 로그아웃해주세요.
          </Text>
          <Pressable onPress={handleDeviceLogout} disabled={isLoading || isGoogleLoading || status === 'initializing'}>
            기기 데이터 정리하고 로그아웃
          </Pressable>
          {error && (
            <View className='mb-sm rounded-lg bg-destructive/10 p-sm'>
              <Text className='text-center text-body text-destructive'>{error}</Text>
            </View>
          )}

          {isGoogleAuthConfigured() && (
            <Pressable
              variant='outline'
              onPress={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading || status === 'initializing'}
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

          {Platform.OS === 'ios' && isAppleAuthAvailable() && (
            <View className='h-14 overflow-hidden rounded-lg'>
              <AppleAuthenticationButton
                buttonType={AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={{ width: '100%', height: 56 }}
                onPress={async () => {
                  if (!isLoading && status !== 'initializing') {
                    await handleAppleLogin();
                  }
                }}
              />
            </View>
          )}
        </View>

        <View className='absolute bottom-8 px-lg'>
          <Text className='text-center text-caption text-muted-foreground'>
            로그인하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function GoogleIcon() {
  return (
    <View className='h-5 w-5 items-center justify-center'>
      <Text className='text-body-large font-bold'>G</Text>
    </View>
  );
}
