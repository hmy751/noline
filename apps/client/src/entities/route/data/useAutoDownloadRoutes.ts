import { useMutation } from '@tanstack/react-query';

import { downloadRoutesForSchedules } from '@/shared/services/directions/route-downloader';

/** 일정 저장 후의 준비와 활성화가 같은 재사용·교체·실패 규칙을 사용한다. */
export function useAutoDownloadRoutes() {
  return useMutation({
    mutationFn: downloadRoutesForSchedules,
    onError: (error) => {
      console.error('[Routes] Failed to download routes:', error);
    },
  });
}
