import { View, Text, ScrollView, Alert } from 'react-native';
import { Container, Stack, MobileHeader } from '@/shared/components';
import { Avatar, AvatarFallback, AvatarImage, Switch, Separator, Pressable } from '@repo/ui';
import { useState } from 'react';
import { User, Sun, Moon, Settings, Globe, Download, ChevronRight, Bug } from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useStorageStats } from '@/features/profile/hooks/useStorageStats';
import { performLogout, performDeleteAccount } from '@/shared/services/auth';
import { useAuthStore } from '@/shared/store/auth';

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // AuthStore에서 user 정보 조회 (SecureStore에서 복원됨 - 오프라인 지원)
  const { userInfo } = useAuthStore();

  // 사용자 정보 (저장된 데이터 또는 기본값)
  const user = {
    name: userInfo?.name ?? '사용자',
    email: userInfo?.email ?? '',
    profileImageUrl: userInfo?.profileImageUrl,
    initials: userInfo?.name?.charAt(0) ?? '?',
  };

  const { stats } = useStorageStats();

  // 로그아웃 처리
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // 첫 번째 시도: 동기화 대기 데이터 체크
      const result = await performLogout();

      if (!result.success && result.hasPendingSync) {
        // 동기화되지 않은 데이터가 있으면 확인 요청
        Alert.alert('동기화 대기 중', result.message || '동기화되지 않은 데이터가 있습니다.', [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '계속 로그아웃',
            style: 'destructive',
            onPress: async () => {
              // 강제 로그아웃
              const forceResult = await performLogout({ force: true });
              if (!forceResult.success) {
                Alert.alert('오류', forceResult.message || '로그아웃에 실패했습니다.');
              }
              setIsLoggingOut(false);
            },
          },
        ]);
        return;
      }

      if (!result.success) {
        Alert.alert('오류', result.message || '로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ [Profile] Logout error:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 계정 삭제 처리
  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '계정을 삭제하면 모든 여행 데이터가 영구적으로 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '계정 삭제',
          style: 'destructive',
          onPress: () => executeDeleteAccount(),
        },
      ],
    );
  };

  const executeDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      const result = await performDeleteAccount();

      if (!result.success && result.hasPendingSync) {
        Alert.alert('동기화 대기 중', result.message || '동기화되지 않은 데이터가 있습니다.', [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => setIsDeletingAccount(false),
          },
          {
            text: '계속 삭제',
            style: 'destructive',
            onPress: async () => {
              const forceResult = await performDeleteAccount({ force: true });
              if (!forceResult.success) {
                Alert.alert('오류', forceResult.message || '계정 삭제에 실패했습니다.');
              }
              setIsDeletingAccount(false);
            },
          },
        ]);
        return;
      }

      if (!result.success) {
        Alert.alert('오류', result.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ [Profile] Delete account error:', error);
      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

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
    { label: '앱 버전', value: Constants.expoConfig?.version ?? '1.0.0' },
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
                  {user.profileImageUrl && <AvatarImage source={{ uri: user.profileImageUrl }} />}
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
            <Pressable variant='outline' onPress={handleLogout} disabled={isLoggingOut || isDeletingAccount}>
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </Pressable>

            {/* Delete Account Button */}
            <Pressable variant='ghost' onPress={handleDeleteAccount} disabled={isDeletingAccount || isLoggingOut}>
              <Text className='text-center text-destructive'>
                {isDeletingAccount ? '계정 삭제 중...' : '계정 삭제'}
              </Text>
            </Pressable>
          </Stack>
        </Container>
      </ScrollView>
    </View>
  );
}
