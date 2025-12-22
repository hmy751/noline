/* eslint-disable react/no-unstable-nested-components */
import { Tabs, Redirect } from 'expo-router';
import { Home, Calendar, Wallet, User } from 'lucide-react-native';
import { useAuthStore } from '@/shared/store/auth';

export default function TabsLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  // 초기화 전이면 대기 (Splash 화면 유지)
  if (!isInitialized) {
    return null;
  }

  // 비인증이면 로그인 화면으로 리다이렉트
  if (!isAuthenticated) {
    return <Redirect href='/(auth)/login' />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#228B22',
        tabBarInactiveTintColor: '#808080',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          lineHeight: 14,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name='schedules'
        options={{
          title: '일정',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name='expenses'
        options={{
          title: '경비',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
