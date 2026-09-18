import { useEffect } from 'react';
import { processPendingCleanups } from './cleanup-job';

const PENDING_CLEANUP_DELAY_MS = 2_000;

/** 인증 후 정리를 예약한다. 지연은 준비 완료 조건이 아니며 작업의 중복 실행은 서비스가 막는다. */
export function usePendingCleanups() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void processPendingCleanups().catch((error) => {
        console.error('[Cleanup] pending cleanup failed', error);
      });
    }, PENDING_CLEANUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);
}
