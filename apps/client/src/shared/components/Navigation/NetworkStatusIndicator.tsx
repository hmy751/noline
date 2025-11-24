import { View, Text } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '@/shared/store/network';

/**
 * 네트워크 상태 인디케이터 (헤더 우측)
 * - 온라인: 초록색 Wifi 아이콘 + "온라인"
 * - 오프라인: 빨간색 WifiOff 아이콘 + "오프라인"
 * - 알 수 없음: 회색 Wifi 아이콘 + "확인 중"
 */
export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();

  if (networkStatus === 'online') {
    return (
      <View className='flex-row items-center'>
        <Wifi size={14} color='hsl(140, 65%, 45%)' />
        <Text className='text-label text-status-online ml-1'>온라인</Text>
      </View>
    );
  }

  if (networkStatus === 'offline') {
    return (
      <View className='flex-row items-center'>
        <WifiOff size={14} color='hsl(0, 84%, 60%)' />
        <Text className='text-label text-status-offline ml-1'>오프라인</Text>
      </View>
    );
  }

  // unknown
  return (
    <View className='flex-row items-center'>
      <Wifi size={14} color='hsl(0, 0%, 50%)' />
      <Text className='text-label text-muted-foreground ml-1'>확인 중</Text>
    </View>
  );
}
