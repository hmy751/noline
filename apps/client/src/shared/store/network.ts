import { create } from 'zustand';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline';

interface NetworkState {
  realStatus: NetworkStatus;
  overrideStatus: NetworkStatus | null;

  // Actions
  init: () => void;
  cleanup: () => void;
  setOverride: (status: NetworkStatus | null) => void;
  updateRealStatus: (isOnline: boolean | null) => void;

  // Computed (Helper)
  getStatus: () => NetworkStatus;
}

// NetInfo 구독 해제 함수 저장용 (모듈 레벨 변수)
let unsubscribeNetInfo: NetInfoSubscription | null = null;

export const useNetworkStore = create<NetworkState>((set, get) => ({
  realStatus: 'online',
  overrideStatus: null,

  init: () => {
    if (unsubscribeNetInfo) return; // 이미 초기화됨

    console.log('🌐 [NetworkStore] Initialized (Zustand)');

    // 1. 초기 상태 확인
    NetInfo.fetch().then((state) => {
      get().updateRealStatus(state.isConnected && state.isInternetReachable);
    });

    // 2. 실시간 상태 감지
    unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      get().updateRealStatus(state.isConnected && state.isInternetReachable);
    });
  },

  cleanup: () => {
    if (unsubscribeNetInfo) {
      unsubscribeNetInfo();
      unsubscribeNetInfo = null;
      console.log('🌐 [NetworkStore] Cleaned up');
    }
  },

  updateRealStatus: (isOnline) => {
    const newStatus = isOnline ? 'online' : 'offline';
    const currentReal = get().realStatus;

    if (currentReal !== newStatus) {
      console.log(`🌐 [NetworkStore] Real status changed: ${newStatus.toUpperCase()}`);
      set({ realStatus: newStatus });
    }
  },

  setOverride: (status) => {
    console.log(
      status ? `🔧 [NetworkStore] Override set: ${status.toUpperCase()}` : '🔧 [NetworkStore] Override cleared',
    );
    set({ overrideStatus: status });
  },

  getStatus: () => {
    const { overrideStatus, realStatus } = get();
    return overrideStatus ?? realStatus;
  },
}));

// 비-React 환경(일반 함수 등)에서 상태 접근을 위한 헬퍼
export const networkStore = {
  get status() {
    return useNetworkStore.getState().getStatus();
  },
  get override() {
    return useNetworkStore.getState().overrideStatus;
  },
  setOverride(status: NetworkStatus | null) {
    useNetworkStore.getState().setOverride(status);
  },
  init() {
    useNetworkStore.getState().init();
  },
  cleanup() {
    useNetworkStore.getState().cleanup();
  },
};

// ============================================================================
// Hooks (Integrated)
// ============================================================================

/**
 * 네트워크 상태 감지 훅
 * @returns 'online' | 'offline'
 */
export function useNetworkStatus(): NetworkStatus {
  return useNetworkStore((state) => state.getStatus());
}

/**
 * 네트워크 상태 제어 훅 (Debug용)
 */
export function useNetworkControl() {
  const overrideStatus = useNetworkStore((state) => state.overrideStatus);
  const setOverride = useNetworkStore((state) => state.setOverride);

  return {
    overrideStatus,
    setOverrideOnline: () => setOverride('online'),
    setOverrideOffline: () => setOverride('offline'),
    clearOverride: () => setOverride(null),
  };
}
