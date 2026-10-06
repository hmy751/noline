import React from 'react';
import { Alert } from 'react-native';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import ScheduleScreen from '@/screens/ScheduleScreen';
import { useNetworkStore } from '@/shared/store/network';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleRepository } from '@/entities/schedule/repository/schedule-repository';
import { pullChanges } from '@/shared/services/sync/engine';
import { useGetSchedules } from '@/entities/schedule/data/useGetSchedules';
import { scheduleQueryKeys } from '@/entities/schedule/data/keys';
import { useAuthStore } from '@/shared/store/auth';
import { useTripStore } from '@/shared/store/useTripStore';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { UpdateScheduleDrawer } from '@/features/schedule/update-schedule';

jest.mock('@/shared/services/sync/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({
      data: { success: true, data: { trips: [], schedules: [], expenses: [], serverTime: '2026-09-28T00:00:00Z' } },
    })),
  },
}));
jest.mock('@/shared/services/sync/queue', () => ({}));
jest.mock('@/shared/services/sync/storage', () => ({ getLastSyncedAt: async () => null, setLastSyncedAt: jest.fn() }));
jest.mock('@/shared/services/sync/cleanup-job', () => ({}));
jest.mock('@/shared/db/utils', () => ({}));
jest.mock('@/shared/db', () => ({
  tripActivations: { isActivated: 'active', userId: 'user', tripId: 'trip' },
  getDatabase: () => ({ select: () => ({ from: () => ({ where: async () => [{ tripId: 'local' }] }) }) }),
}));
jest.mock('@/shared/lib/queryClient', () => ({
  get queryClient() {
    return mockClient;
  },
}));

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => jest.fn()), refresh: jest.fn() },
}));
jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));
jest.mock('@/shared/store', () => jest.requireActual('@/shared/store/useTripStore'));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ tripId: 'trip', id: 'expense' }),
}));
jest.mock('lucide-react-native', () => ({
  Map: () => null,
  List: () => null,
  MapPin: () => null,
  Tag: () => null,
  Calendar: () => null,
  Clock: () => null,
  Edit2: () => null,
  Trash2: () => null,
  Receipt: () => null,
  ChevronLeft: () => null,
  AlertCircle: () => null,
  WifiOff: () => null,
  Wifi: () => null,
  Lock: () => null,
}));
jest.mock('@repo/ui', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  const surface = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? ReactRuntime.createElement(View, null, children) : null;
  return {
    ...jest.requireActual<Pick<typeof import('@repo/ui'), 'Pressable'>>(
      '../../../../packages/ui/src/components/Pressable',
    ),
    ...jest.requireActual<Pick<typeof import('@repo/ui'), 'cn'>>('../../../../packages/ui/src/lib/utils'),
    // 네이티브 표시만 대체한다. Screen·Menu·Drawer·react-hook-form은 실제 구현이다.
    Drawer: surface,
    DropdownMenu: surface,
    DropdownMenuItem: ({ label, onPress }: { label: string; onPress: () => void }) =>
      ReactRuntime.createElement(Pressable, { onPress }, ReactRuntime.createElement(Text, null, label)),
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
jest.mock('@/entities/route', () => ({ useAutoDownloadRoutes: () => ({ mutate: jest.fn() }) }));
jest.mock('@/features/schedule/update-schedule/LocationSearchModal', () => ({ LocationSearchModal: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/shared/components', () => {
  const ReactRuntime = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Container: View,
    Stack: View,
    DatePicker: ({ onSelectDate }: { onSelectDate: (date: string) => void }) =>
      ReactRuntime.createElement(
        Pressable,
        { onPress: () => onSelectDate('2026-09-22') },
        ReactRuntime.createElement(Text, null, '작성 날짜 선택'),
      ),
    TimePicker: ({ onSelectTime }: { onSelectTime: (time: string) => void }) =>
      ReactRuntime.createElement(
        Pressable,
        { onPress: () => onSelectTime('15:30') },
        ReactRuntime.createElement(Text, null, '작성 시간 선택'),
      ),
    PolicyErrorDisplay: jest.requireActual<typeof import('@/shared/components/ErrorBoundary/PolicyErrorDisplay')>(
      '@/shared/components/ErrorBoundary/PolicyErrorDisplay',
    ).PolicyErrorDisplay,
    MobileHeader: jest.requireActual<typeof import('@/shared/components/Navigation/MobileHeader')>(
      '@/shared/components/Navigation/MobileHeader',
    ).MobileHeader,
    ExpenseCard: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
    ScheduleCard: ({ title, onMenuPress }: { title: string; onMenuPress: (event: unknown) => void }) =>
      ReactRuntime.createElement(
        View,
        null,
        ReactRuntime.createElement(Text, null, title),
        ReactRuntime.createElement(
          Pressable,
          {
            accessibilityRole: 'button',
            accessibilityLabel: `${title} 메뉴`,
            onPress: () => onMenuPress({ currentTarget: { measure: () => undefined } }),
          },
          ReactRuntime.createElement(Text, null, '일정 메뉴'),
        ),
      ),
    MapScheduleCard: ({ title }: { title: string }) => ReactRuntime.createElement(Text, null, title),
    // 네이티브 지도만 대체한다. 날짜·일정 선택과 카드 조합은 실제 container를 사용한다.
    PolicyBasedScheduleMapView: ({
      schedules,
      selectedScheduleId,
      onMarkerPress,
    }: {
      schedules: { id: string; title: string }[];
      selectedScheduleId: string | null;
      onMarkerPress: (id: string) => void;
    }) =>
      ReactRuntime.createElement(
        View,
        null,
        ReactRuntime.createElement(Text, null, '일정 지도'),
        ...schedules.map((schedule) =>
          ReactRuntime.createElement(
            Pressable,
            {
              key: schedule.id,
              accessibilityRole: 'button',
              accessibilityLabel: `지도 ${schedule.title}`,
              accessibilityState: { selected: selectedScheduleId === schedule.id },
              onPress: () => onMarkerPress(schedule.id),
            },
            ReactRuntime.createElement(Text, null, `지도 ${schedule.title}`),
          ),
        ),
      ),
  };
});
jest.mock('@/entities/trip', () => ({
  TripSelector: () => null,
  useGetTrips: () => ({ data: mockTrips }),
}));
jest.mock('@/entities/schedule/repository/schedule-repository', () => ({
  ScheduleRepository: { getByTripId: jest.fn() },
}));
jest.mock('@/entities/schedule', () => ({
  scheduleQueryKeys: jest.requireActual<typeof import('@/entities/schedule/data/keys')>('@/entities/schedule/data/keys')
    .scheduleQueryKeys,
  useGetSchedules: jest.requireActual<typeof import('@/entities/schedule/data/useGetSchedules')>(
    '@/entities/schedule/data/useGetSchedules',
  ).useGetSchedules,
  useDeleteSchedule: () => ({ mutate: jest.fn() }),
  useUpdateSchedule: () => ({ mutate: mockSaveSchedule, isPending: false }),
}));
jest.mock('@/features/expense/expense-menu', () => ({ ExpenseMenu: () => null }));
jest.mock('@/features/expense/update-expense', () => ({ UpdateExpenseDrawer: () => null }));

type Schedules = Awaited<ReturnType<typeof ScheduleRepository.getByTripId>>;
const fetchSchedules = jest.mocked(ScheduleRepository.getByTripId);
const mockSaveSchedule = jest.fn();
const clients: QueryClient[] = [];
let mockClient: QueryClient;
let mockTrips: { id: string; startDate: string; endDate: string; baseCurrency: string; timeZone: string }[];

function rows(title: string, tripId = 'trip'): Schedules {
  return [{ id: 'schedule', tripId, title, scheduledAt: '2026-09-21T10:00:00Z' }] as Schedules;
}

function deferred() {
  let resolve!: (value: Schedules) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Schedules>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup(additionalTripId?: string, cachedSchedules: Schedules | null = rows('이전 일정'), stale = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, refetchOnReconnect: false } },
  });
  clients.push(client);
  mockClient = client;
  if (cachedSchedules)
    client.setQueryData(scheduleQueryKeys.list('trip'), cachedSchedules, {
      updatedAt: Date.now() - (stale ? 6 * 60 * 1000 : 0),
    });
  const view = render(
    <QueryClientProvider client={client}>
      <ScheduleScreen />
      {additionalTripId && <AdditionalScheduleObserver tripId={additionalTripId} />}
    </QueryClientProvider>,
  );
  return { ...view, client };
}

