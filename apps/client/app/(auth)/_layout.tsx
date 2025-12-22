import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

/**
 * Auth Group Layout
 *
 * 비인증 상태에서만 접근 가능한 화면들
 * - 로그인 화면
 */
export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#FAFAFA',
        },
      }}
    >
      <Stack.Screen name='login' />
    </Stack>
  );
}
