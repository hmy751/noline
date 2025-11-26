import { View, Text, ScrollView } from 'react-native';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { Avatar, AvatarFallback, Switch, Separator, Pressable } from '@repo/ui';
import { useState } from 'react';
import { User, Sun, Moon, Settings, Globe, Download, ChevronRight, Bug } from 'lucide-react-native';
import { router } from 'expo-router';
import { useStorageStats } from '@/features/profile/hooks/useStorageStats';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(false);

  // TODO: Replace with real data
  const user = {
    name: '여행자',
    email: 'traveler@example.com',
    initials: '여',
  };

  const { stats } = useStorageStats();

  const menuItems: Array<{
    icon: 'sun' | 'moon' | 'settings' | 'globe' | 'download' | 'bug';
    label: string;
    hasSwitch: boolean;
    value?: boolean;
    onChange?: (value: boolean) => void;
    onPress?: () => void;
  }> = [
    // { icon: 'sun', label: '다크 모드', hasSwitch: true, value: darkMode, onChange: setDarkMode },
    // { icon: 'settings', label: '설정', hasSwitch: false },
    // { icon: 'globe', label: '언어 설정', hasSwitch: false },
    // { icon: 'download', label: '오프라인 지도 관리', hasSwitch: false },
    ...(__DEV__
      ? [
          {
            icon: 'bug' as const,
            label: '디버그 콘솔 (개발자)',
            hasSwitch: false,
            onPress: () => router.push('/debug'),
          },
        ]
      : []),
  ];

  const infoItems = [
    { label: '앱 버전', value: '1.0.0' },
    { label: '저장된 데이터', value: stats.dbSize },
    { label: '오프라인 지도', value: stats.mapPackSize },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <MobileHeader title='프로필' />

      <ScrollView className='flex-1'>
        <Container>
          <Stack direction='vertical' gap='lg' className='py-sm'>
            {/* Profile Section */}
            <View className='rounded-xl bg-card p-md'>
              <View className='flex-row items-center gap-sm'>
                <Avatar className='h-16 w-16 bg-primary' alt='User Avatar'>
                  <AvatarFallback>
                    <User size={32} color='hsl(120, 61%, 98%)' strokeWidth={2} />
                  </AvatarFallback>
                </Avatar>
                <View className='flex-1 flex-col gap-3xs'>
                  <Text className='text-title-large text-foreground'>{user.name}</Text>
                  <Text className='text-body text-muted-foreground'>{user.email}</Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View className='rounded-xl bg-card'>
              {menuItems.map((item, index) => {
                const IconComponent =
                  item.icon === 'sun'
                    ? darkMode
                      ? Moon
                      : Sun
                    : item.icon === 'settings'
                      ? Settings
                      : item.icon === 'globe'
                        ? Globe
                        : item.icon === 'bug'
                          ? Bug
                          : Download;

                return (
                  <View key={item.label}>
                    <Pressable
                      variant='ghost'
                      onPress={() => {
                        if (!item.hasSwitch) {
                          if (item.onPress) {
                            item.onPress();
                          } else {
                            console.log('Menu item pressed:', item.label);
                          }
                        }
                      }}
                    >
                      <View className='w-full flex-row items-center justify-between px-sm'>
                        <View className='flex-row items-center gap-xs'>
                          <IconComponent size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                          <Text className='text-body text-foreground'>{item.label}</Text>
                        </View>
                        {item.hasSwitch && item.value !== undefined && item.onChange ? (
                          <Switch checked={item.value} onCheckedChange={item.onChange} />
                        ) : !item.hasSwitch ? (
                          <ChevronRight size={18} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                        ) : null}
                      </View>
                    </Pressable>
                    {index < menuItems.length - 1 && <Separator />}
                  </View>
                );
              })}
            </View>

            {/* Info Section */}
            <View className='rounded-xl bg-card'>
              {infoItems.map((item, index) => (
                <View key={item.label}>
                  <View className='flex-row items-center justify-between p-sm'>
                    <Text className='text-body text-muted-foreground'>{item.label}</Text>
                    <Text className='text-body text-foreground'>{item.value}</Text>
                  </View>
                  {index < infoItems.length - 1 && <Separator />}
                </View>
              ))}
            </View>

            {/* Logout Button */}
            <Pressable
              variant='outline'
              onPress={() => {
                console.log('Logout pressed');
              }}
            >
              로그아웃
            </Pressable>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
