import { View, Text } from 'react-native';
import { AlertCircle, WifiOff, Lock } from 'lucide-react-native';
import type { CRUDPermission } from '@/shared/policy/types';

type PolicyErrorDisplayProps = {
  permission: CRUDPermission;
  /**
   * 에러 표시 스타일
   * - banner: 상단 배너 (노란색, 경고)
   * - block: 화면 차단 (빨간색, 치명적)
   * - inline: 인라인 메시지 (컴포넌트 내부)
   */
  variant?: 'banner' | 'block' | 'inline';
  /**
   * 커스텀 메시지 (permission.reason 대신 사용)
   */
  message?: string;
};

/**
 * Policy 에러 표시 컴포넌트
 *
 * @example
 * ```tsx
 * const policy = useAppPolicy(tripId);
 *
 * if (!policy.schedule.create.allowed) {
 *   return <PolicyErrorDisplay permission={policy.schedule.create} variant="block" />;
 * }
 * ```
 */
export function PolicyErrorDisplay({ permission, variant = 'banner', message }: PolicyErrorDisplayProps) {
  const displayMessage = message || permission.reason || '이 작업을 수행할 수 없습니다';

  // 에러 아이콘 선택
  const getIcon = () => {
    if (permission.reason?.includes('오프라인')) {
      return <WifiOff size={20} color={variant === 'block' ? '#DC2626' : '#D97706'} />;
    }
    if (permission.reason?.includes('비활성')) {
      return <Lock size={20} color={variant === 'block' ? '#DC2626' : '#D97706'} />;
    }
    return <AlertCircle size={20} color={variant === 'block' ? '#DC2626' : '#D97706'} />;
  };

  // Banner 스타일 (경고)
  if (variant === 'banner') {
    return (
      <View className='bg-yellow-50 px-md py-sm border-b border-yellow-200 flex-row items-center'>
        {getIcon()}
        <Text className='text-small text-yellow-800 ml-xs flex-1'>{displayMessage}</Text>
      </View>
    );
  }

  // Block 스타일 (화면 차단)
  if (variant === 'block') {
    return (
      <View className='flex-1 items-center justify-center px-lg'>
        <View className='w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-md'>{getIcon()}</View>
        <Text className='text-h3 text-foreground mb-sm text-center'>작업을 수행할 수 없습니다</Text>
        <Text className='text-body text-muted-foreground text-center'>{displayMessage}</Text>
      </View>
    );
  }

  // Inline 스타일 (컴포넌트 내부)
  return (
    <View className='bg-yellow-50 border border-yellow-200 rounded-md px-sm py-xs flex-row items-center'>
      {getIcon()}
      <Text className='text-small text-yellow-800 ml-xs flex-1'>{displayMessage}</Text>
    </View>
  );
}
