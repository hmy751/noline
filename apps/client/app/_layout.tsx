import '../styles/global.css';
import { Stack } from 'expo-router';
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
import { NetworkOverrideProvider } from '@/features/debug';
import { queryClient } from '@/shared/lib/queryClient';
import { useTripStore } from '@/shared/store';
import { useGetTrips, selectMainTrip } from '@/entities/trip';
import { processPendingCleanups } from '@/shared/services/sync/cleanup-job';

// Splash 화면을 수동으로 제어하기 위해 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

// Mapbox 접근 토큰 설정 (런타임 초기화)
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);

  // 앱 초기화 (DB, 폰트, 인증 등)
  useEffect(() => {
    const prepareApp = async () => {
      try {
        console.log('🚀 Preparing app...');

        // 1. 로컬 DB 초기화
        await initializeDatabase();

        // 2. 필요한 다른 초기화 작업들 (향후 추가)
        // await loadFonts();
        // await checkAuthStatus();
        // await loadUserPreferences();

        console.log('✅ App is ready!');
      } catch (error) {
        console.error('❌ Failed to prepare app:', error);
      } finally {
        // 초기화 완료 (성공/실패 무관)
        setIsAppReady(true);
      }
    };

    prepareApp();
  }, []);

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
        <NetworkOverrideProvider>
          <SyncProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FAFAFA',
                },
              }}
            >
              <Stack.Screen name='(tabs)' />
            </Stack>
            {/* Portal Host for Select and other portal-based components */}
            <PortalHost />
            <InitializeMainTrip />
            <OfflineMapCleanupTrigger />
            <PendingCleanupTrigger />
          </SyncProvider>
        </NetworkOverrideProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
