import { View, Text, ScrollView, Pressable } from 'react-native';
import { Container, Stack } from '@/shared/components';
import { Avatar, AvatarFallback, Switch, Separator } from '@repo/ui';
import { useState } from 'react';
import { User, Sun, Moon, Settings, Globe, Download, ChevronRight, Wifi } from 'lucide-react-native';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(false);

  // TODO: Replace with real data
  const user = {
    name: '여행자',
    email: 'traveler@example.com',
    initials: '여',
  };

  const menuItems: Array<{
    icon: 'sun' | 'moon' | 'settings' | 'globe' | 'download';
    label: string;
    hasSwitch: boolean;
    value?: boolean;
    onChange?: (value: boolean) => void;
  }> = [
    { icon: 'sun', label: '다크 모드', hasSwitch: true, value: darkMode, onChange: setDarkMode },
    { icon: 'settings', label: '설정', hasSwitch: false },
    { icon: 'globe', label: '언어 설정', hasSwitch: false },
    { icon: 'download', label: '오프라인 지도 관리', hasSwitch: false },
  ];

  const infoItems = [
    { label: '앱 버전', value: '1.0.0' },
    { label: '저장된 데이터', value: '2.4 MB' },
  ];

  return (
    <View className='flex-1 bg-background'>
      {/* Header */}
      <View className='h-14 flex-row items-center justify-between border-b border-card-border bg-background px-sm'>
        <Text className='text-title-large font-semibold text-foreground'>프로필</Text>
        <View className='flex-row items-center gap-3xs'>
          <Wifi size={14} color='hsl(140, 65%, 45%)' strokeWidth={2} />
          <Text className='text-body text-status-online'>온라인</Text>
        </View>
      </View>

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
                        : Download;

                return (
                  <View key={item.label}>
                    <Pressable
                      className='flex-row items-center justify-between p-sm'
                      onPress={() => {
                        if (!item.hasSwitch) {
                          console.log('Menu item pressed:', item.label);
                        }
                      }}
                    >
                      <View className='flex-row items-center gap-xs'>
                        <IconComponent size={18} color='hsl(0, 0%, 12%)' strokeWidth={2} />
                        <Text className='text-body text-foreground'>{item.label}</Text>
                      </View>
                      {item.hasSwitch && item.value !== undefined && item.onChange ? (
                        <Switch checked={item.value} onCheckedChange={item.onChange} />
                      ) : !item.hasSwitch ? (
                        <ChevronRight size={18} color='hsl(120, 8%, 35%)' strokeWidth={2} />
                      ) : null}
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
              className='rounded-xl bg-card p-sm'
              onPress={() => {
                console.log('Logout pressed');
              }}
            >
              <Text className='text-center text-body text-foreground'>로그아웃</Text>
            </Pressable>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
