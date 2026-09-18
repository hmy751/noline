import '../styles/global.css';

import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import MapboxGL from '@rnmapbox/maps';

import { AppInitialization } from '@/application/AppInitialization';

import { useTripSelection } from '@/entities/trip/data/useTripSelection';
import { SessionExpiredBanner } from '@/shared/components';
import { queryClient } from '@/shared/lib/queryClient';
import { useOfflineMapCleanup } from '@/shared/services/offline-map';
import { usePendingCleanups } from '@/shared/services/sync/usePendingCleanups';
import { SyncProvider } from '@/shared/services/sync/provider';
import { useAuthStore } from '@/shared/store/auth';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN!);

// 전체 앱의 구성: 준비가 끝난 뒤 화면과 인증 후 작업을 연결한다.
export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <SafeAreaProvider>
      <AppInitialization>
        <QueryClientProvider client={queryClient}>
          <SyncProvider>
            <SessionExpiredBanner />
            <AppNavigation isAuthenticated={isAuthenticated} />
            <PortalHost />
            {isAuthenticated && <AuthenticatedEffects />}
          </SyncProvider>
        </QueryClientProvider>
      </AppInitialization>
    </SafeAreaProvider>
  );
}

// 준비 완료 후의 화면 구성과 로그인 상태에 따른 이동을 함께 관리한다.
function AppNavigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const isAuthRoute = segments[0] === '(auth)';

    if (!isAuthenticated && !isAuthRoute) {
      console.debug('[AppNavigation] redirect', {
        reason: 'unauthenticated',
        target: 'login',
      });

      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      console.debug('[AppNavigation] redirect', {
        reason: 'authenticated',
        target: 'home',
      });

      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FAFAFA',
        },
      }}
    >
      <Stack.Screen name='(auth)' />
      <Stack.Screen name='(tabs)' />
    </Stack>
  );
}

// 로그인할 때 연결되고 로그아웃하면 해제된다. 완료를 기다리지 않고 화면을 사용할 수 있다.
function AuthenticatedEffects() {
  useTripSelection();
  useOfflineMapCleanup();
  usePendingCleanups();

  return null;
}
