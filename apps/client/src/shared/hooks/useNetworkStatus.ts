import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * 네트워크 상태 타입
 * - online: 인터넷 연결 가능
 * - offline: 인터넷 연결 불가
 */
type NetworkStatus = 'online' | 'offline';

/**
 * 네트워크 상태 감지 훅
 *
 * 실시간으로 온라인/오프라인 상태를 감지하여 반환
 * - WiFi, 셀룰러 데이터 등 모든 네트워크 상태 감지
 * - 상태 변경 시 자동으로 리렌더링
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const networkStatus = useNetworkStatus();
 *
 *   return (
 *     <View>
 *       <Text>네트워크: {networkStatus}</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * @returns 'online' | 'offline'
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    // 네트워크 상태 변경 구독
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected: 네트워크 연결 여부
      // isInternetReachable: 실제 인터넷 접근 가능 여부
      const isOnline = state.isConnected && state.isInternetReachable;

      setStatus(isOnline ? 'online' : 'offline');

      console.log(`🌐 Network status changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  return status;
}

/**
 * 현재 네트워크 상태를 한 번만 조회 (비동기)
 *
 * @returns Promise<NetworkStatus>
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected && state.isInternetReachable;

  return isOnline ? 'online' : 'offline';
}
