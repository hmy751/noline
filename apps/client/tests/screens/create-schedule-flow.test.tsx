import React from 'react';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateScheduleScreen from '@/screens/CreateScheduleScreen';
import { useAuthStore } from '@/shared/store/auth';
import { useNetworkStore } from '@/shared/store/network';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: 'trip', date: '2026-10-01' }),
  router: { canGoBack: () => true, back: () => mockExit(), replace: () => mockExit() },
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
jest.mock('expo-blur', () => ({ BlurView: jest.requireActual<typeof import('react-native')>('react-native').View }));
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    MobileHeader: ({ title, onLeftPress }: { title: string; onLeftPress: () => void }) =>
      ReactRuntime.createElement(
        Pressable,
        { onPress: onLeftPress, accessibilityLabel: '뒤로 가기' },
        ReactRuntime.createElement(Text, null, title),
      ),
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
  return { Field: Object.assign(View, { Title: Text, ElementsBox: View, Message: Text }) };
});
jest.mock('@repo/ui', () => jest.requireActual('../../../../packages/ui/src/components/Pressable'));
jest.mock('@/entities/trip', () => ({
  useGetTrips: () => ({ data: [{ id: 'trip', destination: 'Paris', timeZone: 'Europe/Paris' }], isLoading: false }),
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({
  useGetTripActivation: () => ({ data: mockActive ? { isActivated: true } : null }),
}));
jest.mock('@/shared/services/offline-prep/metadata', () => ({ getTripActivationStatus: async () => mockActive }));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: {
    create: (data: unknown) =>
      jest
        .requireActual<typeof import('@/shared/services/offline-prep/router')>('@/shared/services/offline-prep/router')
        .routeChildMutation('trip', { local: () => mockLocal(data), remote: () => mockRemote(data) }),
  },
}));
jest.mock('@/entities/schedule', () => ({
  useCreateSchedule: jest.requireActual<typeof import('@/entities/schedule/data/useCreateSchedule')>(
    '@/entities/schedule/data/useCreateSchedule',
  ).useCreateSchedule,
  useGetSchedules: () => ({ isSuccess: true, data: [], refetch: jest.fn() }),
}));
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: jest.fn() }) }));
jest.mock('@/shared/services/id/ulid', () => ({ generateId: () => 'new-schedule' }));
jest.mock('@/shared/api/axios-instances', () => ({
  authAxios: { post: (...args: unknown[]) => mockSearch(...args), get: () => mockPlaceDetail() },
}));

let mockActive = true;
const mockExit = jest.fn();
const mockLocal = jest.fn<(data: unknown) => Promise<unknown>>();
const mockRemote = jest.fn<(data: unknown) => Promise<unknown>>();
const mockSearch = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockPlaceDetail = jest.fn<() => Promise<unknown>>();
const clients: QueryClient[] = [];

