import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 커스텀 헤더 사용 (MobileHeader)
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='[id]' />
    </Stack>
  );
}
