import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import NetInfo, {
  type NetInfoState,
  type NetInfoChangeHandler,
  NetInfoStateType,
} from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';

import {
  networkStore,
  resolveNetworkStatus,
  useNetworkCheck,
  useDisplayNetworkStatus,
  useNetworkStore,
  useRealNetworkStatus,
  type NetworkStatus,
} from '@/shared/store/network';

// 기기 네트워크 대신 테스트에서 관측 전달과 재확인 응답을 직접 제어한다.
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
    refresh: jest.fn(),
  },
  NetInfoStateType: { unknown: 'unknown' },
}));

const addEventListenerMock = jest.mocked(NetInfo.addEventListener);
const refreshMock = jest.mocked(NetInfo.refresh);

let listeners: NetInfoChangeHandler[];
let unsubscribeMock: ReturnType<typeof jest.fn>;

function createObservation(isConnected: boolean | null, isInternetReachable: boolean | null): NetInfoState {
  return {
    type: NetInfoStateType.unknown,
    isConnected,
    isInternetReachable,
    details: null,
  } as NetInfoState;
}

function emitObservation(isConnected: boolean | null, isInternetReachable: boolean | null) {
  // 가장 최근에 등록한 listener로 현재 session의 관측을 전달한다.
  listeners[listeners.length - 1](createObservation(isConnected, isInternetReachable));
}

