import '../styles/global.css';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