// 홈 화면·수정 Drawer처럼 같은 Query를 계속 구독하는 다른 소비자.
function AdditionalScheduleObserver({ tripId }: { tripId: string }) {
  useGetSchedules(tripId);
  return null;
}

function connect(realStatus: 'online' | 'offline' | 'unknown') {
  act(() => useNetworkStore.setState({ realStatus, checkStatus: realStatus === 'unknown' ? 'checking' : 'idle' }));
}

it('수정 폼의 일정 조회는 닫혀 있는 동안 무효화돼도 시작하지 않고 열 때 갱신한다', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  client.setQueryData(scheduleQueryKeys.list('trip'), rows('이전 일정'));
  fetchSchedules.mockResolvedValue(rows('갱신한 일정'));
  const scheduleData = {
    id: 'schedule',
    tripId: 'trip',
    title: '이전 일정',
    date: '2026-09-21',
    time: '10:00',
  };
  const form = (isOpen: boolean) => (
    <QueryClientProvider client={client}>
      <UpdateScheduleDrawer isOpen={isOpen} onClose={jest.fn()} scheduleData={scheduleData} />
    </QueryClientProvider>
  );
  const view = render(form(false));
  await act(async () => {
    await client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  expect(fetchSchedules).not.toHaveBeenCalled();

  view.rerender(form(true));
  await waitFor(() => expect(client.getQueryData(scheduleQueryKeys.list('trip'))).toEqual(rows('갱신한 일정')));
  expect(fetchSchedules).toHaveBeenCalledTimes(1);

  view.rerender(form(false));
  await act(async () => {
    await client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  expect(fetchSchedules).toHaveBeenCalledTimes(1);
});

it('화면에서 수정 중인 제목과 날짜는 연결 제한·복귀와 조회 실패·갱신 후에도 저장 전까지 유지한다', async () => {
  const prompt = jest.spyOn(Alert, 'prompt').mockImplementation(() => undefined);
  const view = setup();
  fireEvent.press(view.getByRole('button', { name: '이전 일정 메뉴' }));
  fireEvent.press(view.getByText('수정'));
  fireEvent.press(view.getAllByText('이전 일정')[1]);
  const buttons = prompt.mock.calls[0][2];
  if (!Array.isArray(buttons)) throw new Error('제목 변경 확인 버튼이 없습니다');
  act(() => buttons.find((button) => button.text === '확인')?.onPress?.('작성 중 제목'));
  fireEvent.press(view.getAllByText('2026-09-21')[1]);
  fireEvent.press(view.getByText('작성 날짜 선택'));

  connect('offline');
  expect(view.queryByText('저장')).toBeNull();
  expect(view.queryByText('작성 중 제목')).toBeNull();
  connect('online');
  expect(view.getByText('작성 중 제목')).toBeTruthy();

  fetchSchedules.mockRejectedValueOnce(new Error('server unavailable'));
  await act(async () => {
    await view.client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  await waitFor(() => expect(view.getByText('일정을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.')).toBeTruthy());
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  fetchSchedules.mockResolvedValueOnce(rows('서버에서 갱신된 제목'));
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  });
  await waitFor(() => expect(view.getByText('서버에서 갱신된 제목')).toBeTruthy());
  expect(view.getByText('작성 중 제목')).toBeTruthy();
  expect(mockSaveSchedule).not.toHaveBeenCalled();

  await act(async () => fireEvent.press(view.getByText('저장')));
  await waitFor(() => expect(mockSaveSchedule).toHaveBeenCalled());
  const request = mockSaveSchedule.mock.calls[0][0] as { data: { title: string; scheduledAt: string } };
  expect(request.data.title).toBe('작성 중 제목');
  const savedDate = new Date(request.data.scheduledAt);
  expect([savedDate.getUTCFullYear(), savedDate.getUTCMonth() + 1, savedDate.getUTCDate()]).toEqual([2026, 9, 22]);
});

beforeEach(() => {
  mockTrips = ['trip', 'other'].map((id) => ({
    id,
    startDate: '2026-09-21T00:00:00Z',
    endDate: '2026-09-23T00:00:00Z',
    baseCurrency: 'USD',
    timeZone: 'UTC',
  }));
  fetchSchedules.mockReset();
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null, checkStatus: 'idle' });
  useAuthStore.setState({ status: 'signed-in', userId: 'a', sessionId: Symbol('session') });
  useTripStore.setState({ selectedTripId: 'trip' });
  jest.mocked(useGetTripActivation).mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
});

afterEach(async () => {
  cleanup();
  for (const client of clients.splice(0)) {
    await client.cancelQueries();
    client.clear();
  }
  jest.restoreAllMocks();
});

it('online 복귀 시 유효한 기존 데이터를 바로 표시하고 추가 조회를 강제하지 않는다', () => {
  const view = setup();
  connect('offline');
  expect(view.queryByText('이전 일정')).toBeNull();
  connect('online');
  expect(view.getByText('이전 일정')).toBeTruthy();
  expect(fetchSchedules).not.toHaveBeenCalled();
});

it.each(['stale', 'invalidated'] as const)('%s 캐시는 바로 표시하면서 Query 기준으로 갱신한다', async (state) => {
  useNetworkStore.setState({ realStatus: 'offline' });
  const request = deferred();
  fetchSchedules.mockReturnValue(request.promise);
  const view = setup(undefined, rows('이전 일정'), state === 'stale');
  if (state === 'invalidated') {
    await act(async () => {
      await view.client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
    });
  }
  connect('online');
  expect(view.getByText('이전 일정')).toBeTruthy();
  await waitFor(() => expect(fetchSchedules).toHaveBeenCalled());
  await act(async () => request.resolve(rows('새 일정')));
  await waitFor(() => expect(view.getByText('새 일정')).toBeTruthy());
});

it('재조회 실패에도 내용을 유지하고 안내의 버튼으로 재시도한다', async () => {
  useNetworkStore.setState({ realStatus: 'offline' });
  fetchSchedules.mockRejectedValueOnce(new Error('server unavailable'));
  const view = setup(undefined, rows('이전 일정'), true);
  connect('online');
  await waitFor(() => expect(view.getByText('일정을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.')).toBeTruthy());
  expect(view.getByText('이전 일정')).toBeTruthy();
  const retry = deferred();
  fetchSchedules.mockReturnValueOnce(retry.promise);
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.queryByRole('button', { name: '다시 불러오기' })).toBeNull());
  expect(view.getByText('이전 일정')).toBeTruthy();
  await act(async () => retry.resolve(rows('재시도 일정')));
  await waitFor(() => expect(view.getByText('재시도 일정')).toBeTruthy());
});