beforeEach(() => {
  jest.useFakeTimers();
  mockActive = true;
  useAuthStore.setState({ status: 'signed-in', userId: 'user' });
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  mockLocal.mockImplementation(async (data) => data);
  mockRemote.mockImplementation(async (data) => data);
  mockSearch.mockResolvedValue({
    data: {
      success: true,
      data: {
        results: [{ id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris' }],
        searchContext: { query: 'tower', cityName: null, coordinates: null, language: 'en' },
      },
    },
  });
  mockPlaceDetail.mockResolvedValue({
    data: { id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris', latitude: 48.858, longitude: 2.294 },
  });
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  jest.clearAllTimers();
  jest.useRealTimers();
});
function connect(realStatus: 'online' | 'offline' | 'unknown') {
  act(() => useNetworkStore.setState({ realStatus, checkStatus: realStatus === 'unknown' ? 'checking' : 'idle' }));
}
function open() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <CreateScheduleScreen />
    </QueryClientProvider>,
  );
}
async function searchPlace(view: ReturnType<typeof open>) {
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  await waitFor(() => expect(view.getByText('에펠탑')).toBeTruthy());
  fireEvent.press(view.getByText('에펠탑'));
}

it('오프라인 직접 작성 후 온라인 복귀에도 입력과 단일 폼을 유지하고 검색으로 이동하지 않는다', async () => {
  connect('offline');
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '작성 중 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '직접 적은 장소');
  fireEvent.changeText(view.getByLabelText('장소 주소'), '직접 적은 주소');
  connect('online');
  expect(view.getByDisplayValue('작성 중 제목')).toBeTruthy();
  expect(view.getByDisplayValue('직접 적은 장소')).toBeTruthy();
  expect(view.getByDisplayValue('직접 적은 주소')).toBeTruthy();
  expect(view.queryByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)')).toBeNull();
  expect(view.getAllByText('저장')).toHaveLength(1);
  expect(mockSearch).not.toHaveBeenCalled();
  expect(mockLocal).not.toHaveBeenCalled();
});

it('장소 선택 후 단절되어도 같은 폼과 장소를 유지하고 활성 Local로 저장한다', async () => {
  const view = open();
  await searchPlace(view);
  fireEvent.changeText(view.getByLabelText('일정 제목'), '수정한 제목');
  connect('offline');
  expect(view.getByDisplayValue('수정한 제목')).toBeTruthy();
  expect(view.getByText('에펠탑')).toBeTruthy();
  expect(view.queryByLabelText('장소 이름')).toBeNull();
  expect(view.getAllByText('저장')).toHaveLength(1);
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(mockLocal).toHaveBeenCalledWith(
      expect.objectContaining({ title: '수정한 제목', latitude: 48.858, longitude: 2.294 }),
    ),
  );
  expect(mockRemote).not.toHaveBeenCalled();
});

it('이미 시작한 비활성 여행의 폼은 unknown에도 편집되고 저장만 Router가 거부한다', async () => {
  mockActive = false;
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '연결 전 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '직접 장소');
  connect('unknown');
  fireEvent.changeText(view.getByLabelText('일정 제목'), '연결 확인 중에도 수정');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy());
  expect(view.getByDisplayValue('연결 확인 중에도 수정')).toBeTruthy();
  expect(mockRemote).not.toHaveBeenCalled();
  expect(mockLocal).not.toHaveBeenCalled();
  expect(mockExit).not.toHaveBeenCalled();
  connect('online');
  expect(view.getByDisplayValue('연결 확인 중에도 수정')).toBeTruthy();
  expect(mockRemote).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(mockExit).toHaveBeenCalledTimes(1));
  expect(mockRemote).toHaveBeenCalledWith(
    expect.objectContaining({ title: '연결 확인 중에도 수정', location: '직접 장소' }),
  );
  expect(mockLocal).not.toHaveBeenCalled();
});

it('비활성 여행의 직접 경로 진입도 검색 먼저이며 직접 입력할 수 있지만 저장은 차단한다', async () => {
  mockActive = false;
  connect('offline');
  const view = open();
  expect(view.queryByLabelText('일정 제목')).toBeNull();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '새 초안');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '새 장소');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText(/오프라인에서는 활성 여행|다시 로그인한 뒤/)).toBeTruthy());
  expect(view.getByDisplayValue('새 초안')).toBeTruthy();
  expect(mockLocal).not.toHaveBeenCalled();
  expect(mockRemote).not.toHaveBeenCalled();
});

it('직접 작성 후 명시적 검색·뒤로가기·장소 선택에서도 제목을 덮거나 날짜를 잃지 않는다', async () => {
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '내가 작성한 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '기존 장소');
  fireEvent.press(view.getByText('장소 검색'));
  fireEvent.press(view.getByLabelText('뒤로 가기'));
  expect(view.getByDisplayValue('기존 장소')).toBeTruthy();
  fireEvent.press(view.getByText('장소 검색'));
  await searchPlace(view);
  expect(view.getByDisplayValue('내가 작성한 제목')).toBeTruthy();
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(mockExit).not.toHaveBeenCalled();
});

