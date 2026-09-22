import { useAuthStore } from '@/shared/store/auth';
jest.mock('expo-secure-store', () => ({}));
beforeEach(() => useAuthStore.setState({ status: 'signed-in', userId: 'a' }));
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { useNetworkStore } from '@/shared/store/network';
import { useAppPolicy } from '@/shared/policy/useAppPolicy';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(), refresh: jest.fn() },
}));

jest.mock('@/entities/trip/data/useGetTripActivation', () => ({ useGetTripActivation: jest.fn() }));

const activationMock = jest.mocked(useGetTripActivation);

describe('Policy 표의 unknown 호환', () => {
  it.each([true, false])('활성 여부 %s일 때 Schedule·Expense CRUD와 제한된 서비스를 반환한다', (isActivated) => {
    activationMock.mockReturnValue({ data: { isActivated } } as ReturnType<typeof useGetTripActivation>);
    useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });

    const { result } = renderHook(() => useAppPolicy('trip-b'));

    const { schedule, expense, service } = result.current;

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
