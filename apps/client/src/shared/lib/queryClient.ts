import { QueryClient } from '@tanstack/react-query';
import { AuthRequiredError } from '@/shared/store/auth';

/**
 * React Query 클라이언트 인스턴스 (Singleton)
 *
 * 앱 전체에서 사용하는 단일 QueryClient
 * - app/_layout.tsx에서 Provider에 전달
 * - sync/engine.ts에서 캐시 무효화에 사용
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 로컬 DB 조회는 staleTime을 길게 설정
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: (failureCount, error) => !(error instanceof AuthRequiredError) && failureCount < 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // SyncProvider가 처리
    },
    mutations: {
      retry: 0,
    },
  },
});
