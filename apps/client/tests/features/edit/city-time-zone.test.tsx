import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TripDateForm from '@/features/trip/create-trip/TripDateForm';
import type { TripData } from '@/entities/trip';
import { EditTripDrawer } from '@/features/trip/update-trip/EditTripDrawer';
import { resolveCityTimeZone } from '@/features/trip/create-trip/geonames.api';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore, networkStore } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { OfflineError } from '@/shared/services/offline-prep/errors';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));

jest.mock('@/entities/trip', () => ({
  useCreateTrip: () => ({ mutate: mockCreate, isPending: false, error: mockCreateError }),
  useUpdateTrip: () => ({ mutate: mockUpdate, isPending: false }),
  useDeleteTrip: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/features/trip/create-trip/geonames.api', () => ({ resolveCityTimeZone: jest.fn() }));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'new-trip' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Drawer: ({ children, childrenOverlay }: { children?: React.ReactNode; childrenOverlay?: React.ReactNode }) =>
      ReactRuntime.createElement(View, null, children, childrenOverlay),
    Pressable: ({
      children,
      ...props
    }: Omit<React.ComponentProps<typeof Pressable>, 'children'> & { children?: React.ReactNode }) =>
      ReactRuntime.createElement(Pressable, props, ReactRuntime.createElement(Text, null, children)),
  };
});
jest.mock('@/shared/components/DatePicker/DatePicker', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ visible, onSelectDate }: { visible: boolean; onSelectDate: (date: string) => void }) =>
      visible
        ? ReactRuntime.createElement(
            View,
            null,
            ...['2026-10-01', '2026-10-03'].map((date) =>
              ReactRuntime.createElement(
                Pressable,
                { key: date, onPress: () => onSelectDate(date) },
                ReactRuntime.createElement(Text, null, `선택 ${date}`),
              ),
            ),
          )
        : null,
  };
});

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
let mockCreateError: Error | null = null;
const city = { id: 1850147, name: 'Tokyo', country: 'Japan', countryCode: 'JP', latitude: 35.68, longitude: 139.69 };
const tripMetadata = {
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  userId: null,
  baseCurrency: 'JPY',
};
const clients: QueryClient[] = [];
function open(component: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{component}</QueryClientProvider>);
}
beforeEach(() => {
  mockCreateError = null;
  useAuthStore.setState({ status: 'signed-in', userId: 'a' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  networkStore.cleanup();
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});

it('도시 시간대 조회 실패·재시도는 날짜 초안을 유지하며 Tokyo 자정을 UTC로 저장한다', async () => {
  jest.mocked(resolveCityTimeZone).mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce('Asia/Tokyo');
  const view = open(<TripDateForm city={city} />);
  fireEvent.press(view.getByText('시작일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-01'));
  fireEvent.press(view.getByText('종료일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  await waitFor(() => expect(view.getByText('시간대 다시 확인')).toBeTruthy());
  expect(mockCreate).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('시간대 다시 확인'));
  await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(view.getByText('2026-10-03')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('여행 생성')));
  expect(mockCreate.mock.calls[0][0]).toMatchObject({
    timeZone: 'Asia/Tokyo',
    startDate: '2026-09-30T15:00:00.000Z',
    endDate: '2026-10-02T15:00:00.000Z',
  });
  expect(resolveCityTimeZone).toHaveBeenCalledTimes(2);
});

it('시간대 조회가 가능해도 여행 생성 정책이 제한되면 생성하지 않는다', async () => {
  useAuthStore.setState({ status: 'reauth-required' });
  jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
  const view = open(<TripDateForm city={city} />);
  await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
  fireEvent.press(view.getByText('시작일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-01'));
  fireEvent.press(view.getByText('종료일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  await act(async () => fireEvent.press(view.getByText('여행 생성')));
  expect(view.getByText('다시 로그인한 뒤 사용할 수 있습니다')).toBeTruthy();
  expect(mockCreate).not.toHaveBeenCalled();
});

it('캐시된 시간대가 있어도 실제 offline에서는 새 여행 생성을 막고 날짜를 보존한다', async () => {
  useNetworkStore.setState({ realStatus: 'offline' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  client.setQueryData(['city-time-zone', city.id, city.latitude, city.longitude], 'Asia/Tokyo');
  const view = render(
    <QueryClientProvider client={client}>
      <TripDateForm city={city} />
    </QueryClientProvider>,
  );
  fireEvent.press(view.getByText('시작일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-01'));
  fireEvent.press(view.getByText('종료일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  await act(async () => fireEvent.press(view.getByText('여행 생성')));
  expect(resolveCityTimeZone).not.toHaveBeenCalled();
  expect(mockCreate).not.toHaveBeenCalled();
  expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy();
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(view.getByText('여행을 만들려면 인터넷 연결이 필요해요')).toBeTruthy();
});

it('기존 여행 시간대 확인은 offset·초·밀리초를 가진 여행 시각을 재작성하지 않는다', async () => {
  jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
  const trip: TripData = {
    ...tripMetadata,
    ...city,
    id: 'legacy-trip',
    cityId: city.id,
    name: 'Tokyo 여행',
    destination: 'Tokyo',
    latitude: '35.68',
    longitude: '139.69',
    timeZone: null,
    startDate: '2026-10-01T00:00:12.345+09:00',
    endDate: '2026-10-03T00:00:45.678+09:00',
  };
  const view = open(<EditTripDrawer isOpen onClose={jest.fn()} trip={trip} />);
  expect(view.getByText('시간대 확인 필요 · UTC 기준')).toBeTruthy();
  fireEvent.press(view.getByText('도시 시간대 확인'));
  await waitFor(() => expect(view.getByText('확인한 도시 시간대: Asia/Tokyo')).toBeTruthy());
  expect(view.getByText('시간대 확인 필요 · UTC 기준')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('시간대 적용')));
  expect(mockUpdate.mock.calls[0][0]).toEqual({ id: 'legacy-trip', data: { timeZone: 'Asia/Tokyo' } });
});

it('여행 편집 중 query의 시간대가 바뀌면 UTC 입력을 그대로 보관하고 다시 열도록 안내한다', () => {
  const trip: TripData = {
    ...tripMetadata,
    id: 'legacy-trip',
    cityId: city.id,
    name: 'Tokyo 여행',
    destination: 'Tokyo',
    country: 'Japan',
    latitude: '35.68',
    longitude: '139.69',
    timeZone: null,
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-03T00:00:00Z',
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const view = render(
    <QueryClientProvider client={client}>
      <EditTripDrawer isOpen onClose={jest.fn()} trip={trip} />
    </QueryClientProvider>,
  );
  view.rerender(
    <QueryClientProvider client={client}>
      <EditTripDrawer isOpen onClose={jest.fn()} trip={{ ...trip, timeZone: 'Asia/Tokyo' }} />
    </QueryClientProvider>,
  );
  expect(view.getByText('시간대 확인 필요 · UTC 기준')).toBeTruthy();
  expect(view.getByText('여행 시간대가 갱신되었습니다. 닫고 다시 열어 날짜를 수정해주세요.')).toBeTruthy();
});

it('여행의 시작일만 바꾸면 종료일의 원래 offset·초·밀리초는 전송하지 않는다', async () => {
  const trip: TripData = {
    ...tripMetadata,
    id: 'trip',
    cityId: city.id,
    name: 'Tokyo 여행',
    destination: 'Tokyo',
    country: 'Japan',
    latitude: '35.68',
    longitude: '139.69',
    timeZone: 'Asia/Tokyo',
    startDate: '2026-10-01T00:00:12.345+09:00',
    endDate: '2026-10-03T00:00:45.678+09:00',
  };
  const view = open(<EditTripDrawer isOpen onClose={jest.fn()} trip={trip} />);
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(mockUpdate.mock.calls[0][0]).toEqual({ id: 'trip', data: {} });
  fireEvent.press(view.getByText('2026. 10. 1.'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(mockUpdate.mock.calls[1][0]).toEqual({ id: 'trip', data: { startDate: '2026-10-02T15:00:00.000Z' } });
});

it.each(['offline', 'unknown'] as const)(
  '실제 online·화면 %s에서는 시간대를 조회하되 생성 버튼은 표시 정책을 따른다',
  async (overrideStatus) => {
    useNetworkStore.setState({ overrideStatus });
    jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
    const view = open(<TripDateForm city={city} />);
    await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
    expect(resolveCityTimeZone).toHaveBeenCalledTimes(1);
    expect(view.getByText('여행 생성')).toBeDisabled();
    expect(
      view.getByText(
        overrideStatus === 'offline' ? '여행을 만들려면 인터넷 연결이 필요해요' : '인터넷 연결을 확인할 수 없어요.',
      ),
    ).toBeTruthy();
  },
);

it('unknown 확인 중·확인 불가·수동 복구를 거쳐도 날짜 초안을 유지한다', async () => {
  useNetworkStore.setState({ realStatus: 'unknown', checkStatus: 'checking' });
  jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
  const view = open(<TripDateForm city={city} />);
  fireEvent.press(view.getByText('시작일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-01'));
  fireEvent.press(view.getByText('종료일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  expect(view.queryByText('도시 시간대를 확인하고 있어요.')).toBeNull();
  expect(resolveCityTimeZone).not.toHaveBeenCalled();

  act(() => useNetworkStore.setState({ checkStatus: 'unavailable' }));
  expect(view.getByText('인터넷 연결을 확인할 수 없어요.')).toBeTruthy();
  let finishRefresh!: (state: NetInfoState) => void;
  jest.mocked(NetInfo.refresh).mockReturnValueOnce(
    new Promise((resolve) => {
      finishRefresh = resolve;
    }),
  );
  fireEvent.press(view.getByText('다시 확인'));
  expect(NetInfo.refresh).toHaveBeenCalledTimes(1);
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  await act(async () => finishRefresh({ isConnected: true, isInternetReachable: true } as NetInfoState));
  await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(view.getByText('2026-10-03')).toBeTruthy();
  expect(view.getByText('여행 생성')).not.toBeDisabled();
  expect(mockCreate).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('여행 생성')));
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ timeZone: 'Asia/Tokyo' }), expect.anything());
});

it('offline에서 시작한 시간대 조회는 대기 안내를 표시하고 online 복구 후 실행한다', async () => {
  useNetworkStore.setState({ realStatus: 'offline' });
  jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
  const view = open(<TripDateForm city={city} />);
  expect(view.queryByText('도시 시간대를 확인하고 있어요.')).toBeNull();
  expect(view.getByText('도시 시간대 확인에는 인터넷 연결이 필요해요. 입력한 날짜는 유지됩니다.')).toBeTruthy();
  expect(resolveCityTimeZone).not.toHaveBeenCalled();
  act(() => useNetworkStore.setState({ realStatus: 'online' }));
  await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
  expect(resolveCityTimeZone).toHaveBeenCalledTimes(1);
});

it.each([
  { isActivated: true, restriction: 'offline' },
  { isActivated: false, restriction: 'offline' },
  { isActivated: true, restriction: 'reauth-required' },
  { isActivated: false, restriction: 'reauth-required' },
] as const)(
  '시간대 확인 뒤 $restriction 전환 시 활성=$isActivated인 여행의 적용 권한을 따른다',
  async ({ isActivated, restriction }) => {
    jest
      .mocked(useGetTripActivation)
      .mockReturnValue({ data: { isActivated } } as ReturnType<typeof useGetTripActivation>);
    jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
    const trip: TripData = {
      ...tripMetadata,
      id: 'legacy-trip',
      cityId: city.id,
      name: 'Tokyo 여행',
      destination: 'Tokyo',
      country: 'Japan',
      latitude: '35.68',
      longitude: '139.69',
      timeZone: null,
      startDate: '2026-10-01T00:00:12.345+09:00',
      endDate: '2026-10-03T00:00:45.678+09:00',
    };
    const view = open(<EditTripDrawer isOpen onClose={jest.fn()} trip={trip} />);
    fireEvent.press(view.getByText('도시 시간대 확인'));
    await waitFor(() => expect(view.getByText('확인한 도시 시간대: Asia/Tokyo')).toBeTruthy());
    act(() => {
      if (restriction === 'offline') useNetworkStore.setState({ realStatus: 'offline' });
      else useAuthStore.setState({ status: 'reauth-required' });
    });
    if (isActivated) expect(view.getByText('시간대 적용')).not.toBeDisabled();
    else expect(view.getByText('시간대 적용')).toBeDisabled();
    await act(async () => fireEvent.press(view.getByText('시간대 적용')));
    if (isActivated) {
      expect(mockUpdate).toHaveBeenCalledWith({ id: trip.id, data: { timeZone: 'Asia/Tokyo' } }, expect.anything());
    } else {
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(
        view.getByText(
          restriction === 'offline'
            ? '오프라인에서는 활성화된 여행만 수정할 수 있어요.'
            : '다시 로그인한 뒤 사용할 수 있습니다',
        ),
      ).toBeTruthy();
    }
    expect(resolveCityTimeZone).toHaveBeenCalledTimes(1);
  },
);

it('비활성 여행은 연결이 끊겨도 날짜 편집을 유지하고 복구 후 같은 초안을 저장한다', async () => {
  const trip: TripData = {
    ...tripMetadata,
    id: 'trip',
    cityId: city.id,
    name: 'Tokyo 여행',
    destination: 'Tokyo',
    country: 'Japan',
    latitude: '35.68',
    longitude: '139.69',
    timeZone: 'Asia/Tokyo',
    startDate: '2026-10-01T00:00:12.345+09:00',
    endDate: '2026-10-03T00:00:45.678+09:00',
  };
  const view = open(<EditTripDrawer isOpen onClose={jest.fn()} trip={trip} />);
  act(() => useNetworkStore.setState({ realStatus: 'offline' }));
  fireEvent.press(view.getByText('2026. 10. 1.'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  expect(view.getByText('저장')).toBeDisabled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(mockUpdate).not.toHaveBeenCalled();
  act(() => useNetworkStore.setState({ realStatus: 'online' }));
  expect(mockUpdate).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  expect(mockUpdate).toHaveBeenCalledWith(
    { id: trip.id, data: { startDate: '2026-10-02T15:00:00.000Z' } },
    expect.anything(),
  );
});

it('최종 생성 실행이 거부되면 오류를 표시하고 날짜 초안을 보존한다', async () => {
  jest.mocked(resolveCityTimeZone).mockResolvedValue('Asia/Tokyo');
  const view = open(<TripDateForm city={city} />);
  await waitFor(() => expect(view.getByText('Tokyo 현지 시간 (Asia/Tokyo)')).toBeTruthy());
  fireEvent.press(view.getByText('시작일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-01'));
  fireEvent.press(view.getByText('종료일을 선택하세요'));
  fireEvent.press(view.getByText('선택 2026-10-03'));
  await act(async () => fireEvent.press(view.getByText('여행 생성')));
  mockCreateError = new OfflineError('네트워크 화면 테스트 중에는 저장·삭제할 수 없어요. 강제 설정을 해제해주세요.');
  // Mutation 오류 통지만 대역이며 폼·정책·Store는 실제 모듈이다.
  act(() => useNetworkStore.setState({ checkStatus: 'checking' }));
  expect(view.getByText(mockCreateError.message)).toBeTruthy();
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(view.getByText('2026-10-03')).toBeTruthy();
});