it('다른 여행을 선택하면 이전 여행의 늦은 응답이 선택과 화면을 되돌리지 않는다', async () => {
  const request = deferred();
  fetchSchedules.mockImplementation((id) => (id === 'trip' ? request.promise : Promise.resolve([])));
  const view = setup(undefined, null);
  act(() => useTripStore.setState({ selectedTripId: 'other' }));
  await act(async () => request.resolve(rows('이전 여행의 늦은 일정')));
  await waitFor(() => expect(view.getAllByText('이 날의 일정을 추가해보세요')).toHaveLength(3));
  expect(view.queryByText('이전 여행의 늦은 일정')).toBeNull();
  expect(useTripStore.getState().selectedTripId).toBe('other');
});

it('조회 중 재단절되면 내용을 가리고 복귀 후 완료된 Query 데이터를 바로 표시한다', async () => {
  const request = deferred();
  fetchSchedules.mockReturnValueOnce(request.promise);
  const view = setup(undefined, null);
  connect('unknown');
  expect(view.getByText('인터넷 연결을 확인하고 있어요.')).toBeTruthy();
  await act(async () => request.resolve(rows('조회한 일정')));
  expect(view.queryByText('조회한 일정')).toBeNull();
  connect('online');
  expect(view.getByText('조회한 일정')).toBeTruthy();
  expect(fetchSchedules).toHaveBeenCalledTimes(1);
});

