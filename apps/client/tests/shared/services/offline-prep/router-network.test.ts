import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { networkStore, useNetworkStore, type NetworkStatus } from '@/shared/store/network';
import { getTripActivationStatus, hasAnyActivatedTrip } from '@/shared/services/offline-prep/metadata';
import {
  routeTripQuery,
  routeChildQuery,
  routeTripMutation,
  routeChildMutation,
} from '@/shared/services/offline-prep/router';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));

jest.mock('@/shared/services/offline-prep/metadata', () => ({
  getTripActivationStatus: jest.fn(),
  hasAnyActivatedTrip: jest.fn(),
}));

const activationMock = jest.mocked(getTripActivationStatus);
const anyActivationMock = jest.mocked(hasAnyActivatedTrip);
const networkStatuses: NetworkStatus[] = ['online', 'offline', 'unknown'];

interface TestOperations {
  local: () => Promise<string>;
  remote: () => Promise<string>;
}

const routeCases = [
  {
    name: 'Trip 조회',
    activationCondition: '전역 활성 여행이 있으면',
    inactiveCondition: '전역 활성 여행이 없으면',
    isMutation: false,
    run: (operations: TestOperations) => routeTripQuery(operations),
  },
  {
    name: 'Child 조회',
    activationCondition: '소속 여행이 활성화돼 있으면',
    inactiveCondition: '소속 여행이 비활성이면',
    isMutation: false,
    run: (operations: TestOperations) => routeChildQuery('trip-b', operations),
  },
  {
    name: 'Trip 쓰기',
    activationCondition: '전역 활성 여행이 있으면',
    inactiveCondition: '전역 활성 여행이 없으면',
    isMutation: true,
    run: (operations: TestOperations) => routeTripMutation(operations),
  },
  {
    name: 'Child 쓰기',
    activationCondition: '소속 여행이 활성화돼 있으면',
    inactiveCondition: '소속 여행이 비활성이면',
    isMutation: true,
    run: (operations: TestOperations) => routeChildMutation('trip-b', operations),
  },
];

function createOperations() {
  return {
    local: jest.fn(async () => 'local'),
    remote: jest.fn(async () => 'remote'),
  };
}

beforeEach(() => {
  useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });
  activationMock.mockResolvedValue(false);
  anyActivationMock.mockResolvedValue(false);
});

afterEach(() => networkStore.cleanup());

describe.each(routeCases)('$name의 네트워크 소비', ({ run, activationCondition, inactiveCondition }) => {
  it.each(networkStatuses)(`${activationCondition} %s에서 Local만 실행한다`, async (realStatus) => {
    activationMock.mockResolvedValue(true);
    anyActivationMock.mockResolvedValue(true);
    useNetworkStore.setState({ realStatus });
    const operations = createOperations();

    await expect(run(operations)).resolves.toBe('local');

    expect(operations.local).toHaveBeenCalledTimes(1);
    expect(operations.remote).not.toHaveBeenCalled();
  });

  it.each(['offline', 'unknown'] as const)(
    `${inactiveCondition} %s에서 Remote를 실행하지 않는다`,
    async (realStatus) => {
      useNetworkStore.setState({ realStatus });
      const operations = createOperations();

      await expect(run(operations)).rejects.toMatchObject({
        name: 'OfflineError',
        action: realStatus === 'unknown' ? 'ONLINE_REQUIRED' : 'ACTIVATE_PROMPT',
      });

      expect(operations.local).not.toHaveBeenCalled();
      expect(operations.remote).not.toHaveBeenCalled();
    },
  );

  it('화면 강제 online이 실제 unknown의 Remote 경로를 열지 않는다', async () => {
    networkStore.setOverride('online');
    const operations = createOperations();

    await expect(run(operations)).rejects.toMatchObject({ name: 'OfflineError' });

    expect(operations.remote).not.toHaveBeenCalled();
  });
});

describe.each(routeCases.filter((route) => route.name.startsWith('Child')))('$name의 소속 여행 판단', ({ run }) => {
  it('다른 활성 여행이 있어도 소속 여행이 비활성이면 실제 online에서 Remote만 실행한다', async () => {
    anyActivationMock.mockResolvedValue(true);
    activationMock.mockResolvedValue(false);
    useNetworkStore.setState({ realStatus: 'online' });
    const operations = createOperations();

    await expect(run(operations)).resolves.toBe('remote');

    expect(activationMock).toHaveBeenCalledWith('trip-b');
    expect(operations.local).not.toHaveBeenCalled();
    expect(operations.remote).toHaveBeenCalledTimes(1);
  });

  it('전역 활성 판단과 달라도 소속 여행이 활성화돼 있으면 Local만 실행한다', async () => {
    anyActivationMock.mockResolvedValue(false);
    activationMock.mockResolvedValue(true);
    useNetworkStore.setState({ realStatus: 'online' });
    const operations = createOperations();

    await expect(run(operations)).resolves.toBe('local');

    expect(activationMock).toHaveBeenCalledWith('trip-b');
    expect(operations.local).toHaveBeenCalledTimes(1);
    expect(operations.remote).not.toHaveBeenCalled();
  });
});

describe.each(routeCases.filter((route) => !route.isMutation))('$name의 debug 표시와 조회 분리', ({ run }) => {
  it('실제 online이면 화면 override와 관계없이 Remote를 실행한다', async () => {
    useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'offline' });
    const operations = createOperations();

    await expect(run(operations)).resolves.toBe('remote');

    expect(operations.local).not.toHaveBeenCalled();
    expect(operations.remote).toHaveBeenCalledTimes(1);
  });
});

describe.each(routeCases.filter((route) => route.isMutation))('$name의 debug 쓰기 차단', ({ run }) => {
  it('실제 online이어도 화면 override 중에는 비활성 여행의 Remote 변경을 실행하지 않는다', async () => {
    useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'offline' });
    const operations = createOperations();

    await expect(run(operations)).rejects.toThrow('화면 테스트 중');

    expect(operations.local).not.toHaveBeenCalled();
    expect(operations.remote).not.toHaveBeenCalled();
  });

  it('화면 override를 해제하면 실제 online에서 비활성 여행의 Remote 변경을 재개할 수 있다', async () => {
    useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'offline' });
    const operations = createOperations();

    await expect(run(operations)).rejects.toThrow('화면 테스트 중');
    networkStore.setOverride(null);

    await expect(run(operations)).resolves.toBe('remote');

    expect(operations.local).not.toHaveBeenCalled();
    expect(operations.remote).toHaveBeenCalledTimes(1);
  });

  it.each(networkStatuses)('강제 %s 중에는 활성 여행의 Local 변경도 실행하지 않는다', async (overrideStatus) => {
    activationMock.mockResolvedValue(true);
    anyActivationMock.mockResolvedValue(true);
    useNetworkStore.setState({ realStatus: 'online', overrideStatus });
    const operations = createOperations();

    await expect(run(operations)).rejects.toThrow('강제 설정을 해제');

    expect(operations.local).not.toHaveBeenCalled();
    expect(operations.remote).not.toHaveBeenCalled();
  });
});
