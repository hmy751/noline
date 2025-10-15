import '../styles/global.css';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
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
    </>
  );
}
