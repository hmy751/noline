import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { networkStore, useRealNetworkStatus, type NetworkStatus } from '@/shared/store/network';
import { syncData } from './engine';

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<void>;
}

interface SyncProviderProps {
  children: React.ReactNode;
  enablePeriodicSync?: boolean;
  syncInterval?: number;
}

type SyncReason = 'app-startup' | 'online-transition' | 'manual' | 'periodic';

type SyncSkipReason = 'already-running' | 'network-offline' | 'network-unknown' | 'override-active';

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
  const networkStatus = useRealNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const previousNetworkStatusRef = useRef<NetworkStatus | null>(null);
  const syncingRef = useRef(false);

  const executeSync = useCallback(async (reason: SyncReason) => {
    const blockReason = getSyncBlockReason();

    if (blockReason) {
      logSyncSkipped(reason, blockReason);
      return;
    }

    if (syncingRef.current) {
      logSyncSkipped(reason, 'already-running');
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    const startedAt = Date.now();
    logSyncStarted(reason);

    try {
      await syncData();

      const syncedAt = new Date();
      setLastSyncedAt(syncedAt);
      logSyncCompleted(reason, Date.now() - startedAt, syncedAt);
    } catch (error) {
      logSyncFailed(reason, error, Date.now() - startedAt);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const triggerManualSync = useCallback(() => executeSync('manual'), [executeSync]);

  useEffect(() => {
    const previousStatus = previousNetworkStatusRef.current;
    previousNetworkStatusRef.current = networkStatus;

    if (networkStatus !== 'online' || previousStatus === 'online') {
      return;
    }

    const reason: SyncReason = previousStatus === null ? 'app-startup' : 'online-transition';
    void executeSync(reason);
  }, [networkStatus, executeSync]);

  useEffect(() => {
    if (!enablePeriodicSync) {
      return;
    }

    logPeriodicSyncEnabled(syncInterval);

    const intervalId = setInterval(() => {
      void executeSync('periodic');
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [enablePeriodicSync, syncInterval, executeSync]);

  const value = useMemo<SyncContextValue>(
    () => ({ isSyncing, lastSyncedAt, triggerManualSync }),
    [isSyncing, lastSyncedAt, triggerManualSync],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

function getSyncBlockReason(): SyncSkipReason | null {
  if (networkStore.override !== null) {
    return 'override-active';
  }

  if (networkStore.realStatus === 'offline') {
    return 'network-offline';
  }

  if (networkStore.realStatus === 'unknown') {
    return 'network-unknown';
  }

  return null;
}

function logSyncStarted(reason: SyncReason) {
  console.info('[Sync] started', { reason });
}

function logSyncCompleted(reason: SyncReason, durationMs: number, syncedAt: Date) {
  console.info('[Sync] completed', {
    reason,
    durationMs,
    syncedAt: syncedAt.toISOString(),
  });
}

function logSyncFailed(reason: SyncReason, error: unknown, durationMs: number) {
  console.error('[Sync] failed', { reason, durationMs, error });
}

function logSyncSkipped(reason: SyncReason, skipReason: SyncSkipReason) {
  console.debug('[Sync] skipped', { reason, skipReason });
}

function logPeriodicSyncEnabled(intervalMs: number) {
  console.info('[Sync] periodic sync enabled', { intervalMs });
}