it('검색어 입력 후 debounce 중 연결이 끊기면 새 검색 요청을 시작하지 않는다', async () => {
  const view = open();
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  connect('offline');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(600);
  });
  expect(mockSearch).not.toHaveBeenCalled();
  expect(view.getByText('오프라인에서는 장소를 검색할 수 없어요. 직접 입력할 수 있습니다.')).toBeTruthy();
  fireEvent.press(view.getByText('장소 직접 입력'));
  expect(view.getByLabelText('일정 제목')).toBeTruthy();
});

it('비활성 여행 작성 도중 재인증이 필요해져도 폼은 편집하고 저장은 거부한다', async () => {
  mockActive = false;
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('장소 이름'), '직접 적은 장소');
  act(() => useAuthStore.setState({ status: 'reauth-required' }));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '인증 만료 후 수정');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText(/오프라인에서는 활성 여행|다시 로그인한 뒤/)).toBeTruthy());
  expect(view.getByDisplayValue('인증 만료 후 수정')).toBeTruthy();
  expect(view.getAllByText('저장')).toHaveLength(1);
  expect(mockLocal).not.toHaveBeenCalled();
  expect(mockRemote).not.toHaveBeenCalled();
  expect(mockExit).not.toHaveBeenCalled();
});

it('검색 중 단절은 검색 선택만 제한하고 지도에 전달한 위치와 작성 복귀 행동은 유지한다', async () => {
  const view = open();
  await searchPlace(view);
  fireEvent.changeText(view.getByLabelText('일정 제목'), '보존할 초안');
  fireEvent.press(view.getByText('장소 변경'));
  const before = view.getByTestId('map-region').props.children;
  expect(JSON.parse(before).locations).toHaveLength(1);
  connect('offline');
  expect(view.getByTestId('map-region').props.children).toBe(before);
  expect(view.queryByText('검색 결과')).toBeNull();
  expect(view.getAllByText('작성 중인 일정으로 돌아가기')).toHaveLength(1);
  fireEvent.press(view.getByText('작성 중인 일정으로 돌아가기'));
  expect(view.getByDisplayValue('보존할 초안')).toBeTruthy();
});

it('장소 영역은 unknown의 확인 중·확인 불가와 offline 이유를 구별하며 초안을 유지한다', () => {
  connect('offline');
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '유지할 제목');
  connect('unknown');
  expect(view.getByText(/연결을 확인하는 동안 장소 검색/)).toBeTruthy();
  act(() => useNetworkStore.setState({ checkStatus: 'unavailable' }));
  expect(view.getByText(/연결을 확인할 수 없어/)).toBeTruthy();
  connect('offline');
  expect(view.getByText(/오프라인에서는 장소를 검색할 수 없어요/)).toBeTruthy();
  expect(view.getByDisplayValue('유지할 제목')).toBeTruthy();
  expect(view.getAllByText('저장')).toHaveLength(1);
});

it('검색 장소를 오프라인에서 직접 수정하면 초안은 유지하고 이전 좌표를 저장하지 않는다', async () => {
  const view = open();
  await searchPlace(view);
  fireEvent.changeText(view.getByLabelText('일정 제목'), '유지할 제목');
  connect('offline');
  fireEvent.press(view.getByText('장소 직접 수정'));
  expect(view.getByDisplayValue('유지할 제목')).toBeTruthy();
  expect(view.getByText('2026-10-01')).toBeTruthy();
  expect(view.getByLabelText('장소 이름').props.value).toBe('에펠탑');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '근처 카페');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(mockLocal).toHaveBeenCalled());
  expect(mockLocal).toHaveBeenCalledWith(
    expect.objectContaining({ location: '근처 카페', latitude: null, longitude: null }),
  );
  expect(mockRemote).not.toHaveBeenCalled();
});

it('강제 online이 실제 unknown에서 검색 요청을 열지 않는다', async () => {
  connect('unknown');
  act(() => useNetworkStore.setState({ overrideStatus: 'online' }));
  const view = open();
  expect(view.getByText(/연결을 확인하는 동안 장소 검색/)).toBeTruthy();
  expect(view.queryByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)')).toBeNull();
  fireEvent.press(view.getByText('장소 직접 입력'));
  expect(view.getByLabelText('일정 제목')).toBeTruthy();
  expect(mockSearch).not.toHaveBeenCalled();
});

