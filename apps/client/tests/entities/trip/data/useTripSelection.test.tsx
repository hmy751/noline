import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useTripSelection } from '@/entities/trip/data/useTripSelection';
import { useGetTrips } from '@/entities/trip/data/useGetTrips';
import { useTripStore } from '@/shared/store/useTripStore';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('@/entities/trip/data/useGetTrips', () => ({ useGetTrips: jest.fn() }));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));

function mockTripQuery(
  ids: string[],
  source: 'local' | 'remote' = 'remote',
  options: { isSuccess?: boolean; isFetching?: boolean } = {},
) {
  jest.mocked(useGetTrips).mockReturnValue({
    data: ids.map((id) => ({ id })),
    dataSource: source,
    isSuccess: true,
    isFetching: false,
    ...options,
  } as ReturnType<typeof useGetTrips>);
}

beforeEach(() => {
  useTripStore.setState({ selectedTripId: null });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
});

describe('여행 선택 유지와 기본 선택', () => {
  it('첫 로컬 목록에서도 선택을 만들고 사용자가 선택한 여행은 재조회 뒤에도 유지한다', () => {
    mockTripQuery(['main', 'chosen'], 'local');

    const view = renderHook(() => useTripSelection());

    expect(useTripStore.getState().selectedTripId).toBe('main');

    act(() => useTripStore.setState({ selectedTripId: 'chosen' }));
    mockTripQuery(['main', 'chosen']);
    view.rerender({});

    expect(useTripStore.getState().selectedTripId).toBe('chosen');
  });

  it.each<[string, string[], string | null]>([
    ['다른 여행', ['remaining'], 'remaining'],
    ['빈 목록', [], null],
  ])('성공한 서버 조회에서 기존 여행이 사라지면 %s으로 전환한다', (_label, ids, expected) => {
    useTripStore.setState({ selectedTripId: 'removed' });
    mockTripQuery([...ids]);
    renderHook(() => useTripSelection());

    expect(useTripStore.getState().selectedTripId).toBe(expected);
  });

  it.each([
    { scenario: '로컬 목록', source: 'local' as const, networkStatus: 'online' as const, options: {} },
    { scenario: 'offline', source: 'remote' as const, networkStatus: 'offline' as const, options: {} },
    { scenario: 'unknown', source: 'remote' as const, networkStatus: 'unknown' as const, options: {} },
    { scenario: '조회 중', source: 'remote' as const, networkStatus: 'online' as const, options: { isFetching: true } },
    {
      scenario: '조회 실패',
      source: 'remote' as const,
      networkStatus: 'online' as const,
      options: { isSuccess: false },
    },
  ])('$scenario 상태에서 목록에 없다는 이유로 선택을 바꾸지 않는다', ({ source, networkStatus, options }) => {
    useTripStore.setState({ selectedTripId: 'chosen' });
    useNetworkStore.setState({ realStatus: networkStatus });
    mockTripQuery(['remaining'], source, options);

    renderHook(() => useTripSelection());

    expect(useTripStore.getState().selectedTripId).toBe('chosen');
  });

  it('네트워크 복구만으로 선택을 바꾸지 않고 새 서버 결과가 도착한 뒤 판단한다', () => {
    useTripStore.setState({ selectedTripId: 'chosen' });
    useNetworkStore.setState({ realStatus: 'offline' });
    mockTripQuery(['remaining']);
    const view = renderHook(() => useTripSelection());
    act(() => useNetworkStore.setState({ realStatus: 'online' }));
    view.rerender({});

    expect(useTripStore.getState().selectedTripId).toBe('chosen');

    mockTripQuery(['remaining']);
    view.rerender({});

    expect(useTripStore.getState().selectedTripId).toBe('remaining');
  });
});
