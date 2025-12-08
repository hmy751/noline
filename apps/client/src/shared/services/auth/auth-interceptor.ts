import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, updateTokens } from './token-storage';
import { authStore } from '@/shared/store/auth';
import { EXPO_PUBLIC_API_URL } from '@env';

// ========================================
// Custom Error Classes
// ========================================

/**
 * 인증이 필요한 에러
 * - 401 에러 + refresh 실패 시 발생
 * - Sync Engine에서 이 에러 발생 시 PENDING 유지
 */
export class AuthRequiredError extends Error {
  constructor(message: string = '인증이 필요합니다') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

// ========================================
// Token Refresh State
// ========================================

// 토큰 갱신 중복 방지를 위한 Promise
let refreshPromise: Promise<boolean> | null = null;

/**
 * 토큰 갱신 API 호출 (순환 참조 방지를 위해 직접 axios 사용)
 */
async function refreshTokensDirectly(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh Token이 없습니다');
  }

  const response = await axios.post(`${EXPO_PUBLIC_API_URL}/api/auth/refresh`, {
    refreshToken,
  });

  if (!response.data.success) {
    throw new Error(response.data.error?.message || '토큰 갱신 실패');
  }

  return response.data.data;
}

/**
 * 토큰 갱신 시도
 * - 동시 여러 요청에서 호출되어도 한 번만 실행
 * @returns 갱신 성공 여부
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // 이미 갱신 중이면 기존 Promise 반환
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const currentRefreshToken = await getRefreshToken();
      if (!currentRefreshToken) {
        console.log('🔐 [Interceptor] No refresh token available');
        return false;
      }

      console.log('🔐 [Interceptor] Attempting token refresh...');
      const newTokens = await refreshTokensDirectly();

      // 새 토큰 저장
      await updateTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });

      // Store 업데이트
      authStore.setSessionExpired(false);

      console.log('🔐 [Interceptor] Token refresh successful');
      return true;
    } catch (error) {
      console.error('🔐 [Interceptor] Token refresh failed:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ========================================
// Request Interceptor
// ========================================

/**
 * 요청 인터셉터 - Authorization 헤더 추가
 */
async function requestInterceptor(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  // 인증 관련 엔드포인트는 토큰 추가 안 함
  const isAuthEndpoint =
    config.url?.includes('/auth/google') ||
    config.url?.includes('/auth/apple') ||
    config.url?.includes('/auth/refresh');

  if (isAuthEndpoint) {
    return config;
  }

  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

// ========================================
// Response Error Interceptor
// ========================================

/**
 * 에러 응답 인터셉터 - 401 처리
 * @param axiosInstance - 재시도를 위한 axios 인스턴스
 */
function createResponseErrorInterceptor(axiosInstance: AxiosInstance) {
  return async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러가 아니면 그대로 전달
    if (error.response?.status !== 401) {
      throw error;
    }

    // 이미 재시도한 요청이면 AuthRequiredError
    if (originalRequest._retry) {
      console.log('🔐 [Interceptor] Already retried, throwing AuthRequiredError');
      await handleAuthFailure();
      throw new AuthRequiredError();
    }

    // refresh 엔드포인트 자체가 실패한 경우
    if (originalRequest.url?.includes('/auth/refresh')) {
      console.log('🔐 [Interceptor] Refresh endpoint failed, throwing AuthRequiredError');
      await handleAuthFailure();
      throw new AuthRequiredError();
    }

    // 토큰 갱신 시도
    originalRequest._retry = true;
    const refreshSuccess = await attemptTokenRefresh();

    if (refreshSuccess) {
      // 새 토큰으로 재시도
      const newAccessToken = await getAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosInstance(originalRequest);
    }

    // 갱신 실패 → AuthRequiredError
    await handleAuthFailure();
    throw new AuthRequiredError();
  };
}

/**
 * 인증 실패 처리
 * - 세션 만료 상태 설정
 * - 토큰은 유지 (오프라인 지원)
 */
async function handleAuthFailure(): Promise<void> {
  console.log('🔐 [Interceptor] Auth failure, setting session expired');
  authStore.setSessionExpired(true);
  // Note: 토큰은 삭제하지 않음 (오프라인에서 인증 상태 유지)
  // 사용자가 명시적으로 로그아웃하거나 재로그인 시에만 토큰 삭제
}

// ========================================
// Setup Interceptors
// ========================================

/**
 * Axios 인스턴스에 인증 인터셉터 설정
 * @param axiosInstance - 인터셉터를 설정할 axios 인스턴스
 */
export function setupAuthInterceptors(axiosInstance: AxiosInstance): void {
  // Request: Authorization 헤더 추가
  axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

  // Response: 401 에러 처리 + 토큰 갱신
  axiosInstance.interceptors.response.use((response) => response, createResponseErrorInterceptor(axiosInstance));

  console.log('🔐 [Interceptor] Auth interceptors configured');
}

// ========================================
// Sync-specific Interceptor
// ========================================

/**
 * Sync API용 인터셉터 설정
 * - 토큰 갱신 시도는 동일
 * - 실패 시 AuthRequiredError (PENDING 유지용)
 */
export function setupSyncAuthInterceptors(axiosInstance: AxiosInstance): void {
  // Request: Authorization 헤더 추가
  axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));

  // Response: 401 에러 시 AuthRequiredError (재시도 없음)
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        console.log('🔐 [SyncInterceptor] 401 error, throwing AuthRequiredError');
        authStore.setSessionExpired(true);
        throw new AuthRequiredError('동기화 인증 실패');
      }
      throw error;
    },
  );

  console.log('🔐 [SyncInterceptor] Sync auth interceptors configured');
}
