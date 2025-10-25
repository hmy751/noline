import React, { createContext, useContext, useState, ReactNode } from 'react';

type NetworkStatus = 'online' | 'offline';

interface NetworkOverrideContextType {
  overrideStatus: NetworkStatus | null;
  setOverrideOnline: () => void;
  setOverrideOffline: () => void;
  clearOverride: () => void;
}

const NetworkOverrideContext = createContext<NetworkOverrideContextType | undefined>(undefined);

/**
 * 네트워크 Override Provider
 *
 * 디버그 목적으로 네트워크 상태를 강제로 설정
 * - 실제 네트워크 상태와 무관하게 동작
 * - 테스트 및 개발용
 */
export function NetworkOverrideProvider({ children }: { children: ReactNode }) {
  const [overrideStatus, setOverrideStatus] = useState<NetworkStatus | null>(null);

  const setOverrideOnline = () => {
    console.log('🔧 [Debug] Force ONLINE mode');
    setOverrideStatus('online');
  };

  const setOverrideOffline = () => {
    console.log('🔧 [Debug] Force OFFLINE mode');
    setOverrideStatus('offline');
  };

  const clearOverride = () => {
    console.log('🔧 [Debug] Clear override (use real network status)');
    setOverrideStatus(null);
  };

  return (
    <NetworkOverrideContext.Provider
      value={{
        overrideStatus,
        setOverrideOnline,
        setOverrideOffline,
        clearOverride,
      }}
    >
      {children}
    </NetworkOverrideContext.Provider>
  );
}

/**
 * 네트워크 Override 훅
 *
 * 디버그 콘솔에서 네트워크 상태를 강제로 설정하기 위한 훅
 */
export function useNetworkOverride() {
  const context = useContext(NetworkOverrideContext);

  if (!context) {
    throw new Error('useNetworkOverride must be used within NetworkOverrideProvider');
  }

  return context;
}
