import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack } from '@/shared/components';
import { Avatar, AvatarImage, AvatarFallback, Switch, Separator } from '@repo/ui';
import { useState } from 'react';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);

  // TODO: Replace with real data
  const user = {
    name: '여행자 이름',
    email: 'traveler@email.com',
    initials: '여이',
  };

  const stats = [
    { icon: '🌍', label: '총 여행', value: '5회' },
    { icon: '📅', label: '총 일정', value: '42개' },
    { icon: '💶', label: '총 경비', value: '€1,234.50' },
  ];

  const settings = [
    {
      icon: '🌙',
      label: '다크 모드',
      value: darkMode,
      onChange: setDarkMode,
    },
    {
      icon: '🌐',
      label: '오프라인 모드',
      value: offlineMode,
      onChange: setOfflineMode,
    },
    {
      icon: '🔔',
      label: '알림',
      value: notifications,
      onChange: setNotifications,
    },
    {
      icon: '💾',
      label: '데이터 동기화',
      value: syncEnabled,
      onChange: setSyncEnabled,
    },
  ];

  const menuItems = [
    { icon: '📄', label: '이용약관' },
    { icon: '🔒', label: '개인정보 처리방침' },
    { icon: 'ℹ️', label: '앱 정보 v1.0.0' },
    { icon: '🚪', label: '로그아웃', isDestructive: true },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View className='h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm'>
        <Text className='text-title-large text-foreground'>프로필</Text>
        <Pressable
          className='h-10 w-10 items-center justify-center'
          onPress={() => {
            // TODO: Navigate to settings
            console.log('Navigate to settings');
          }}
        >
          <Text className='text-body'>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='md' className='py-sm'>
            {/* Profile Section */}
            <View className='items-center gap-sm py-sm'>
              <Avatar className='h-20 w-20'>
                <AvatarImage source={{ uri: 'https://via.placeholder.com/80' }} />
                <AvatarFallback>
                  <Text className='text-display-medium text-foreground'>{user.initials}</Text>
                </AvatarFallback>
              </Avatar>
              <View className='items-center gap-3xs'>
                <Text className='text-title-large text-foreground'>{user.name}</Text>
                <Text className='text-body text-muted-foreground'>{user.email}</Text>
              </View>
            </View>

            <Separator />

            {/* Stats Section */}
            <View className='flex-col gap-sm'>
              <Text className='text-title-large text-foreground'>📊 통계</Text>
              <View className='rounded-lg bg-card p-sm'>
                {stats.map((stat, index) => (
                  <View key={stat.label}>
                    <View className='flex-row items-center justify-between py-xs'>
                      <Text className='text-body text-foreground'>
                        {stat.icon} {stat.label}
                      </Text>
                      <Text className='text-body text-primary'>{stat.value}</Text>
                    </View>
                    {index < stats.length - 1 && <Separator />}
                  </View>
                ))}
              </View>
            </View>

            <Separator />

            {/* Settings Section */}
            <View className='flex-col gap-sm'>
              <Text className='text-title-large text-foreground'>⚙️ 설정</Text>
              <View className='flex-col gap-xs'>
                {settings.map((setting) => (
                  <View key={setting.label} className='flex-row items-center justify-between rounded-lg bg-card p-sm'>
                    <Text className='text-body text-foreground'>
                      {setting.icon} {setting.label}
                    </Text>
                    <Switch checked={setting.value} onCheckedChange={setting.onChange} />
                  </View>
                ))}
              </View>
            </View>

            <Separator />

            {/* Menu Items */}
            <View className='flex-col gap-xs'>
              {menuItems.map((item) => (
                <Pressable
                  key={item.label}
                  className='rounded-lg bg-card p-sm'
                  onPress={() => {
                    // TODO: Handle menu item press
                    console.log('Menu item pressed:', item.label);
                  }}
                >
                  <Text className={`text-body ${item.isDestructive ? 'text-destructive' : 'text-foreground'}`}>
                    {item.icon} {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
