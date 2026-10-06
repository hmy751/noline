import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule/UpdateScheduleDrawer';
import { LocationSearchModal } from '@/features/schedule/update-schedule/LocationSearchModal';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('expo-blur', () => ({ BlurView: jest.requireActual<typeof import('react-native')>('react-native').View }));
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ...(jest.requireActual('../../../../packages/ui/src/components/Pressable') as object),
    Drawer: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? ReactRuntime.createElement(View, null, children) : null,
  };
});
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    DatePicker: () => null,
    TimePicker: () => null,
    PolicyBasedMapView: ({ locations, selectedLocation }: { locations: unknown[]; selectedLocation: unknown }) =>
      ReactRuntime.createElement(Text, { testID: 'map-region' }, JSON.stringify({ locations, selectedLocation })),
    PolicyErrorDisplay: jest.requireActual<typeof import('@/shared/components/ErrorBoundary/PolicyErrorDisplay')>(
      '@/shared/components/ErrorBoundary/PolicyErrorDisplay',
    ).PolicyErrorDisplay,
  };
});
jest.mock('@/shared/components/Form', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }),
    TimeField: jest.requireActual<typeof import('@/shared/components/Form/TimeField')>(
      '@/shared/components/Form/TimeField',
    ).TimeField,
  };
});
jest.mock('@/shared/components/Form/Field', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@/shared/components/TimePicker/TimePicker', () => ({
  __esModule: true,
  default: jest.requireMock<typeof import('@/shared/components')>('@/shared/components').TimePicker,
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: () => ({ data: { isActivated: true } }),
}));
jest.mock('@/entities/schedule', () => ({ useUpdateSchedule: () => ({ mutate: mockSave, isPending: false }) }));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: jest.fn() }) }));
jest.mock('@/features/schedule/read-schedules', () => ({
  useTripSchedulesReadQuery: () => ({ query: { data: [] } }),
}));
jest.mock('@/shared/api/axios-instances', () => ({
  authAxios: { post: () => mockSearch(), get: () => mockDetail() },
}));
const mockSave = jest.fn();
const mockSearch = jest.fn<() => Promise<unknown>>();
const mockDetail = jest.fn<() => Promise<unknown>>();
const candidate = { id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris' };
const detail = { ...candidate, latitude: 0, longitude: 2.294 };
const clients: QueryClient[] = [];
beforeEach(() => {
  jest.useFakeTimers();
  useAuthStore.setState({ status: 'signed-in', userId: 'user' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  mockSearch.mockResolvedValue({
    data: {
      success: true,
      data: {
        results: [candidate],
        searchContext: { query: 'tower', cityName: null, coordinates: null, language: 'en' },
      },
    },
  });
  mockDetail.mockResolvedValue({ data: detail });
});
afterEach(() => {
  cleanup();
  clients.forEach((queryClient) => queryClient.clear());
  clients.length = 0;
  jest.clearAllTimers();
  jest.useRealTimers();
});
function client() {
  const instance = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(instance);
  return instance;
}
function openDrawer(instance = client()) {
  const view = render(
    <QueryClientProvider client={instance}>
      <UpdateScheduleDrawer
        isOpen
        onClose={jest.fn()}
        scheduleData={{
          id: 'schedule',
          tripId: 'trip',
          title: '기존 제목',
          date: '2026-10-01',
          time: '09:00',
          location: '기존 장소',
        }}
      />
    </QueryClientProvider>,
  );
  fireEvent.press(view.getByText('검색'));
  return view;
}
async function search(view: ReturnType<typeof render>) {
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  await waitFor(() => expect(view.getByText('에펠탑')).toBeTruthy());
}

it('수정 화면은 검증된 상세 좌표 0을 그대로 선택하고 수정 payload에 연결한다', async () => {
  const view = openDrawer();
  await search(view);
  fireEvent.press(view.getByText('에펠탑'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'schedule',
        data: expect.objectContaining({ title: '기존 제목', location: '에펠탑', latitude: 0, longitude: 2.294 }),
      }),
      expect.any(Object),
    ),
  );
});

it('수정의 상세 실패는 생성 캐시와 분리되고 명시적인 legacy 선택을 거쳐 기존 0/0 저장을 유지한다', async () => {
  const instance = client();
  instance.setQueryData(['places', 'search', 'tower', undefined, 'resolved'], [detail]);
  mockDetail.mockRejectedValue(new Error('detail unavailable'));
  const view = openDrawer(instance);
  await search(view);
  expect(JSON.parse(view.getByTestId('map-region').props.children).locations).toEqual([
    { source: 'legacy-unresolved-detail', id: 'tower', name: '에펠탑', address: 'Paris', latitude: 0, longitude: 0 },
  ]);
  expect(mockSearch).toHaveBeenCalledTimes(1);
  fireEvent.press(view.getByText('에펠탑'));
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ location: '에펠탑', latitude: 0, longitude: 0 }),
      }),
      expect.any(Object),
    ),
  );
});

it('수정 검색에서 단절되면 위치 표시는 유지하면서 선택을 막고 같은 캐시로 복구한다', async () => {
  const view = openDrawer();
  await search(view);
  const mapBefore = view.getByTestId('map-region').props.children;
  act(() => useNetworkStore.setState({ realStatus: 'offline' }));
  expect(view.getByTestId('map-region').props.children).toBe(mapBefore);
  expect(view.queryByText('검색 결과')).toBeNull();
  expect(view.queryByText('에펠탑')).toBeNull();
  act(() => useNetworkStore.setState({ realStatus: 'online' }));
  await waitFor(() => expect(view.getByText('에펠탑')).toBeTruthy());
  expect(mockSearch).toHaveBeenCalledTimes(1);
  expect(mockSave).not.toHaveBeenCalled();
});

it('닫힌 채 장착된 수정 검색은 debounce 요청을 멈추고 재개 시 입력을 유지한다', async () => {
  const instance = client();
  const onSelectLocation = jest.fn();
  const contents = (isOpen: boolean) => (
    <QueryClientProvider client={instance}>
      <LocationSearchModal isOpen={isOpen} onClose={jest.fn()} onSelectLocation={onSelectLocation} tripId='trip' />
    </QueryClientProvider>
  );
  const view = render(contents(true));
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  view.rerender(contents(false));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  expect(mockSearch).not.toHaveBeenCalled();
  view.rerender(contents(true));
  expect(view.getByDisplayValue('tower')).toBeTruthy();
  await waitFor(() => expect(view.getByText('에펠탑')).toBeTruthy());
  expect(onSelectLocation).not.toHaveBeenCalled();
});
