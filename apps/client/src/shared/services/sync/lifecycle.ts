import { create } from 'zustand';

import { useAuthStore } from '@/shared/store/auth';
import { networkStore } from '@/shared/store/network';
import { isDatabaseReady } from '@/shared/db';
import { syncData } from './engine';

export type SyncReason = 'app-startup' | 'conditions-ready' | 'manual' | 'periodic';

export type SyncSkipReason =
  | 'already-running'
  | 'session-ending'
  | 'database-not-ready'
  | 'signed-out'
  | 'session-expired'
  | 'network-offline'
  | 'network-unknown'
  | 'override-active';

export type SyncResult =
  | { status: 'completed' }
  | { status: 'skipped'; reason: SyncSkipReason }
  | { status: 'failed'; error: unknown };

interface SyncLifecycleState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isPaused: boolean;
}

export const useSyncLifecycleStore = create<SyncLifecycleState>(() => ({
  isSyncing: false,
  lastSyncedAt: null,
  isPaused: false,
}));

let activeSync: Promise<SyncResult> | null = null;
let pauseCount = 0;

/** Provider와 수동 요청이 실행 순간의 조건과 하나의 잠금을 공유한다. */
export function executeSync(reason: SyncReason): Promise<SyncResult> {
  const blockReason = getSyncBlockReason();
  const skipReason = blockReason ?? (activeSync ? 'already-running' : null);

  if (skipReason) {
    console.debug('[Sync] skipped', { reason, skipReason });
    return Promise.resolve({ status: 'skipped', reason: skipReason });
  }

  // 엔진과 구독자의 실행보다 먼저 Promise를 등록해 React 밖 재진입도 차단한다.
  activeSync = Promise.resolve().then(() => runSync(reason));
  useSyncLifecycleStore.setState({ isSyncing: true });
  return activeSync;
}

/** 서버 세션을 종료하기 전 새 실행을 막고 기존 실행의 성공·실패 종료를 기다린다. */
export async function withSyncPaused<T>(operation: () => Promise<T>): Promise<T> {
  pauseCount++;
  useSyncLifecycleStore.setState({ isPaused: true });

  try {
    await activeSync;
    return await operation();
  } finally {
    pauseCount--;
    useSyncLifecycleStore.setState({ isPaused: pauseCount > 0 });
  }
}

export function getSyncBlockReason(): Exclude<SyncSkipReason, 'already-running'> | null {
  if (pauseCount > 0) {
    return 'session-ending';
  }
  if (!isDatabaseReady()) {
    return 'database-not-ready';
  }

  const auth = useAuthStore.getState();
  if (!auth.isAuthenticated) {
    return 'signed-out';
  }
  if (auth.isSessionExpired) {
    return 'session-expired';
  }
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

async function runSync(reason: SyncReason): Promise<SyncResult> {
  const startedAt = Date.now();
  console.info('[Sync] started', { reason });

  try {
    await syncData();

    const syncedAt = new Date();
    useSyncLifecycleStore.setState({ lastSyncedAt: syncedAt });
    console.info('[Sync] completed', {
      reason,
      durationMs: Date.now() - startedAt,
      syncedAt: syncedAt.toISOString(),
    });
    return { status: 'completed' };
  } catch (error) {
    console.error('[Sync] failed', { reason, durationMs: Date.now() - startedAt, error });
    return { status: 'failed', error };
  } finally {
    activeSync = null;
    useSyncLifecycleStore.setState({ isSyncing: false });
  }
}
