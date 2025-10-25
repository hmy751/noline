import '../styles/global.css';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { initializeDatabase } from '@/shared/db';
import { SyncProvider } from '@/shared/services/sync/provider';
import { NetworkOverrideProvider } from '@/features/debug';

// Splash 화면을 수동으로 제어하기 위해 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
          </SyncProvider>
        </NetworkOverrideProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
