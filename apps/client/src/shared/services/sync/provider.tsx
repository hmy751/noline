import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';
import { executeSync, getSyncBlockReason, useSyncLifecycleStore, type SyncResult } from './lifecycle';

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<SyncResult>;
}

interface SyncProviderProps {
  children: React.ReactNode;
  enablePeriodicSync?: boolean;
  syncInterval?: number;
}

const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
}

export function SyncProvider({
  children,
  enablePeriodicSync = false,
  syncInterval = DEFAULT_SYNC_INTERVAL_MS,
}: SyncProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);
  const networkStatus = useNetworkStore((state) => state.realStatus);
  const overrideStatus = useNetworkStore((state) => state.overrideStatus);
  const isPaused = useSyncLifecycleStore((state) => state.isPaused);
  const isSyncing = useSyncLifecycleStore((state) => state.isSyncing);
  const lastSyncedAt = useSyncLifecycleStore((state) => state.lastSyncedAt);
  const previousEligibilityRef = useRef<boolean | null>(null);

  useEffect(() => {
    const eligible = getSyncBlockReason() === null;
    const previousEligibility = previousEligibilityRef.current;
    previousEligibilityRef.current = eligible;

    if (!eligible || previousEligibility === true) {
      return;
    }

    void executeSync(previousEligibility === null ? 'app-startup' : 'conditions-ready');
  }, [isAuthenticated, isSessionExpired, networkStatus, overrideStatus, isPaused]);

  useEffect(() => {
    if (!enablePeriodicSync) {
      return;
    }

    console.info('[Sync] periodic sync enabled', { intervalMs: syncInterval });
    const intervalId = setInterval(() => {
      void executeSync('periodic');
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [enablePeriodicSync, syncInterval]);

  const value = useMemo<SyncContextValue>(
    () => ({ isSyncing, lastSyncedAt, triggerManualSync }),
    [isSyncing, lastSyncedAt],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

function triggerManualSync(): Promise<SyncResult> {
  return executeSync('manual');
}
