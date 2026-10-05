import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTripListRefresh } from '@/application/useTripListRefresh';
import { useGetTrips } from '@/entities/trip/data/useGetTrips';
import { tripQueryKeys } from '@/entities/trip/data/keys';
import { getTripsLocal, refreshTripListLocal } from '@/entities/trip/lib/trip-local';
import { fetchAllTrips } from '@/entities/trip/api/trips';
import { hasAnyActivatedTrip } from '@/shared/services/offline-prep/metadata';
import { useNetworkStore } from '@/shared/store/network';
import { useAuthStore } from '@/shared/store/auth';
import type { Trip } from '@/entities/trip/model';

jest.mock('@/shared/services/offline-prep/metadata', () => ({ hasAnyActivatedTrip: jest.fn() }));
jest.mock('@/entities/trip/lib/trip-local', () => ({ getTripsLocal: jest.fn(), refreshTripListLocal: jest.fn() }));
jest.mock('@/entities/trip/api/trips', () => ({ fetchAllTrips: jest.fn() }));

const knownTrips = [{ id: 'known-trip' }] as Trip[];
const localTrips = [{ id: 'active-trip' }] as Trip[];
let client: QueryClient;

beforeEach(() => {
  useAuthStore.setState({ status: 'signed-in', userId: 'user-a' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  jest.mocked(hasAnyActivatedTrip).mockResolvedValue(false);
  jest.mocked(fetchAllTrips).mockResolvedValue({ success: true, data: knownTrips });
  jest.mocked(getTripsLocal).mockResolvedValue(localTrips);
  jest.mocked(refreshTripListLocal).mockImplementation(async (trips) => ({ trips, hasLocalTrips: false }));
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});

afterEach(() => {
  cleanup();
  client.clear();
  jest.restoreAllMocks();
});

function Refresh() {
  useTripListRefresh();
  return null;
}

function mount() {
  return renderHook(() => [useGetTrips(), useGetTrips()], {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <Refresh />
        {children}
      </QueryClientProvider>
    ),
  });
}

it.each(['offline', 'unknown'] as const)(
  '활성 여행이 없어도 %s 전환 동안 기존 여행 목록과 하나의 캐시를 유지한다',
  async (realStatus) => {
    const view = mount();
    await waitFor(() => expect(view.result.current[0].data).toEqual(knownTrips));
    act(() => useNetworkStore.setState({ realStatus }));
    expect(view.result.current[0].data).toEqual(knownTrips);
    await waitFor(() => expect(view.result.current[0].isFetching).toBe(false));
    expect(view.result.current[1].data).toEqual(knownTrips);
    expect(fetchAllTrips).toHaveBeenCalledTimes(1);
    expect(getTripsLocal).not.toHaveBeenCalled();
    expect(client.getQueryCache().findAll({ queryKey: tripQueryKeys.all() })).toHaveLength(1);

    jest.mocked(fetchAllTrips).mockResolvedValue({ success: true, data: [] });
    act(() => useNetworkStore.setState({ realStatus: 'online' }));
    await waitFor(() => expect(view.result.current[0].data).toEqual([]));
    expect(fetchAllTrips).toHaveBeenCalledTimes(2);
  },
);

it('느린 최초 서버 조회 중 단절되면 로컬로 다시 읽고 복구 뒤 늦은 이전 응답을 채택하지 않는다', async () => {
  jest.mocked(hasAnyActivatedTrip).mockResolvedValue(true);
  let finishOld!: (value: Awaited<ReturnType<typeof fetchAllTrips>>) => void;
  const oldRequest = new Promise<Awaited<ReturnType<typeof fetchAllTrips>>>((resolve) => {
    finishOld = resolve;
  });
  jest.mocked(fetchAllTrips).mockReturnValueOnce(oldRequest);
  const view = mount();
  await waitFor(() => expect(fetchAllTrips).toHaveBeenCalledTimes(1));
  act(() => useNetworkStore.setState({ realStatus: 'offline' }));
  await waitFor(() => expect(view.result.current[0].dataSource).toBe('local'));
  expect(view.result.current[0].data).toEqual(localTrips);

  act(() => useNetworkStore.setState({ realStatus: 'online' }));
  await waitFor(() => expect(view.result.current[0].data).toEqual(knownTrips));
  expect(fetchAllTrips).toHaveBeenCalledTimes(2);
  await act(async () => {
    finishOld({ success: true, data: [{ id: 'old-trip' }] as Trip[] });
    await oldRequest;
  });
  expect(view.result.current[0].data).toEqual(knownTrips);
});

it('재인증 대기에는 로컬을 읽고 같은 계정 인증 복구 뒤 서버 목록을 갱신한다', async () => {
  jest.mocked(hasAnyActivatedTrip).mockResolvedValue(true);
  const view = mount();
  await waitFor(() => expect(view.result.current[0].dataSource).toBe('remote'));
  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  await waitFor(() => expect(view.result.current[0].dataSource).toBe('local'));
  expect(fetchAllTrips).toHaveBeenCalledTimes(1);
  act(() => useAuthStore.setState({ status: 'signed-in' }));
  await waitFor(() => expect(view.result.current[0].dataSource).toBe('remote'));
  expect(fetchAllTrips).toHaveBeenCalledTimes(2);
});

it('화면 강제값·확인 진행·동일 상태 반복은 목록을 새로 조회하지 않는다', async () => {
  const view = mount();
  await waitFor(() => expect(view.result.current[0].isSuccess).toBe(true));
  await act(async () => {
    useNetworkStore.setState({ overrideStatus: 'offline', checkStatus: 'checking', realStatus: 'online' });
    useAuthStore.setState({ status: 'signed-in' });
  });
  expect(fetchAllTrips).toHaveBeenCalledTimes(1);
  expect(view.result.current[0].data).toEqual(knownTrips);
});

it('새 소비자는 아직 유효한 목록을 공유하고 별도의 연결 구독이나 재조회를 만들지 않는다', async () => {
  const view = mount();
  await waitFor(() => expect(view.result.current[0].isSuccess).toBe(true));
  const next = renderHook(() => useGetTrips(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  expect(next.result.current.data).toEqual(knownTrips);
  expect(next.result.current.isFetching).toBe(false);
  expect(fetchAllTrips).toHaveBeenCalledTimes(1);

  jest.mocked(fetchAllTrips).mockResolvedValue({ success: true, data: [] });
  act(() => useNetworkStore.setState({ realStatus: 'offline' }));
  await waitFor(() => expect(next.result.current.isFetching).toBe(false));
  act(() => useNetworkStore.setState({ realStatus: 'online' }));
  await waitFor(() => expect(next.result.current.data).toEqual([]));
  expect(view.result.current[0].data).toEqual([]);
  expect(fetchAllTrips).toHaveBeenCalledTimes(2);
});

it('앱 연결이 해제되면 네트워크·인증 변화가 목록을 갱신하지 않는다', async () => {
  const view = mount();
  await waitFor(() => expect(view.result.current[0].isSuccess).toBe(true));
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  view.unmount();
  await act(async () => {
    useNetworkStore.setState({ realStatus: 'offline' });
    useAuthStore.setState({ status: 'reauth-required' });
  });
  expect(invalidate).not.toHaveBeenCalled();
});