it.each([undefined, 'trip'])('pull 무효화는 진행 중 이전 GET를 대체한다 (추가 소비자: %s)', async (observer) => {
  const oldRequest = deferred();
  fetchSchedules.mockReturnValueOnce(oldRequest.promise).mockResolvedValue(rows('갱신한 일정'));
  const view = setup(observer, null);
  await act(async () => {
    await pullChanges();
  });
  await waitFor(() => expect(view.getByText('갱신한 일정')).toBeTruthy());
  await act(async () => oldRequest.resolve(rows('변경 이전 응답')));
  expect(view.queryByText('변경 이전 응답')).toBeNull();
  expect(view.client.getQueryData(scheduleQueryKeys.list('trip'))).toEqual(rows('갱신한 일정'));
});

it('활성 여행은 offline과 unknown에서도 내용을 유지하며 복귀만으로 재조회하지 않는다', () => {
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  const view = setup();
  connect('offline');
  expect(view.getByText('이전 일정')).toBeTruthy();
  connect('unknown');
  expect(view.getByText('이전 일정')).toBeTruthy();
  connect('online');
  expect(fetchSchedules).not.toHaveBeenCalled();
});

it('최초 unknown에서 online 확인 후 캐시와 지도 보기 선택을 바로 복구한다', () => {
  useNetworkStore.setState({ realStatus: 'unknown', checkStatus: 'checking' });
  const view = setup();
  fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
  connect('online');
  expect(view.getByText('일정 지도')).toBeTruthy();
  expect(view.getByRole('button', { name: '목록 보기로 전환' })).toBeTruthy();
  expect(fetchSchedules).not.toHaveBeenCalled();
});

