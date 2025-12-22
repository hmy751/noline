import '../styles/global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import MapboxGL from '@rnmapbox/maps';
import { initializeDatabase } from '@/shared/db';
import { SyncProvider } from '@/shared/services/sync/provider';
import { useOfflineMapCleanup } from '@/shared/services/offline-map';

import { networkStore } from '@/shared/store/network';
import { queryClient } from '@/shared/lib/queryClient';
import { useTripStore } from '@/shared/store';
import { useGetTrips, selectMainTrip } from '@/entities/trip';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';
import { useAuthStore } from '@/shared/store/auth';
import { SessionExpiredBanner } from '@/shared/components';

// Splash 화면을 수동으로 제어하기 위해 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

// Mapbox 접근 토큰 설정 (런타임 초기화)
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

/**
 * 인증된 상태에서만 실행되는 컴포넌트들
 *
 * - InitializeMainTrip: useGetTrips 호출 (인증 필요)
 * - OfflineMapCleanupTrigger: 오프라인 맵 정리
 * - PendingCleanupTrigger: 대기 중인 정리 작업 처리
 */
function AuthenticatedInitializers() {
  const { isAuthenticated } = useAuthStore();

  // 인증되지 않았으면 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <InitializeMainTrip />
      <OfflineMapCleanupTrigger />
      <PendingCleanupTrigger />
    </>
  );
}

function InitializeMainTrip() {
  const { setSelectedTripId } = useTripStore();
  const { data: trips = [] } = useGetTrips();

  useEffect(() => {
    if (trips.length > 0) {
      const mainTrip = selectMainTrip(trips);
      if (mainTrip) {
        setSelectedTripId(mainTrip.id);
        console.log('✅ Main trip selected:', mainTrip.name);
      } else {
        setSelectedTripId(trips[0].id);
        console.log('✅ First trip selected:', trips[0].name);
      }
    }
  }, [trips, setSelectedTripId]);

  return null;
}

function OfflineMapCleanupTrigger() {
  useOfflineMapCleanup();
  return null;
}

/**
 * Pending Cleanup 재시도 트리거
 *
 * 앱 시작 시 cleanupPending = true인 여행을 찾아서
 * sync_queue가 비어있으면 cleanup 실행
 *
 * 실행 타이밍:
 * - 앱 최초 시작 시 1회
 * - DB 초기화 완료 후
 * - SyncProvider 마운트 후 (네트워크 상태 확인 가능)
 */
function PendingCleanupTrigger() {
  useEffect(() => {
    const retryPendingCleanups = async () => {
      try {
        console.log('🧹 [App] Checking for pending cleanups on app start...');
        const processedCount = await processPendingCleanups();

        if (processedCount > 0) {
          console.log(`✅ [App] Processed ${processedCount} pending cleanups on app start`);
          // React Query 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['trip'] });
          queryClient.invalidateQueries({ queryKey: ['schedule'] });
          queryClient.invalidateQueries({ queryKey: ['expense'] });
        } else {
          console.log('✅ [App] No pending cleanups found');
        }
      } catch (error) {
        console.error('⚠️ [App] Failed to process pending cleanups on app start:', error);
        // 실패해도 앱 시작은 계속 진행
      }
    };

    // 약간의 지연 후 실행 (DB 초기화와 SyncProvider 준비 대기)
    const timer = setTimeout(() => {
      retryPendingCleanups();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

/**
 * 인증 상태 기반 라우팅
 *
 * - 비인증: (auth)/login으로 리다이렉트
 * - 인증: (tabs)로 리다이렉트
 * - 초기화 전: 아무것도 하지 않음 (Splash 유지)
 */
function AuthRouter() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    // 아직 초기화 중이면 리다이렉트 하지 않음
    if (!isInitialized) {
      return;
    }

    // 현재 auth 그룹에 있는지 확인
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // 비인증 상태 + auth 그룹 밖 → 로그인 화면으로
      console.log('🔐 [Router] Not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // 인증 상태 + auth 그룹 안 → 메인 화면으로
      console.log('🔐 [Router] Authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const { init: initAuth } = useAuthStore();

  // 앱 초기화 (DB, 폰트, 인증 등)
  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('🚀 Preparing app...');

        // 0. 네트워크 스토어 초기화
        networkStore.init();

        // 1. 로컬 DB 초기화
        await initializeDatabase();

        // 2. Auth Store 초기화 (SecureStore에서 토큰 복원)
        await initAuth();

        console.log('✅ App is ready!');
      } catch (error) {
        console.error('❌ Failed to prepare app:', error);
      } finally {
        // 초기화 완료 (성공/실패 무관)
        setIsAppReady(true);
      }
    };

    prepareApp();
  }, [initAuth]);

  // 앱 준비 완료 시 Splash 화면 숨기기
  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  // Splash 화면 유지 (초기화 완료 전까지)
  if (!isAppReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SyncProvider>
          {/* 세션 만료 배너 (상단에 표시) */}
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
          {/* Portal Host for Select and other portal-based components */}
          <PortalHost />
          {/* Auth Router: 인증 상태에 따라 자동 리다이렉트 */}
          <AuthRouter />
          {/* 인증된 상태에서만 실행되는 초기화 컴포넌트들 */}
          <AuthenticatedInitializers />
        </SyncProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