it('검색 요청 이후 단절은 상세 요청을 막고 복구하면 같은 검색어를 다시 조회한다', async () => {
  let finish!: (value: unknown) => void;
  mockSearch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = open();
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  expect(mockSearch).toHaveBeenCalledTimes(1);
  connect('offline');
  await act(async () =>
    finish({
      data: {
        success: true,
        data: {
          results: [{ id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris' }],
          searchContext: { query: 'tower', cityName: null, coordinates: null, language: 'en' },
        },
      },
    }),
  );
  expect(mockPlaceDetail).not.toHaveBeenCalled();
  expect(view.queryByText('검색 결과')).toBeNull();
  expect(view.getByText('장소 직접 입력')).toBeTruthy();
  connect('online');
  await waitFor(() => expect(view.getByText('에펠탑')).toBeTruthy());
  expect(mockSearch).toHaveBeenCalledTimes(2);
  expect(mockPlaceDetail).toHaveBeenCalledTimes(1);
});

it('검색 실패가 직접 입력과 작성 흐름을 막지 않는다', async () => {
  mockSearch.mockRejectedValue(new Error('server unavailable'));
  const view = open();
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  await waitFor(() => expect(view.getByText('다시 검색')).toBeTruthy());
  fireEvent.press(view.getByText('장소 직접 입력'));
  expect(view.getByLabelText('일정 제목')).toBeTruthy();
});

it('비활성 여행의 서버 저장 실패는 입력을 유지하고 명시적 재시도 성공 뒤에만 종료한다', async () => {
  mockActive = false;
  mockRemote.mockRejectedValueOnce(new Error('server unavailable'));
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '보존할 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '장소');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText(/일정을 저장하지 못했어요/)).toBeTruthy());
  expect(view.getByDisplayValue('보존할 제목')).toBeTruthy();
  expect(mockExit).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(mockExit).toHaveBeenCalledTimes(1));
  expect(mockRemote).toHaveBeenCalledTimes(2);
});

it('저장 요청이 진행 중이면 중복 제출과 화면 이탈을 막고 완료 뒤 한 번 종료한다', async () => {
  let finish!: (value: unknown) => void;
  mockLocal.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '저장할 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '저장할 장소');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText('저장 중...')).toBeTruthy());
  fireEvent.press(view.getByText('저장 중...'));
  fireEvent.press(view.getByText('취소'));
  fireEvent.press(view.getByLabelText('뒤로 가기'));
  fireEvent.press(view.getByText('장소 검색'));
  expect(mockLocal).toHaveBeenCalledTimes(1);
  expect(mockExit).not.toHaveBeenCalled();
  expect(view.queryByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)')).toBeNull();
  expect(view.getByDisplayValue('저장할 제목')).toBeTruthy();
  await act(async () => finish(mockLocal.mock.calls[0][0]));
  await waitFor(() => expect(mockExit).toHaveBeenCalledTimes(1));
  expect(mockRemote).not.toHaveBeenCalled();
});

it('상세 조회가 실패한 결과는 새 일정에서 좌표가 있는 장소로 선택하지 못한다', async () => {
  mockPlaceDetail.mockRejectedValueOnce(new Error('details unavailable'));
  const view = open();
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  await waitFor(() => expect(view.getByText('다시 검색')).toBeTruthy());
  expect(view.queryByText('에펠탑')).toBeNull();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '직접 작성');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '장소');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(mockLocal).toHaveBeenCalledWith(expect.objectContaining({ latitude: null, longitude: null })),
  );
});

it('정상 상세 결과의 위도 0은 실패 대체값으로 취급하지 않는다', async () => {
  mockPlaceDetail.mockResolvedValueOnce({
    data: { id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris', latitude: 0, longitude: 2.294 },
  });
  const view = open();
  await searchPlace(view);
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() =>
    expect(mockLocal).toHaveBeenCalledWith(expect.objectContaining({ latitude: 0, longitude: 2.294 })),
  );
});

