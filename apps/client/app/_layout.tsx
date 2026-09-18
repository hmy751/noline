import '../styles/global.css';

import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import MapboxGL from '@rnmapbox/maps';

import { selectMainTrip, useGetTrips } from '@/entities/trip';
import { SessionExpiredBanner } from '@/shared/components';
import { initializeDatabase } from '@/shared/db';
import { queryClient } from '@/shared/lib/queryClient';
import { useOfflineMapCleanup } from '@/shared/services/offline-map';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { SyncProvider } from '@/shared/services/sync/provider';
import { useTripStore } from '@/shared/store';
import { useAuthStore } from '@/shared/store/auth';
import { networkStore } from '@/shared/store/network';

const PENDING_CLEANUP_DELAY_MS = 2_000;

void SplashScreen.preventAutoHideAsync();

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN!);

function AuthenticatedInitializers() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <MainTripInitializer />
      <OfflineMapCleanupInitializer />
      <PendingCleanupInitializer />
    </>
  );
}

function MainTripInitializer() {
  const setSelectedTripId = useTripStore((state) => state.setSelectedTripId);

  const { data: trips = [], isLoading, isError, error } = useGetTrips();

  useEffect(() => {
    if (isError) {
      console.error('[Trip] initial load failed', { error });
    }

    if (trips.length === 0) {
      if (!isLoading && !isError) {
        console.debug('[Trip] no trips available for initial selection');
      }

      return;
    }

    const mainTrip = selectMainTrip(trips);
    const selectedTrip = mainTrip ?? trips[0];

    setSelectedTripId(selectedTrip.id);

    console.debug('[Trip] initial selection completed', {
      tripId: selectedTrip.id,
      source: mainTrip ? 'main' : 'first',
    });
  }, [trips, isLoading, isError, error, setSelectedTripId]);

  return null;
}

function OfflineMapCleanupInitializer() {
  useOfflineMapCleanup();

  return null;
}

/**
 * 인증 이후 미완료 cleanup 작업을 다시 확인한다.
 *
 * 지연 실행은 다른 초기화 작업과의 동시 실행을 줄이기 위한 것이며,
 * DB나 sync 준비 완료 자체를 보장하지는 않는다.
 */
function PendingCleanupInitializer() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void runPendingCleanups();
    }, PENDING_CLEANUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

async function runPendingCleanups() {
  try {
    const processedCount = await processPendingCleanups();

    if (processedCount === 0) {
      console.debug('[Cleanup] no pending cleanups');
      return;
    }

    console.info('[Cleanup] pending cleanups processed', {
      count: processedCount,
    });

    // 캐시 갱신은 cleanup 완료와 독립적으로 실행한다.
    void queryClient.invalidateQueries({ queryKey: ['trip'] });
    void queryClient.invalidateQueries({
      queryKey: ['schedule'],
    });
    void queryClient.invalidateQueries({
      queryKey: ['expense'],
    });
  } catch (error) {
    // cleanup 실패가 앱 진입을 막아서는 안 된다.
    console.error('[Cleanup] pending cleanup failed', {
      error,
    });
  }
}

function AuthRouter() {
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const isAuthRoute = segments[0] === '(auth)';

    if (!isAuthenticated && !isAuthRoute) {
      console.debug('[AuthRouter] redirect', {
        reason: 'unauthenticated',
        target: 'login',
      });

      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      console.debug('[AuthRouter] redirect', {
        reason: 'authenticated',
        target: 'home',
      });

      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isAppReady, setIsAppReady] = useState(false);

  const initAuth = useAuthStore((state) => state.init);

  useEffect(() => {
    networkStore.init();

    return () => networkStore.cleanup();
  }, []);

  useEffect(() => {
    async function prepareApp() {
      const startedAt = Date.now();
      let phase: 'database' | 'auth' = 'database';

      try {
        await initializeDatabase();

        phase = 'auth';
        await initAuth();

        console.info('[AppBootstrap] completed', {
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        console.error('[AppBootstrap] failed', {
          phase,
          durationMs: Date.now() - startedAt,
          error,
        });
      } finally {
        // 성공 여부와 관계없이 준비 시도가 끝나면 진입을 이어간다.
        // DB·인증 실패 후의 화면·기능 허용 정책을 보장하는 flag는 아니다.
        setIsAppReady(true);
      }
    }

    void prepareApp();
  }, [initAuth]);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SyncProvider>
          <SessionExpiredBanner />

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

          <PortalHost />
          <AuthRouter />
          <AuthenticatedInitializers />
        </SyncProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
