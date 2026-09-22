import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Pressable } from '@repo/ui';
import * as SplashScreen from 'expo-splash-screen';

import { initializeDatabase } from '@/shared/db';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore } from '@/shared/store/network';

type AppStartupStatus = 'preparing' | 'database-error' | 'ready';

void SplashScreen.preventAutoHideAsync();

// 앱을 사용할 수 있는 조건과 그때까지의 UI를 소유한다.
// 네트워크 감지는 mount 동안 유지하고, 실패 재시도는 DB·인증 준비만 다시 실행한다.
export function AppInitialization({ children }: { children: React.ReactNode }) {
  const [startupStatus, setStartupStatus] = useState<AppStartupStatus>('preparing');
  const activeAttempt = useRef<object | null>(null);

  const initializeApp = useCallback(async () => {
    if (activeAttempt.current) {
      return;
    }

    const attempt = {};
    activeAttempt.current = attempt;
    setStartupStatus('preparing');
    const startedAt = Date.now();

    try {
      await initializeDatabase();
    } catch (error) {
      console.error('[AppInitialization] failed', {
        phase: 'database',
        durationMs: Date.now() - startedAt,
        error,
      });

      if (activeAttempt.current === attempt) {
        activeAttempt.current = null;
        setStartupStatus('database-error');
      }

      return;
    }

    if (activeAttempt.current !== attempt) {
      return;
    }

    // 저장소 복원 실패는 로그인 화면에서 안내하고 명시적으로 재시도한다.
    await useAuthStore.getState().restoreSessionOnce();

    if (activeAttempt.current !== attempt) {
      return;
    }

    activeAttempt.current = null;
    setStartupStatus('ready');
    console.info('[AppInitialization] completed', { durationMs: Date.now() - startedAt });
  }, []);

  useEffect(() => {
    networkStore.init();
    void initializeApp();

    return () => {
      // 이전 실행의 늦은 완료가 다음 실행이나 해제된 화면에 반영되지 않게 한다.
      activeAttempt.current = null;
      networkStore.cleanup();
    };
  }, [initializeApp]);

  useEffect(() => {
    if (startupStatus === 'preparing') {
      return;
    }

    // 성공하면 앱을, 실패하면 재시도 화면을 보여준다.
    void SplashScreen.hideAsync();
  }, [startupStatus]);

  if (startupStatus === 'ready') {
    return <>{children}</>;
  }

  return (
    <View className='flex-1 items-center justify-center bg-background px-lg'>
      {startupStatus === 'preparing' ? (
        <>
          <ActivityIndicator accessibilityLabel='앱 준비 중' />
          <Text className='mt-md text-body text-foreground'>앱을 준비하고 있어요</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole='header' className='text-h3 text-foreground mb-sm text-center'>
            앱을 준비하지 못했어요
          </Text>
          <Text className='text-body text-muted-foreground text-center mb-lg'>
            이 기기의 여행 데이터를 열지 못했어요. 잠시 후 다시 시도해주세요.
          </Text>
          <Pressable accessibilityRole='button' onPress={() => void initializeApp()}>
            다시 시도
          </Pressable>
        </>
      )}
    </View>
  );
}
