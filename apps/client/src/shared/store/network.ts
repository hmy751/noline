import { create, type StoreApi } from 'zustand';
import { AppState } from 'react-native';
import NetInfo, { type NetInfoState, type NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'unknown';
export type NetworkCheckStatus = 'idle' | 'checking' | 'unavailable';

const UNKNOWN_CHECK_DELAY_MS = 10_000;
const REFRESH_TIMEOUT_MS = 10_000;

interface NetworkState {
  realStatus: NetworkStatus;
  overrideStatus: NetworkStatus | null;
  checkStatus: NetworkCheckStatus;
  isRefreshing: boolean;

  init: () => void;
  cleanup: () => void;
  refresh: () => Promise<void>;
  setOverride: (status: NetworkStatus | null) => void;
}

/**
 * init() ~ cleanup() 동안 유지되는 하나의 네트워크 감지 세션.
 *
 * listener 관측과 refresh 요청은 같은 세션을 공유한다.
 */
interface NetworkSession {
  unsubscribe: NetInfoSubscription | null;
  appStateSubscription: ReturnType<typeof AppState.addEventListener> | null;
  unknownCheckTimer: ReturnType<typeof setTimeout> | null;

  /**
   * listener에서 새로운 관측이 들어올 때마다 증가한다.
   *
   * refresh()보다 최신 listener 관측이 있다면
   * 뒤늦게 도착한 refresh 결과를 무시하기 위해 사용한다.
   */
  observationRevision: number;

  activeRefresh: RefreshOperation | null;
}

/**
 * 한 번의 refresh() 작업을 표현한다.
 *
 * 동시에 여러 refresh가 호출되면 이 Promise를 공유한다.
 */
interface RefreshOperation {
  promise: Promise<void>;
  accept: (state: NetInfoState) => void;
  fail: () => void;
  finish: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  realStatus: 'unknown',
  overrideStatus: null,
  checkStatus: 'checking',
  isRefreshing: false,

  ...createNetworkActions(set, get),

  setOverride: (status) => {
    set({ overrideStatus: status });
  },
}));

function createNetworkActions(
  set: StoreApi<NetworkState>['setState'],
  get: StoreApi<NetworkState>['getState'],
): Pick<NetworkState, 'init' | 'cleanup' | 'refresh'> {
  let currentSession: NetworkSession | null = null;

  /*
   * ---------------------------------------------------------------------------
   * Public lifecycle
   * ---------------------------------------------------------------------------
   */

  function init() {
    if (currentSession) {
      return;
    }

    const session = createSession();

    currentSession = session;

    startUnknownCheck(session);
    ensureSubscribed(session);

    let previousState = AppState.currentState;
    session.appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (!isActiveSession(session)) {
        return;
      }

      const isReturning = previousState === 'background' || previousState === 'inactive';
      previousState = nextState;
      // 복귀 때 놓친 연결 변화를 수동 확인과 같은 경로로 확인한다.
      if (isReturning && nextState === 'active') {
        void refresh();
      }
    });
  }

  function cleanup() {
    const session = currentSession;

    // 먼저 현재 세션에서 분리한다.
    // 이후 늦게 도착하는 callback이 이 세션을 변경하지 못하게 한다.
    currentSession = null;

    if (session) {
      clearUnknownCheckTimer(session);
      session.activeRefresh?.finish();
      session.unsubscribe?.();
      session.appStateSubscription?.remove();
    }

    set({
      realStatus: 'unknown',
      checkStatus: 'checking',
      isRefreshing: false,
    });
  }

  function refresh(): Promise<void> {
    init();

    const session = currentSession;

    if (!session) {
      return Promise.resolve();
    }

    // refresh 연타 시 새로운 요청을 만들지 않고 기존 Promise를 공유한다.
    if (session.activeRefresh) {
      return session.activeRefresh.promise;
    }

    // unknown 상태에서 사용자가 재확인하면 확인 시간을 다시 시작한다.
    if (get().realStatus === 'unknown') {
      startUnknownCheck(session);
    }

    if (!ensureSubscribed(session)) {
      return Promise.resolve();
    }

    const operation = createRefreshOperation(session);

    // refresh()의 반환 Promise는 operation.promise가 담당한다.
    // 실제 NetInfo 조회는 별도로 시작한다.
    void performRefresh(operation);

    return operation.promise;
  }

  /*
   * ---------------------------------------------------------------------------
   * Session
   * ---------------------------------------------------------------------------
   */

  function createSession(): NetworkSession {
    return {
      unsubscribe: null,
      appStateSubscription: null,
      unknownCheckTimer: null,
      observationRevision: 0,
      activeRefresh: null,
    };
  }

  function isActiveSession(session: NetworkSession): boolean {
    return currentSession === session;
  }

  /*
   * ---------------------------------------------------------------------------
   * Network observation
   * ---------------------------------------------------------------------------
   */

  function ensureSubscribed(session: NetworkSession): boolean {
    if (session.unsubscribe) {
      return true;
    }

    try {
      /**
       * addEventListener 등록 시 현재 네트워크 상태도 전달되므로
       * 초기 상태 확인을 위해 별도의 NetInfo.fetch()를 호출하지 않는다.
       */
      session.unsubscribe = NetInfo.addEventListener((state) => {
        if (!isActiveSession(session)) {
          return;
        }

        session.observationRevision += 1;

        applyObservation(session, state);
      });

      return true;
    } catch {
      markUnknownCheckUnavailable(session);

      return false;
    }
  }

  function applyObservation(session: NetworkSession, state: NetInfoState) {
    if (!isActiveSession(session)) {
      return;
    }

    const nextStatus = resolveNetworkStatus(state);
    const currentStatus = get().realStatus;

    /**
     * 같은 상태의 반복 관측은 무시한다.
     *
     * 특히 unknown → unknown 관측 때문에
     * 10초 안내 타이머가 계속 초기화되는 것을 방지한다.
     */
    if (nextStatus === currentStatus) {
      return;
    }

    if (nextStatus === 'unknown') {
      startUnknownCheck(session);

      return;
    }

    clearUnknownCheckTimer(session);

    set({
      realStatus: nextStatus,
      checkStatus: 'idle',
    });
  }

  /*
   * ---------------------------------------------------------------------------
   * Unknown state
   * ---------------------------------------------------------------------------
   */

  function startUnknownCheck(session: NetworkSession) {
    clearUnknownCheckTimer(session);

    session.unknownCheckTimer = setTimeout(() => {
      markUnknownCheckUnavailable(session);
    }, UNKNOWN_CHECK_DELAY_MS);

    set({
      realStatus: 'unknown',
      checkStatus: 'checking',
    });
  }

  function markUnknownCheckUnavailable(session: NetworkSession) {
    if (!isActiveSession(session)) {
      return;
    }

    if (get().realStatus !== 'unknown') {
      return;
    }

    clearUnknownCheckTimer(session);

    if (get().checkStatus === 'unavailable') {
      return;
    }

    set({
      checkStatus: 'unavailable',
    });
  }

  function clearUnknownCheckTimer(session: NetworkSession) {
    if (session.unknownCheckTimer === null) {
      return;
    }

    clearTimeout(session.unknownCheckTimer);
    session.unknownCheckTimer = null;
  }

  /*
   * ---------------------------------------------------------------------------
   * Refresh
   * ---------------------------------------------------------------------------
   */

  function createRefreshOperation(session: NetworkSession): RefreshOperation {
    const startingRevision = session.observationRevision;

    let resolvePromise!: () => void;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let finished = false;

    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    /**
     * refresh를 시작한 뒤 listener에서 더 최신 관측이 들어왔다면
     * refresh 결과는 오래된 결과일 수 있으므로 적용하지 않는다.
     */
    function canApplyResult() {
      return (
        isActiveSession(session) &&
        session.activeRefresh === operation &&
        session.observationRevision === startingRevision
      );
    }

    function finish() {
      if (finished) {
        return;
      }

      finished = true;

      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      if (session.activeRefresh === operation) {
        session.activeRefresh = null;

        if (isActiveSession(session)) {
          set({
            isRefreshing: false,
          });
        }
      }

      resolvePromise();
    }

    const operation: RefreshOperation = {
      promise,

      accept: (state) => {
        if (canApplyResult()) {
          applyObservation(session, state);
        }

        finish();
      },

      fail: () => {
        if (canApplyResult()) {
          markUnknownCheckUnavailable(session);
        }

        finish();
      },

      finish,
    };

    session.activeRefresh = operation;

    timeout = setTimeout(() => {
      operation.fail();
    }, REFRESH_TIMEOUT_MS);

    set({
      isRefreshing: true,
    });

    return operation;
  }

  async function performRefresh(operation: RefreshOperation): Promise<void> {
    let state: NetInfoState;

    try {
      state = await NetInfo.refresh();
    } catch {
      operation.fail();
      return;
    }

    operation.accept(state);
  }

  return {
    init,
    cleanup,
    refresh,
  };
}

