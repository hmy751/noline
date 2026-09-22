import { create } from 'zustand';
import { inspectLocalAccount } from '../services/auth/local-account';
import {
  getAuthData,
  saveAuthData,
  clearAuthData,
  type DeviceSession,
  type LoginData,
  type Tokens,
  type UserInfo,
} from '../services/auth/token-storage';

export type AuthStatus = 'initializing' | 'signed-out' | 'signed-in' | 'reauth-required' | 'restore-failed';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  userInfo: UserInfo | null;
  sessionId: symbol | null;
  restoreSessionOnce: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
  saveAndApplySession: (data: LoginData) => Promise<void>;
  clearSession: () => Promise<void>;
  refreshTokens: (tokens: Tokens, sessionId: symbol | null) => Promise<boolean>;
  requireReauthentication: (sessionId: symbol | null) => Promise<void>;
}

export function hasLocalSession(state: Pick<AuthState, 'status'>): boolean {
  return state.status === 'signed-in' || state.status === 'reauth-required';
}

export function selectLocalUserId(state: Pick<AuthState, 'status' | 'userId'>): string | null {
  return hasLocalSession(state) ? state.userId : null;
}

export class AuthRequiredError extends Error {
  constructor(message = '다시 로그인해주세요') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export class LocalAccountMismatchError extends Error {
  constructor() {
    super('이 기기의 여행을 유지하려면 같은 계정으로 다시 로그인해주세요. 계정을 바꾸려면 먼저 로그아웃해주세요.');
    this.name = 'LocalAccountMismatchError';
  }
}

/** 현재 상태로 로컬 계정을 판단하는 기준은 Store에 둔다. DB 소유권 검사는 별도다. */
export function requireLocalUserId(requestedUserId?: string): string {
  const userId = selectLocalUserId(useAuthStore.getState());
  if (!userId || (requestedUserId && requestedUserId !== userId)) {
    throw new Error('이 계정의 여행 데이터에 접근할 수 없습니다');
  }
  return userId;
}

export function requireRemoteSession(): void {
  if (useAuthStore.getState().status !== 'signed-in') {
    throw new AuthRequiredError('이 작업은 다시 로그인한 뒤 사용할 수 있습니다');
  }
}

const EMPTY_SESSION = { userId: null, userInfo: null, sessionId: null };

export function createAuthStore() {
  let currentSession: DeviceSession | null = null;
  let sessionGeneration = Symbol('session');

  const store = create<AuthState>((set, get) => {
    let restorePromise: Promise<void> | null = null;
    let pendingWrites = Promise.resolve();
    let logoutEpoch = 0;

    // 복원·계정 검사·기기 저장·세션 적용 순서를 보존한다. 토큰 거부는 메모리에서 먼저 차단한다.
    function serializeSessionWrite<T>(operation: () => Promise<T>): Promise<T> {
      const result = pendingWrites.then(operation);
      pendingWrites = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    }

    function applySession(session: DeviceSession, sessionId: symbol) {
      currentSession = session;
      set({
        sessionId,
        userId: session.userId,
        userInfo: session.userInfo,
        status: session.accessToken || session.refreshToken ? 'signed-in' : 'reauth-required',
      });
    }

    function isCurrent(sessionId: symbol | null): sessionId is symbol {
      return sessionId !== null && sessionId === sessionGeneration && get().sessionId === sessionId;
    }

    async function readSession(restoreGeneration: symbol) {
      try {
        const session = await getAuthData();

        if (session) {
          const account = await inspectLocalAccount(session.userId);
          if (account === 'different' || account === 'unresolved') {
            throw new Error('저장된 계정과 여행 데이터의 소유자를 확인하지 못했습니다');
          }
        }

        if (restoreGeneration !== sessionGeneration) {
          return;
        }

        if (session) {
          applySession(session, restoreGeneration);
        } else {
          currentSession = null;
          set({ ...EMPTY_SESSION, status: 'signed-out' });
        }
      } catch (error) {
        if (restoreGeneration !== sessionGeneration) {
          return;
        }

        console.error('[Auth] session restore failed', error);
        currentSession = null;
        set({ ...EMPTY_SESSION, status: 'restore-failed' });
      }
    }

    return {
      ...EMPTY_SESSION,
      status: 'initializing',
      restoreSessionOnce: () => {
        if (!restorePromise) {
          const generation = sessionGeneration;
          restorePromise = serializeSessionWrite(() => readSession(generation));
        }
        return restorePromise;
      },
      retrySessionRestore: () => {
        if (get().status !== 'restore-failed') {
          return restorePromise ?? Promise.resolve();
        }

        set({ status: 'initializing' });
        const generation = sessionGeneration;
        restorePromise = serializeSessionWrite(() => readSession(generation));
        return restorePromise;
      },
      saveAndApplySession: (data) => {
        const loginEpoch = logoutEpoch;
        const sessionId = Symbol('session');
        const session: DeviceSession = { ...data, version: 1, userInfo: data.userInfo ?? null };
        restorePromise = Promise.resolve();

        return serializeSessionWrite(async () => {
          if (loginEpoch !== logoutEpoch) {
            throw new Error('종료된 세션의 로그인 저장은 적용할 수 없습니다');
          }
          const account = await inspectLocalAccount(data.userId);
          if (account === 'unresolved') {
            throw new Error('저장된 변경의 소유자를 확인하지 못했습니다. 데이터는 보존됩니다.');
          }
          const previousUserId = get().userId;
          if (account === 'different' || (previousUserId !== null && previousUserId !== data.userId)) {
            throw new LocalAccountMismatchError();
          }
          if (loginEpoch !== logoutEpoch) {
            throw new Error('종료된 세션의 로그인 저장은 적용할 수 없습니다');
          }
          await saveAuthData(session);
          if (loginEpoch !== logoutEpoch) {
            throw new Error('종료된 세션의 로그인 저장은 적용할 수 없습니다');
          }

          sessionGeneration = sessionId;
          applySession(session, sessionId);
        });
      },
      clearSession: () => {
        logoutEpoch += 1;
        sessionGeneration = Symbol('session');
        currentSession = null;
        restorePromise = Promise.resolve();

        const result = serializeSessionWrite(async () => {
          await clearAuthData();

          // 뒤 로그인은 같은 저장 큐에서 아직 실행되지 않았다. 삭제 성공을 먼저 공개한다.
          set({ ...EMPTY_SESSION, status: 'signed-out' });
        });

        // 삭제가 실패해도 이전 인증을 다시 허용하지 않는다. 계정은 종료 재시도를 위해 남긴다.
        if (hasLocalSession(get())) {
          set({ status: 'reauth-required' });
        }
        return result;
      },
      refreshTokens: (tokens, sessionId) =>
        serializeSessionWrite(async () => {
          const current = currentSession;

          if (!isCurrent(sessionId) || !current) {
            return false;
          }

          const session = { ...current, ...tokens };

          await saveAuthData(session);

          if (!isCurrent(sessionId)) {
            return false;
          }

          applySession(session, sessionId);
          return true;
        }),
      requireReauthentication: (sessionId) => {
        const current = currentSession;
        if (!isCurrent(sessionId) || !current) {
          return Promise.resolve();
        }

        // 요청 차단은 기기 저장을 기다리지 않는다. 진행 중 refresh도 이전 세대로 만든다.
        const rejectedSessionId = (sessionGeneration = Symbol('reauth-required'));
        const session = { ...current, accessToken: null, refreshToken: null };
        applySession(session, rejectedSessionId);
        return serializeSessionWrite(async () => {
          if (isCurrent(rejectedSessionId)) {
            await saveAuthData(session);
          }
        });
      },
    };
  });

  function isCurrentSession(sessionId: symbol | null): sessionId is symbol {
    const state = store.getState();
    return (
      sessionId !== null &&
      sessionId === sessionGeneration &&
      state.sessionId === sessionId &&
      state.status === 'signed-in' &&
      state.userId === currentSession?.userId
    );
  }

  function getToken(sessionId: symbol | null, kind: 'accessToken' | 'refreshToken'): string | null {
    return isCurrentSession(sessionId) ? (currentSession?.[kind] ?? null) : null;
  }

  return Object.assign(store, {
    isCurrentSession,
    getAccessToken: (sessionId: symbol | null) => getToken(sessionId, 'accessToken'),
    getRefreshToken: (sessionId: symbol | null) => getToken(sessionId, 'refreshToken'),
  });
}

export const useAuthStore = createAuthStore();