it.each(['offline', 'unknown'] as const)(
  '강제 online은 실제 %s에서도 기존 캐시를 표시하되 조회하지 않는다',
  (realStatus) => {
    useNetworkStore.setState({ realStatus, overrideStatus: 'online' });
    const view = setup(undefined, rows('이전 일정'), true);
    expect(view.getByText('이전 일정')).toBeTruthy();
    expect(fetchSchedules).not.toHaveBeenCalled();
  },
);

it('강제 online에서 캐시도 실제 연결도 없으면 로딩 대신 실제 조회 제한을 안내한다', () => {
  useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: 'online', checkStatus: 'unavailable' });
  const view = setup(undefined, null);
  expect(view.getByText('인터넷 연결을 확인할 수 없어요.')).toBeTruthy();
  expect(view.getByRole('button', { name: '다시 확인' })).toBeTruthy();
  expect(view.queryByText('일정을 불러오고 있어요.')).toBeNull();
  expect(fetchSchedules).not.toHaveBeenCalled();
});

it('online 강제 표시가 유지돼도 실제 연결이 복구되면 오래된 캐시를 갱신한다', async () => {
  useNetworkStore.setState({ realStatus: 'offline', overrideStatus: 'online' });
  const request = deferred();
  fetchSchedules.mockReturnValueOnce(request.promise);
  const view = setup(undefined, rows('이전 일정'), true);
  expect(fetchSchedules).not.toHaveBeenCalled();
  connect('online');
  expect(view.getByText('이전 일정')).toBeTruthy();
  await waitFor(() => expect(fetchSchedules).toHaveBeenCalled());
  await act(async () => request.resolve(rows('새 일정')));
  await waitFor(() => expect(view.getByText('새 일정')).toBeTruthy());
});

it('실제 online에서도 강제 offline 표시는 내용을 제한하고 화면 조회를 시작하지 않는다', () => {
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'offline' });
  const view = setup(undefined, rows('이전 일정'), true);
  expect(view.queryByText('이전 일정')).toBeNull();
  expect(fetchSchedules).not.toHaveBeenCalled();
  expect(view.getByText('인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.')).toBeTruthy();
});

it('여행 미선택은 조회 대기나 정책 오류 대신 여행 선택 안내를 표시한다', () => {
  useTripStore.setState({ selectedTripId: null });
  const view = setup(undefined, null);
  expect(view.getByText('여행을 선택해주세요')).toBeTruthy();
  expect(view.queryByText('일정을 불러오고 있어요.')).toBeNull();
  expect(fetchSchedules).not.toHaveBeenCalled();
});

