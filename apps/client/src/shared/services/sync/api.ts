import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

/**
 * 동기화 전용 Axios 클라이언트
 *
 * 특징:
 * - sync_queue 작업을 서버로 전송하는 전용 클라이언트
 * - 5xx 에러 시 자동 재시도 (최대 3회)
 * - Exponential Backoff: 2초, 4초, 8초
 * - 네트워크 에러는 재시도하지 않음 (오프라인 상태)
 */

const syncApiClient: AxiosInstance = axios.create({
  baseURL: EXPO_PUBLIC_API_URL,
  timeout: 15000, // 15초 (일반 API보다 여유 있게)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * - 인증 토큰 자동 추가 (향후 구현)
 */
syncApiClient.interceptors.request.use(
  (config) => {
    // TODO: 인증 구현 시 토큰 추가
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    console.log(`🔄 [Sync API] ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error('❌ [Sync API] Request error:', error);
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * - 자동 재시도 로직 (5xx 에러)
 * - Exponential Backoff
 */
syncApiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [Sync API] Success:`, response.status);
    return response;
  },
  async (error: AxiosError) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalRequest = error.config as any;

    // 재시도 가능 여부 판단
    const shouldRetry = error.response?.status && error.response.status >= 500 && error.response.status < 600; // 5xx 에러만 재시도

    // 네트워크 에러는 재시도하지 않음 (오프라인 상태)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('⚠️ [Sync API] Network error, not retrying (offline)');
      return Promise.reject(error);
    }

    // 재시도 로직
    if (shouldRetry && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // 최대 3회 재시도
      if (originalRequest._retryCount <= 3) {
        // Exponential Backoff: 2초, 4초, 8초
        const delay = 2000 * Math.pow(2, originalRequest._retryCount - 1);

        console.log(`🔄 [Sync API] Retrying (${originalRequest._retryCount}/3) after ${delay}ms...`);

        // 지연 후 재시도
        await new Promise((resolve) => setTimeout(resolve, delay));

        return syncApiClient(originalRequest);
      } else {
        console.error('❌ [Sync API] Max retries reached (3)');
      }
    }

    // 재시도 불가 또는 실패
    console.error(`❌ [Sync API] Error:`, error.response?.status, error.response?.data || error.message);

    return Promise.reject(error);
  },
);

export default syncApiClient;

/**
 * 동기화 API 엔드포인트
 */
export const syncApiEndpoints = {
  /**
   * Push: 로컬 변경사항을 서버로 전송
   */
  push: '/api/sync/push',

  /**
   * Pull: 서버 변경사항을 로컬로 가져오기 (Phase 2에서 구현)
   */
  pull: '/api/sync/pull',
};
