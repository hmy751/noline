import { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { AuthRequiredError, useAuthStore } from '@/shared/store/auth';
import { refreshTokens } from './auth-transport';

type AuthRequest = InternalAxiosRequestConfig & { sessionId?: symbol; authRetried?: boolean };
const refreshes = new Map<symbol, Promise<void>>();

function assertCurrentSession(sessionId: symbol | undefined): asserts sessionId is symbol {
  if (!useAuthStore.isCurrentSession(sessionId ?? null)) {
    throw new AuthRequiredError();
  }
}

async function rejectCredentials(sessionId: symbol): Promise<never> {
  try {
    await useAuthStore.getState().requireReauthentication(sessionId);
  } catch (error) {
    // 메모리 상태는 저장보다 먼저 reauth-required가 된다. 저장 실패가
    // API 호출자에게 일반 서버 오류처럼 보이지 않게 인증 오류를 유지한다.
    console.error('[Auth] failed to persist rejected credentials', error);
  }
  throw new AuthRequiredError();
}

function renewSession(sessionId: symbol): Promise<void> {
  const existing = refreshes.get(sessionId);
  if (existing) {
    return existing;
  }

  const renewal = (async () => {
    assertCurrentSession(sessionId);
    const refreshToken = useAuthStore.getRefreshToken(sessionId);
    if (!refreshToken) {
      return rejectCredentials(sessionId);
    }

    let tokens;
    try {
      tokens = await refreshTokens(refreshToken);
    } catch (error) {
      assertCurrentSession(sessionId);
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        return rejectCredentials(sessionId);
      }
      // 연결 실패·서버 장애는 자격 증명이 거부됐다는 증거가 아니다.
      throw error;
    }
    const saved = await useAuthStore.getState().refreshTokens(tokens, sessionId);
    if (!saved) {
      throw new AuthRequiredError();
    }
  })();

  refreshes.set(sessionId, renewal);
  renewal.finally(() => refreshes.delete(sessionId)).catch(() => undefined);
  return renewal;
}

/** 일반 API와 sync가 같은 세션 확인·갱신·거부 기준을 사용한다. */
export function setupAuthInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config: AuthRequest) => {
    config.sessionId ??= useAuthStore.getState().sessionId ?? undefined;
    assertCurrentSession(config.sessionId);
    if (!useAuthStore.getAccessToken(config.sessionId)) {
      await renewSession(config.sessionId);
    }
    assertCurrentSession(config.sessionId);

    const accessToken = useAuthStore.getAccessToken(config.sessionId);
    if (!accessToken) {
      throw new AuthRequiredError();
    }
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      assertCurrentSession((response.config as AuthRequest).sessionId);
      return response;
    },
    async (error: AxiosError) => {
      const request = error.config as AuthRequest | undefined;
      if (!request || error.response?.status !== 401) {
        throw error;
      }
      assertCurrentSession(request.sessionId);
      if (request.authRetried) {
        return rejectCredentials(request.sessionId);
      }
      request.authRetried = true;

      await renewSession(request.sessionId);
      assertCurrentSession(request.sessionId);
      return client(request);
    },
  );
}

export const setupSyncAuthInterceptors = setupAuthInterceptors;