it('인증 제한은 늦은 응답으로 풀리지 않고 재인증 뒤 기존 내용을 표시한다', async () => {
  const request = deferred();
  fetchSchedules.mockReturnValueOnce(request.promise);
  const view = setup(undefined, null);
  act(() => useAuthStore.setState({ status: 'reauth-required', sessionId: Symbol('expired') }));
  // HTTP 계층의 세션 차단은 별도 interceptor 테스트에서 검증한다.
  await act(async () => request.reject(new Error('expired session')));
  expect(view.getByText('다시 로그인한 뒤 사용할 수 있습니다')).toBeTruthy();
  act(() => view.client.setQueryData(scheduleQueryKeys.list('trip'), rows('같은 계정의 일정')));
  expect(view.queryByText('같은 계정의 일정')).toBeNull();
  act(() => useAuthStore.setState({ status: 'signed-in', sessionId: Symbol('new-session') }));
  expect(view.getByText('같은 계정의 일정')).toBeTruthy();
});

it('활성 여행의 최초 Local 조회도 pull 반영 뒤 새로 읽는다', async () => {
  const oldLocalRead = deferred();
  fetchSchedules
    .mockImplementationOnce(() => oldLocalRead.promise)
    .mockResolvedValue(rows('pull 이후 로컬 일정', 'local'));
  useTripStore.setState({ selectedTripId: 'local' });
  jest
    .mocked(useGetTripActivation)
    .mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  const view = setup(undefined, null);
  await act(async () => {
    await pullChanges();
  });
  await waitFor(() =>
    expect(view.client.getQueryData(scheduleQueryKeys.list('local'))).toEqual(rows('pull 이후 로컬 일정', 'local')),
  );
  await act(async () => oldLocalRead.resolve(rows('pull 이전 로컬 일정', 'local')));
  expect(view.client.getQueryData(scheduleQueryKeys.list('local'))).toEqual(rows('pull 이후 로컬 일정', 'local'));
});

function mapRows(): Schedules {
  return [
    { ...rows('첫날 일정')[0], id: 'first', latitude: '37.5', longitude: '127.0' },
    {
      ...rows('일정 B')[0],
      id: 'b',
      scheduledAt: new Date(2026, 8, 23, 10).toISOString(),
      latitude: '37.6',
      longitude: '127.1',
    },
    {
      ...rows('일정 C')[0],
      id: 'c',
      scheduledAt: new Date(2026, 8, 23, 11).toISOString(),
      latitude: '37.7',
      longitude: '127.2',
    },
  ];
}

it('첫 조회 실패를 빈 일정으로 표시하지 않고 재시도 성공 후에만 빈 목록을 표시한다', async () => {
  const request = deferred();
  fetchSchedules.mockReturnValueOnce(request.promise);
  const view = setup(undefined, null);
  expect(view.getByText('일정을 불러오고 있어요.')).toBeTruthy();
  expect(view.queryAllByText('이 날의 일정을 추가해보세요')).toHaveLength(0);
  await act(async () => request.reject(new Error('server unavailable')));
  await waitFor(() => expect(view.getByText('일정을 불러오지 못했어요.')).toBeTruthy());
  expect(view.queryAllByText('이 날의 일정을 추가해보세요')).toHaveLength(0);
  fetchSchedules.mockResolvedValueOnce([]);
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.getAllByText('이 날의 일정을 추가해보세요')).toHaveLength(3));
  expect(view.queryByText('일정을 불러오지 못했어요.')).toBeNull();
});

