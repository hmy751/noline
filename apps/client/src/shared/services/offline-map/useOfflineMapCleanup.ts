/**
 * useOfflineMapCleanup Hook
 * 앱 시작 시 오프라인 지도 자동 정리
 */

import { useEffect } from 'react';
import { cleanupExpiredOfflineMaps } from './cleanup';

/**
 * 오프라인 지도 자동 정리 Hook
 *
 * 사용:
 * - 앱 Root에서 한 번만 호출
 * - 앱 시작 시 한 번 실행
 * - 백그라운드에서 정리 작업 수행
 */
export function useOfflineMapCleanup() {
  useEffect(() => {
    // 앱 시작 시 1초 후 정리 작업 실행 (초기 로딩 방해 방지)
    const timer = setTimeout(() => {
      cleanupExpiredOfflineMaps();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}