it('이전 저장 오류가 현재 정책 제한을 덮지 않고 복구 뒤에는 지난 실패임을 표시한다', async () => {
  mockActive = false;
  mockRemote.mockRejectedValueOnce(new Error('server unavailable'));
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '장소');
  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(view.getByText(/마지막 저장 실패/)).toBeTruthy());
  connect('unknown');
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  expect(view.queryByText(/마지막 저장 실패/)).toBeNull();
  connect('online');
  expect(view.getByText(/마지막 저장 실패/)).toBeTruthy();
  expect(mockRemote).toHaveBeenCalledTimes(1);
});

it('장소 변경 검색은 후보를 지도에 표시하고 비운 뒤에는 채택 장소를 표시하며 초안을 유지한다', async () => {
  const view = open();
  await searchPlace(view);
  fireEvent.changeText(view.getByLabelText('일정 제목'), '채택 후 편집한 제목');
  fireEvent.press(view.getByText('장소 변경'));
  const candidatesMap = JSON.parse(view.getByTestId('map-region').props.children);
  expect(candidatesMap.locations).toHaveLength(1);
  expect(candidatesMap.selectedLocation).toBeNull();
  expect(view.getByDisplayValue('tower')).toBeTruthy();
  expect(mockSearch).toHaveBeenCalledTimes(1); // 같은 query의 정상 캐시를 재사용한다.
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), '');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  const adoptedMap = JSON.parse(view.getByTestId('map-region').props.children);
  expect(adoptedMap.locations).toEqual([]);
  expect(adoptedMap.selectedLocation).toEqual(expect.objectContaining({ id: 'tower', latitude: 48.858 }));
  fireEvent.press(view.getByText('작성 중인 일정으로 돌아가기'));
  expect(view.getByDisplayValue('채택 후 편집한 제목')).toBeTruthy();
  expect(view.getByText('에펠탑')).toBeTruthy();
  expect(view.getByText('2026-10-01')).toBeTruthy();
});

it('다른 검색어의 응답을 기다리는 동안 이전 위치는 지도에 남아도 새 선택 후보가 되지 않는다', async () => {
  const view = open();
  await searchPlace(view);
  fireEvent.press(view.getByText('장소 변경'));
  let finish!: (value: unknown) => void;
  mockSearch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'cafe');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  expect(JSON.parse(view.getByTestId('map-region').props.children).locations).toHaveLength(1);
  expect(view.queryByText('에펠탑')).toBeNull();
  fireEvent.press(view.getByText('작성 중인 일정으로 돌아가기'));
  expect(view.getByText('에펠탑')).toBeTruthy();
  await act(async () =>
    finish({
      data: {
        success: true,
        data: { results: [], searchContext: { query: 'cafe', cityName: null, coordinates: null, language: 'en' } },
      },
    }),
  );
  expect(view.getByText('에펠탑')).toBeTruthy();
});

it('잘못된 상세 좌표는 생성의 오류 UI로 연결되며 draft와 직접 입력을 유지한다', async () => {
  const view = open();
  fireEvent.press(view.getByText('장소 직접 입력'));
  fireEvent.changeText(view.getByLabelText('일정 제목'), '그대로 둘 제목');
  fireEvent.changeText(view.getByLabelText('장소 이름'), '그대로 둘 장소');
  fireEvent.press(view.getByText('장소 검색'));
  mockPlaceDetail.mockResolvedValueOnce({
    data: { id: 'tower', placeId: 'tower', name: '에펠탑', address: 'Paris', latitude: 100, longitude: 2 },
  });
  fireEvent.changeText(view.getByPlaceholderText('장소를 검색해주세요 (예: 에펠탑)'), 'tower');
  await act(async () => {
    await jest.advanceTimersByTimeAsync(500);
  });
  await waitFor(() => expect(view.getByText('다시 검색')).toBeTruthy());
  fireEvent.press(view.getByText('작성 중인 일정으로 돌아가기'));
  expect(view.getByDisplayValue('그대로 둘 제목')).toBeTruthy();
  expect(view.getByDisplayValue('그대로 둘 장소')).toBeTruthy();
  expect(mockLocal).not.toHaveBeenCalled();
});
