import React, { useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useNetworkOverride } from '@/features/debug';
import { pushChanges } from './engine';

/**
 * 동기화 Provider
 *
 * 앱 전체를 감싸서 자동 동기화 기능 제공
 * - 네트워크 상태 감지
 * - 오프라인 → 온라인 전환 시 자동 Push
 * - 앱 시작 시 한 번 동기화
 * - 디버그 모드: 강제 온라인/오프라인 설정 가능
 *
 * @example
 * ```tsx
 * <SyncProvider>
 *   <App />
 * </SyncProvider>
 * ```
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const realNetworkStatus = useNetworkStatus();
  const { overrideStatus } = useNetworkOverride();

  // Override가 있으면 Override 사용, 없으면 실제 네트워크 상태 사용
  const networkStatus = overrideStatus ?? realNetworkStatus;

  const previousStatusRef = useRef<'online' | 'offline'>('online');

  // 앱 시작 시 한 번 동기화 (온라인 상태일 때)
  useEffect(() => {
    if (networkStatus === 'online') {
      console.log('🚀 [Sync] Initial sync on app start');
      pushChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 앱 시작 시 한 번만

  // 네트워크 상태 변경 감지
  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    // 오프라인 → 온라인 전환 감지
    if (previousStatus === 'offline' && networkStatus === 'online') {
      console.log('🌐 [Sync] Network online → Starting auto-sync');
      pushChanges();
    }

    // 온라인 → 오프라인 전환 로그
    if (previousStatus === 'online' && networkStatus === 'offline') {
      console.log('📴 [Sync] Network offline → Sync paused');
    }

    // 현재 상태 저장
    previousStatusRef.current = networkStatus;
  }, [networkStatus]);

  return <>{children}</>;
}