it('지도에서 고른 날짜·일정은 단절과 복구 실패 후 재시도 성공까지 유지한다', async () => {
  const request = deferred();
  fetchSchedules.mockReturnValueOnce(request.promise);
  const view = setup(undefined, mapRows());
  fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
  fireEvent.press(view.getByRole('button', { name: '2026-09-23' }));
  fireEvent.press(view.getByRole('button', { name: '지도 일정 C' }));
  expect(view.getByRole('button', { name: '지도 일정 C' }).props.accessibilityState.selected).toBe(true);
  connect('offline');
  expect(view.queryByText('일정 지도')).toBeNull();
  await act(async () => {
    await view.client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  connect('online');
  expect(view.getByText('일정 지도')).toBeTruthy();
  await act(async () => request.reject(new Error('server unavailable')));
  await waitFor(() => expect(view.getByText('일정을 갱신하지 못했어요. 이전 내용을 표시하고 있어요.')).toBeTruthy());
  fetchSchedules.mockResolvedValueOnce(mapRows());
  fireEvent.press(view.getByRole('button', { name: '다시 불러오기' }));
  await waitFor(() => expect(view.getByText('일정 지도')).toBeTruthy());
  expect(view.getByRole('button', { name: '2026-09-23' }).props.accessibilityState.selected).toBe(true);
  expect(view.getByRole('button', { name: '지도 일정 C' }).props.accessibilityState.selected).toBe(true);
});

it('목록과 지도를 오가거나 새 조회로 일정 배열이 바뀌어도 선택한 일정은 유지한다', async () => {
  const view = setup(undefined, mapRows());
  fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
  fireEvent.press(view.getByRole('button', { name: '2026-09-23' }));
  fireEvent.press(view.getByRole('button', { name: '지도 일정 C' }));
  fireEvent.press(view.getByRole('button', { name: '목록 보기로 전환' }));
  fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
  expect(view.getByRole('button', { name: '지도 일정 C' }).props.accessibilityState.selected).toBe(true);
  fetchSchedules.mockResolvedValue(mapRows().map((row) => ({ ...row, title: `${row.title} 갱신` })));
  await act(async () => {
    await view.client.refetchQueries({ queryKey: scheduleQueryKeys.list('trip') });
  });
  await waitFor(() =>
    expect(view.getByRole('button', { name: '지도 일정 C 갱신' }).props.accessibilityState.selected).toBe(true),
  );
});

it.each(['schedule', 'date'] as const)(
  '복구 결과에서 선택한 %s가 사라졌을 때만 유효한 선택으로 이동한다',
  async (removed) => {
    const request = deferred();
    fetchSchedules.mockReturnValueOnce(request.promise);
    const view = setup(undefined, mapRows());
    fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
    fireEvent.press(view.getByRole('button', { name: '2026-09-23' }));
    fireEvent.press(view.getByRole('button', { name: '지도 일정 C' }));
    connect('offline');
    await act(async () => {
      await view.client.invalidateQueries({ queryKey: scheduleQueryKeys.list('trip') });
    });
    connect('online');
    if (removed === 'date') {
      mockTrips = mockTrips.map((trip) => ({ ...trip, endDate: '2026-09-22T00:00:00Z' }));
    }
    await act(async () => request.resolve(mapRows().filter((row) => row.id !== 'c')));
    const date = removed === 'date' ? '2026-09-21' : '2026-09-23';
    const marker = removed === 'date' ? '지도 첫날 일정' : '지도 일정 B';
    await waitFor(() => expect(view.getByRole('button', { name: date }).props.accessibilityState.selected).toBe(true));
    await waitFor(() =>
      expect(view.getByRole('button', { name: marker }).props.accessibilityState.selected).toBe(true),
    );
  },
);

it('여행을 바꾸면 이전 여행의 지도 선택을 초기화한다', async () => {
  const view = setup(undefined, mapRows());
  act(() => {
    view.client.setQueryData(
      scheduleQueryKeys.list('other'),
      mapRows().map((row) => ({ ...row, tripId: 'other' })),
    );
  });
  fireEvent.press(view.getByRole('button', { name: '지도 보기로 전환' }));
  fireEvent.press(view.getByRole('button', { name: '2026-09-23' }));
  fireEvent.press(view.getByRole('button', { name: '지도 일정 C' }));
  act(() => useTripStore.setState({ selectedTripId: 'other' }));
  await waitFor(() =>
    expect(view.getByRole('button', { name: '2026-09-21' }).props.accessibilityState.selected).toBe(true),
  );
  expect(view.getByRole('button', { name: '지도 첫날 일정' }).props.accessibilityState.selected).toBe(true);
  act(() => useTripStore.setState({ selectedTripId: 'trip' }));
  expect(view.getByRole('button', { name: '2026-09-21' }).props.accessibilityState.selected).toBe(true);
});
