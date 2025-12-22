import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { Pressable } from '@repo/ui';
import { useAuthStore } from '@/shared/store/auth';
import { router } from 'expo-router';

/**
 * 세션 만료 배너
 *
 * - 세션 만료 시 (isSessionExpired === true) 화면 상단에 표시
 * - 재로그인 버튼 제공
 * - 오프라인 작업은 계속 가능하다는 안내 포함
 *
 * @example
 * ```tsx
 * // _layout.tsx에서 사용
 * <SessionExpiredBanner />
 * <Stack>...</Stack>
 * ```
 */
export function SessionExpiredBanner() {
  const { isSessionExpired, isAuthenticated } = useAuthStore();

  // 세션이 만료되지 않았거나 인증되지 않은 상태면 표시 안 함
  if (!isSessionExpired || !isAuthenticated) {
    return null;
  }

  const handleReLogin = () => {
    // 로그인 화면으로 이동 (기존 인증 유지, 재인증만 수행)
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView edges={['top']} className='bg-amber-500'>
      <View className='flex-row items-center justify-between px-md py-sm'>
        <View className='flex-1 flex-row items-center gap-xs'>
          <AlertCircle size={18} color='#000' strokeWidth={2} />
          <View className='flex-1'>
            <Text className='text-body font-medium text-black'>세션이 만료되었습니다</Text>
            <Text className='text-caption text-black/70'>
              오프라인 작업은 계속 가능합니다. 동기화를 위해 다시 로그인하세요.
            </Text>
          </View>
        </View>
        <Pressable variant='ghost' size='sm' onPress={handleReLogin} className='bg-black/10'>
          <Text className='text-body font-medium text-black'>재로그인</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default SessionExpiredBanner;