/**
 * 인터넷 도달 여부가 확실하지 않은 경우
 * 임의로 offline으로 판단하지 않는다.
 */
export function resolveNetworkStatus(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>): NetworkStatus {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return 'offline';
  }

  if (state.isConnected === true && state.isInternetReachable === true) {
    return 'online';
  }

  return 'unknown';
}

/**
 * 비React 코드에서는 실제 네트워크 상태만 사용한다.
 * 화면 테스트용 override는 요청 가능 여부 판단에 사용하지 않는다.
 */
export const networkStore = {
  get realStatus() {
    return useNetworkStore.getState().realStatus;
  },

  get override() {
    return useNetworkStore.getState().overrideStatus;
  },

  setOverride(status: NetworkStatus | null) {
    useNetworkStore.getState().setOverride(status);
  },

  init() {
    useNetworkStore.getState().init();
  },

  cleanup() {
    useNetworkStore.getState().cleanup();
  },

  refresh() {
    return useNetworkStore.getState().refresh();
  },
};

/*
 * -----------------------------------------------------------------------------
 * React selectors
 * -----------------------------------------------------------------------------
 */

export function useRealNetworkStatus(): NetworkStatus {
  return useNetworkStore((state) => state.realStatus);
}

/**
 * 화면 표시 및 네트워크 제한 상황 시뮬레이션용 상태.
 *
 * 실제 API 요청 가능 여부 판단에는 사용하지 않는다.
 */
export function useDisplayNetworkStatus(): NetworkStatus {
  return useNetworkStore((state) => state.overrideStatus ?? state.realStatus);
}

export function useNetworkCheck() {
  const checkStatus = useNetworkStore((state) => state.checkStatus);
  const isRefreshing = useNetworkStore((state) => state.isRefreshing);
  const refresh = useNetworkStore((state) => state.refresh);

  return {
    checkStatus,
    isRefreshing,
    refresh,
  };
}

export function useNetworkControl() {
  const overrideStatus = useNetworkStore((state) => state.overrideStatus);

  const setOverride = useNetworkStore((state) => state.setOverride);

  return {
    overrideStatus,

    setOverrideOnline: () => setOverride('online'),
    setOverrideOffline: () => setOverride('offline'),
    setOverrideUnknown: () => setOverride('unknown'),
    clearOverride: () => setOverride(null),
  };
}
