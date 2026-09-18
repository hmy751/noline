import { describe, expect, it, jest } from '@jest/globals';
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

describe('기존 Policy 표의 unknown 호환', () => {
  it.each([true, false])('활성 여부 %s일 때 모든 권한·서비스를 반환하며 Remote 기능은 제한한다', (isActivated) => {
    activationMock.mockReturnValue({ data: { isActivated } } as ReturnType<typeof useGetTripActivation>);
    useNetworkStore.setState({ realStatus: 'unknown', overrideStatus: null });

    const { result } = renderHook(() => useAppPolicy('trip-b'));

    const { trip, schedule, expense, service } = result.current;

    for (const entity of [trip, schedule, expense]) {
      for (const operation of ['create', 'read', 'update', 'delete'] as const) {
        expect(entity[operation]).toBeDefined();
      }
    }

    expect(service.searchMode).toBe('disabled');
    expect(schedule.create.allowed).toBe(isActivated);
    expect(expense.update.allowed).toBe(isActivated);
  });
});