// NetInfo.refresh 응답을 보류해 listener 관측·작업 제한 시간과의 도착 순서를 재현한다.
function createDeferredRefreshResult() {
  let resolve!: (state: NetInfoState) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<NetInfoState>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

beforeEach(() => {
  // 실제 10초를 기다리지 않고 테스트에서 시간 경과를 제어한다.
  jest.useFakeTimers();

  // 이전 session을 먼저 정리한다. cleanup이 유지하는 override는 별도로 초기화한다.
  networkStore.cleanup();
  networkStore.setOverride(null);
  jest.resetAllMocks();

  listeners = [];
  unsubscribeMock = jest.fn();

  addEventListenerMock.mockImplementation((listener) => {
    listeners.push(listener);
    // 등록 시에는 함수를 반환하고, cleanup에서 호출하는지 검사한다.
    return unsubscribeMock;
  });
});

afterEach(() => {
  networkStore.cleanup();
  jest.useRealTimers();
});

describe('인터넷 연결 관측 변환', () => {
  it.each<[boolean | null, boolean | null, NetworkStatus]>([
    [true, true, 'online'],
    [true, false, 'offline'],
    [false, true, 'offline'],
    [false, false, 'offline'],
    [false, null, 'offline'],
    [null, false, 'offline'],
    [true, null, 'unknown'],
    [null, true, 'unknown'],
    [null, null, 'unknown'],
  ])('%s / %s → %s', (isConnected, isInternetReachable, expectedStatus) => {
    expect(resolveNetworkStatus({ isConnected, isInternetReachable })).toBe(expectedStatus);
  });
});

describe('감지 session 수명과 unknown 확인 안내', () => {
  it('최초 관측 전에는 unknown이며 중복 init이 listener나 앱 fetch를 추가하지 않는다', () => {
    expect(networkStore.realStatus).toBe('unknown');

    networkStore.init();
    networkStore.init();

    expect(addEventListenerMock).toHaveBeenCalledTimes(1);
    expect(NetInfo.fetch).not.toHaveBeenCalled();

    emitObservation(true, true);

    expect(networkStore.realStatus).toBe('online');
  });

  it('같은 unknown을 반복해도 최초 10초 뒤 안내만 확인 불가로 바뀐다', () => {
    networkStore.init();

    // 9초에 같은 unknown을 받아도 최초 타이머가 연장되면 안 된다.
    jest.advanceTimersByTime(9_000);
    emitObservation(true, null);

    expect(useNetworkStore.getState().checkStatus).toBe('checking');

    jest.advanceTimersByTime(1_000);

    expect(networkStore.realStatus).toBe('unknown');
    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');

    emitObservation(null, null);

    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');

    emitObservation(true, true);

    expect(networkStore.realStatus).toBe('online');
    expect(useNetworkStore.getState().checkStatus).toBe('idle');
  });

  it('등록 중 첫 관측이 동기적으로 도착해도 unknown 안내 타이머를 남기지 않는다', () => {
    addEventListenerMock.mockImplementationOnce((listener) => {
      listeners.push(listener);
      // 해제 함수가 반환되기 전에 첫 관측이 도착하는 등록 순서를 재현한다.
      listener(createObservation(true, true));
      return unsubscribeMock;
    });

    networkStore.init();

    expect(networkStore.realStatus).toBe('online');
    expect(useNetworkStore.getState().checkStatus).toBe('idle');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('사용 중 다시 unknown이 되면 새 10초 안내를 시작한다', () => {
    networkStore.init();
    emitObservation(true, true);
    jest.advanceTimersByTime(20_000);

    emitObservation(true, null);

    expect(useNetworkStore.getState().checkStatus).toBe('checking');

    jest.advanceTimersByTime(10_000);

    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');
  });

  it('동일한 확정 관측은 Store 변경을 통지하지 않는다', () => {
    networkStore.init();
    emitObservation(true, true);
    const onStoreChange = jest.fn();
    const unsubscribeStore = useNetworkStore.subscribe(onStoreChange);

    emitObservation(true, true);

    expect(onStoreChange).not.toHaveBeenCalled();

    unsubscribeStore();
  });

  it('cleanup은 listener와 timer를 정리하고 이전 listener의 늦은 호출을 무시한다', () => {
    networkStore.init();
    const oldListener = listeners[0];

    networkStore.cleanup();
    networkStore.cleanup();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);

    networkStore.init();
    emitObservation(false, false);
    // 해제된 listener의 지연 호출을 일부러 재현해 session 비교를 검사한다.
    oldListener(createObservation(true, true));

    expect(networkStore.realStatus).toBe('offline');
    expect(addEventListenerMock).toHaveBeenCalledTimes(2);
  });

  it('listener 등록 실패는 unknown으로 남고 재확인 때 다시 등록할 수 있다', async () => {
    addEventListenerMock.mockImplementationOnce(() => {
      throw new Error('등록 실패');
    });

    networkStore.init();

    expect(networkStore.realStatus).toBe('unknown');
    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');

    refreshMock.mockResolvedValue(createObservation(true, true));

    await networkStore.refresh();

    expect(addEventListenerMock).toHaveBeenCalledTimes(2);
    expect(networkStore.realStatus).toBe('online');
  });
});

describe('재확인 작업과 완료 처리', () => {
  it('동시 refresh는 같은 완료 Promise를 공유하며 미확정 응답을 online으로 추정하지 않는다', async () => {
    networkStore.init();
    const pendingRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValue(pendingRefreshResult.promise);

    const firstRefreshPromise = networkStore.refresh();

    // 요청 횟수뿐 아니라 호출자들이 같은 완료 Promise를 받는지도 확인한다.
    expect(networkStore.refresh()).toBe(firstRefreshPromise);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(useNetworkStore.getState().isRefreshing).toBe(true);

    pendingRefreshResult.resolve(createObservation(true, null));
    await firstRefreshPromise;

    expect(networkStore.realStatus).toBe('unknown');
    expect(useNetworkStore.getState().isRefreshing).toBe(false);

    jest.advanceTimersByTime(10_000);

    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');

    emitObservation(true, true);

    expect(networkStore.realStatus).toBe('online');
  });

  it('명시적 재확인만 unknown의 안내 시간을 다시 시작한다', async () => {
    networkStore.init();
    jest.advanceTimersByTime(10_000);
    refreshMock.mockResolvedValue(createObservation(null, null));

    await networkStore.refresh();

    expect(useNetworkStore.getState().checkStatus).toBe('checking');

    jest.advanceTimersByTime(9_000);
    emitObservation(true, null);
    jest.advanceTimersByTime(1_000);

    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');
  });

  it('재확인 시작과 실패가 기존 확정 상태를 unknown/offline으로 초기화하지 않는다', async () => {
    networkStore.init();
    emitObservation(true, true);
    refreshMock.mockRejectedValue(new Error('재확인 실패'));

    const refreshPromise = networkStore.refresh();

    expect(networkStore.realStatus).toBe('online');

    await refreshPromise;

    expect(networkStore.realStatus).toBe('online');
    expect(useNetworkStore.getState().checkStatus).toBe('idle');
  });

  it('unknown의 재확인 실패는 확인 불가를 안내하고 늦은 listener 결과는 수용한다', async () => {
    networkStore.init();
    refreshMock.mockRejectedValue(new Error('재확인 실패'));

    await networkStore.refresh();

    expect(networkStore.realStatus).toBe('unknown');
    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');
    expect(useNetworkStore.getState().isRefreshing).toBe(false);
    expect(jest.getTimerCount()).toBe(0);

    emitObservation(false, null);

    expect(networkStore.realStatus).toBe('offline');
  });

  it('새 listener 관측 뒤 도착한 오래된 refresh 결과나 실패는 상태를 덮지 않는다', async () => {
    networkStore.init();
    const olderRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValueOnce(olderRefreshResult.promise);

    const firstRefreshPromise = networkStore.refresh();
    // listener의 새 관측을 먼저 반영한 뒤, 이전 요청의 상반된 결과를 도착시킨다.
    emitObservation(true, true);
    olderRefreshResult.resolve(createObservation(false, false));
    await firstRefreshPromise;

    expect(networkStore.realStatus).toBe('online');

    const failedRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValueOnce(failedRefreshResult.promise);

    const secondRefreshPromise = networkStore.refresh();
    emitObservation(true, null);
    failedRefreshResult.reject(new Error('이전 확인 실패'));
    await secondRefreshPromise;

    expect(useNetworkStore.getState().checkStatus).toBe('checking');
  });

  it('미응답 작업은 10초 뒤 완료되고 이전 응답이 진행 중인 작업을 덮지 않는다', async () => {
    networkStore.init();
    const olderRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValueOnce(olderRefreshResult.promise);

    const firstRefreshPromise = networkStore.refresh();
    jest.advanceTimersByTime(10_000);
    // NetInfo 조회는 미완료여도 재확인 작업의 완료 Promise는 제한 시간에 끝나야 한다.
    await firstRefreshPromise;

    expect(useNetworkStore.getState().isRefreshing).toBe(false);
    expect(useNetworkStore.getState().checkStatus).toBe('unavailable');

    const newerRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValueOnce(newerRefreshResult.promise);
    const secondRefreshPromise = networkStore.refresh();

    // 완료된 첫 작업의 늦은 응답이 현재 작업의 상태나 대기 표시를 건드리면 안 된다.
    olderRefreshResult.resolve(createObservation(false, false));
    await olderRefreshResult.promise;

    expect(networkStore.realStatus).toBe('unknown');
    expect(useNetworkStore.getState().checkStatus).toBe('checking');
    expect(useNetworkStore.getState().isRefreshing).toBe(true);
    expect(networkStore.refresh()).toBe(secondRefreshPromise);

    newerRefreshResult.resolve(createObservation(true, true));
    await secondRefreshPromise;

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(networkStore.realStatus).toBe('online');
    expect(useNetworkStore.getState().isRefreshing).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cleanup은 진행 중 확인을 해제하고 이전 확인 결과는 재초기화에 반영하지 않는다', async () => {
    networkStore.init();
    const olderRefreshResult = createDeferredRefreshResult();
    refreshMock.mockReturnValueOnce(olderRefreshResult.promise);

    const refreshPromise = networkStore.refresh();
    networkStore.cleanup();
    await refreshPromise;

    expect(useNetworkStore.getState().isRefreshing).toBe(false);
    expect(jest.getTimerCount()).toBe(0);

    networkStore.init();
    emitObservation(false, false);
    // 이전 session의 응답은 재초기화된 session에 적용되지 않아야 한다.
    olderRefreshResult.resolve(createObservation(true, true));
    await olderRefreshResult.promise;

    expect(networkStore.realStatus).toBe('offline');
  });
});

describe('실제 관측과 화면 표시', () => {
  it('override는 화면 훅만 바꾸며 실제 실행 판단과 확인 안내는 유지한다', () => {
    networkStore.init();
    const { result } = renderHook(() => ({
      display: useDisplayNetworkStatus(),
      real: useRealNetworkStatus(),
      check: useNetworkCheck(),
    }));

    // 관측·override 변경에 따른 React 훅 갱신까지 반영한 뒤 결과를 검사한다.
    act(() => {
      emitObservation(false, false);
      networkStore.setOverride('online');
    });

    expect(result.current.display).toBe('online');
    expect(result.current.real).toBe('offline');
    expect(networkStore.realStatus).toBe('offline');

    act(() => networkStore.setOverride('unknown'));

    expect(result.current.display).toBe('unknown');
    expect(result.current.check.checkStatus).toBe('idle');

    act(() => networkStore.setOverride(null));

    expect(result.current.display).toBe('offline');
  });
});
