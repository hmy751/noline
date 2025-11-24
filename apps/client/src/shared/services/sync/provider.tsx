import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNetworkStatus } from '@/shared/store/network';
import { syncData } from './engine';

/**
 * SyncProvider Context
 *
 * 동기화 상태와 수동 트리거 제공
 */
interface SyncContextValue {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * useSyncContext Hook
 *
 * 컴포넌트에서 동기화 상태와 수동 트리거 접근
 *
 * @example
 * ```tsx
 * const { isSyncing, triggerManualSync } = useSyncContext();
 * ```
 */
export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}

/**
 * 동기화 Provider
 *
 * 앱 전체를 감싸서 자동 동기화 기능 제공 (Push + Pull)
 * - 네트워크 상태 감지
 * - 오프라인 → 온라인 전환 시 자동 동기화
 * - 앱 시작 시 한 번 동기화
 * - 주기적 동기화 (선택적)
 * - 디버그 모드: 강제 온라인/오프라인 설정 가능
 *
 * @example
 * ```tsx
 * <SyncProvider enablePeriodicSync={false}>
 *   <App />
 * </SyncProvider>
 * ```
 */
interface SyncProviderProps {
  children: React.ReactNode;
  enablePeriodicSync?: boolean; // 주기적 동기화 활성화 (기본: false)
  syncInterval?: number; // 주기적 동기화 간격 (ms, 기본: 5분)
}

export function SyncProvider({
  children,
  enablePeriodicSync = false,
  syncInterval = 5 * 60 * 1000, // 5분
}: SyncProviderProps) {
  // useNetworkStatus가 이제 Override 상태까지 포함하여 반환함
  const networkStatus = useNetworkStatus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const previousStatusRef = useRef<'online' | 'offline'>('online');

  /**
   * 동기화 실행 함수 (중복 실행 방지)
   */
  const executeSync = useCallback(
    async (reason: string) => {
      if (isSyncing) {
        console.log('⏭️ [SyncProvider] Sync already in progress, skipping...');
        return;
      }

      try {
        setIsSyncing(true);
        console.log(`🔄 [SyncProvider] Sync triggered: ${reason}`);

        await syncData(); // Push + Pull

        const now = new Date();
        setLastSyncedAt(now);

        console.log(`✅ [SyncProvider] Sync completed: ${reason}`, {
          lastSyncedAt: now.toISOString(),
        });
      } catch (error) {
        console.error(`❌ [SyncProvider] Sync failed: ${reason}`, error);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing],
  );

  /**
   * 수동 동기화 트리거 (UI에서 호출)
   */
  const triggerManualSync = useCallback(async () => {
    await executeSync('Manual trigger');
  }, [executeSync]);

  /**
   * 1️⃣ 앱 시작 시 동기화 (온라인 상태일 때)
   */
  useEffect(() => {
    if (networkStatus === 'online') {
      console.log('🚀 [SyncProvider] Initial sync on app start');
      executeSync('App startup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 앱 시작 시 한 번만

  /**
   * 2️⃣ 네트워크 상태 변경 감지 → 복구 시 동기화
   */
  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    // 오프라인 → 온라인 전환 감지
    if (previousStatus === 'offline' && networkStatus === 'online') {
      console.log('🌐 [SyncProvider] Network recovered → Starting sync');
      executeSync('Network recovery');
    }

    // 온라인 → 오프라인 전환 로그
    if (previousStatus === 'online' && networkStatus === 'offline') {
      console.log('📴 [SyncProvider] Network offline → Sync paused');
    }

    // 현재 상태 저장
    previousStatusRef.current = networkStatus;
  }, [networkStatus, executeSync]);

  /**
   * 3️⃣ 주기적 동기화 (선택적)
   */
  useEffect(() => {
    if (!enablePeriodicSync) return;

    console.log(`⏰ [SyncProvider] Periodic sync enabled (${syncInterval / 1000}s interval)`);

    const intervalId = setInterval(() => {
      if (networkStatus === 'online') {
        executeSync('Periodic sync');
      } else {
        console.log('⏭️ [SyncProvider] Skipping periodic sync (offline)');
      }
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [enablePeriodicSync, syncInterval, networkStatus, executeSync]);

  /**
   * Context Value
   */
  const value: SyncContextValue = {
    isSyncing,
    lastSyncedAt,
    triggerManualSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
