import { useAuthStore } from '@/shared/store/auth';
jest.mock('expo-secure-store', () => ({}));
beforeEach(() => useAuthStore.setState({ status: 'signed-in', userId: 'a' }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { useNetworkStore } from '@/shared/store/network';
import { useAppPolicy } from '@/shared/policy/useAppPolicy';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { SCHEDULE_POLICIES, EXPENSE_POLICIES } from '@/shared/policy/constants';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));

jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));

const activationMock = jest.mocked(useGetTripActivation);

it('동일 여행의 일정과 경비 읽기 정책표는 네 상태에서 같은 허용·안내·복구 결과를 사용한다', () => {
  expect(SCHEDULE_POLICIES.read).toEqual(EXPENSE_POLICIES.read);
});

it.each([
  {
    realStatus: 'unknown' as const,
    checkStatus: 'checking' as const,
    pending: true,
    reason: '인터넷 연결을 확인하고 있어요.',
  },
  {
    realStatus: 'unknown' as const,
    checkStatus: 'unavailable' as const,
    pending: undefined,
    reason: '인터넷 연결을 확인할 수 없어요.',
  },
  {
    realStatus: 'offline' as const,
    checkStatus: 'idle' as const,
    pending: undefined,
    reason: '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
  },
])(
  '비활성 여행의 CRUD는 $realStatus/$checkStatus의 이유를 함께 사용한다',
  ({ realStatus, checkStatus, pending, reason }) => {
    activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
    useNetworkStore.setState({ realStatus, checkStatus, overrideStatus: null });
    const { result } = renderHook(() => useAppPolicy('trip-b'));
    expect(result.current.schedule.read).toEqual(result.current.expense.read);
    for (const entity of [result.current.schedule, result.current.expense]) {
      for (const policy of Object.values(entity)) {
        expect(policy.allowed).toBe(false);
        expect(policy.pending).toBe(pending);
        expect(policy.reason).toBe(reason);
      }
    }
  },
);

it('인증이 만료된 비활성 여행에는 네트워크 확인보다 재로그인 안내가 우선한다', () => {
  useAuthStore.setState({ status: 'reauth-required' });
  activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  useNetworkStore.setState({ realStatus: 'unknown', checkStatus: 'checking', overrideStatus: null });
  const { result } = renderHook(() => useAppPolicy('trip-b'));
  expect(result.current.schedule.read).toEqual(result.current.expense.read);
  expect(result.current.schedule.read).toEqual({
    allowed: false,
    reason: '다시 로그인한 뒤 사용할 수 있습니다',
  });
});

it('실제 연결 확인이 진행되지 않는 강제 unknown은 확인 불가로 표시하며 실제 관측을 바꾸지 않는다', () => {
  activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  useNetworkStore.setState({ realStatus: 'online', checkStatus: 'idle', overrideStatus: 'unknown' });
  const { result } = renderHook(() => useAppPolicy('trip-b'));
  expect(result.current.schedule.read).toEqual(result.current.expense.read);
  expect(result.current.schedule.read).toEqual({
    allowed: false,
    reason: '인터넷 연결을 확인할 수 없어요.',
    recoveryAction: 'recheck-network',
  });
  expect(useNetworkStore.getState().realStatus).toBe('online');
  expect(useNetworkStore.getState().checkStatus).toBe('idle');
});

describe('Policy 표의 unknown 호환', () => {
  it.each([true, false])('활성 여부 %s일 때 Schedule·Expense CRUD와 제한된 서비스를 반환한다', (isActivated) => {
    activationMock.mockReturnValue({ data: { isActivated } } as ReturnType<typeof useGetTripActivation>);
    useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });

    const { result } = renderHook(() => useAppPolicy('trip-b'));

    const { schedule, expense, service } = result.current;
    expect(schedule.read).toEqual(expense.read);

    expect(service.searchMode).toBe('disabled');
    expect(schedule.create.allowed).toBe(isActivated);
    expect(schedule.read.allowed).toBe(isActivated);
    expect(schedule.update.allowed).toBe(isActivated);
    expect(schedule.delete.allowed).toBe(isActivated);
    expect(expense.create.allowed).toBe(isActivated);
    expect(expense.read.allowed).toBe(isActivated);
    expect(expense.update.allowed).toBe(isActivated);
    expect(expense.delete.allowed).toBe(isActivated);
  });
});

it('재인증 중에는 활성 여행 CRUD만 허용하며 실제 온라인 서비스 정책은 유지한다', () => {
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  activationMock.mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  const { result } = renderHook(() => useAppPolicy('trip-a'));
  expect(Object.values(result.current.schedule).every(({ allowed }) => allowed)).toBe(true);
  expect(Object.values(result.current.expense).every(({ allowed }) => allowed)).toBe(true);
  expect(result.current.service.searchMode).toBe('api');
});

it('재인증 중 비활성 여행은 서버가 온라인이어도 CRUD를 열지 않는다', () => {
  useAuthStore.setState({ status: 'reauth-required', userId: 'a' });
  activationMock.mockReturnValue({ data: { isActivated: false } } as ReturnType<typeof useGetTripActivation>);
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: null });
  const { result } = renderHook(() => useAppPolicy('inactive'));
  expect(Object.values(result.current.schedule).every(({ allowed }) => !allowed)).toBe(true);
  expect(Object.values(result.current.expense).every(({ allowed }) => !allowed)).toBe(true);
});

it.each(['offline', 'unknown'] as const)(
  '강제 online 표시와 실제 %s의 조회 정책을 같은 규칙으로 구별한다',
  (realStatus) => {
    activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
    useNetworkStore.setState({ realStatus, overrideStatus: 'online', checkStatus: 'unavailable' });
    const { result } = renderHook(() => ({
      display: useAppPolicy('trip'),
      real: useAppPolicy('trip', { network: 'real' }),
    }));
    expect(result.current.display.schedule.read.allowed).toBe(true);
    expect(result.current.display.service.mapProvider).toBe('google');
    expect(result.current.real.schedule.read.allowed).toBe(false);
    expect(result.current.real.schedule.read.reason).toBe(
      realStatus === 'unknown'
        ? '인터넷 연결을 확인할 수 없어요.'
        : '인터넷에 연결되어 있지 않아요. 오프라인에서는 활성 여행을 선택해주세요.',
    );
  },
);

it('강제 offline은 기본 화면 정책만 바꾸고 실제 관측 기준의 허용은 바꾸지 않는다', () => {
  activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  useNetworkStore.setState({ realStatus: 'online', overrideStatus: 'offline', checkStatus: 'idle' });
  const { result } = renderHook(() => ({
    display: useAppPolicy('trip'),
    real: useAppPolicy('trip', { network: 'real' }),
  }));
  expect(result.current.display.schedule.read.allowed).toBe(false);
  expect(result.current.real.schedule.read.allowed).toBe(true);
});

it.each(['display', 'real'] as const)('%s 기준도 활성 여행의 Local 읽기와 재인증 제한을 보존한다', (network) => {
  activationMock.mockReturnValue({ data: { isActivated: true } } as ReturnType<typeof useGetTripActivation>);
  useAuthStore.setState({ status: 'reauth-required' });
  useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: 'online', checkStatus: 'checking' });
  const { result, rerender } = renderHook(() => useAppPolicy('trip', { network }));
  expect(result.current.schedule.read.allowed).toBe(true);
  activationMock.mockReturnValue({ data: null } as ReturnType<typeof useGetTripActivation>);
  rerender({});
  expect(result.current.schedule.read).toEqual({
    allowed: false,
    reason: '다시 로그인한 뒤 사용할 수 있습니다',
  });
});
