import { useMemo } from 'react';
import { useAuthStore, hasLocalSession } from '@/shared/store/auth';
import { useDisplayNetworkStatus } from '@/shared/store/network';
import { useGetTripActivation } from '@/entities/trip/data/useGetTripActivation';
import { EXPENSE_POLICIES, SCHEDULE_POLICIES, SERVICE_POLICIES } from './constants';
import type {
  ActivationStatus,
  EntityPolicy,
  EntityPolicyTable,
  OperationPolicy,
  PolicyKey,
  ServicePolicy,
} from './types';

/** 현재 앱 상태에 맞게 선택된 Schedule·Expense·Service 정책이다. */
export interface AppPolicy {
  schedule: EntityPolicy;
  expense: EntityPolicy;
  service: ServicePolicy;
}

export function useAppPolicy(tripId?: string): AppPolicy {
  const displayNetworkStatus = useDisplayNetworkStatus();
  const authStatus = useAuthStore((state) => state.status);
  const { data: activation, isError: activationFailed } = useGetTripActivation(tripId ?? '');

  const isTripActivated = activation?.isActivated ?? false;
  const activationStatus: ActivationStatus = tripId && isTripActivated ? 'active' : 'inactive';

  // unknown도 Remote 기능을 열지 않도록 offline 정책을 사용한다.
  const policyNetworkStatus = displayNetworkStatus === 'online' ? 'online' : 'offline';
  const policyKey: PolicyKey = `${policyNetworkStatus}_${activationStatus}`;

  return useMemo(() => {
    const needsReauthentication = authStatus === 'reauth-required';
    let unavailablePolicy: OperationPolicy | undefined;

    if (!hasLocalSession({ status: authStatus })) {
      unavailablePolicy = {
        allowed: false,
        reason: '다시 로그인한 뒤 사용할 수 있습니다',
      };
    } else if (tripId && activation === undefined) {
      // null은 조회 성공 후 활성 기록 없음, undefined는 아직 성공한 조회 결과 없음이다.
      // 기존 결과가 있으면 background 재조회 중이거나 실패해도 그 결과를 유지한다.
      unavailablePolicy = activationFailed
        ? { allowed: false, reason: '여행 활성 상태를 확인하지 못했어요.' }
        : { allowed: false, pending: true, reason: '여행 활성 상태를 확인하고 있어요.' };
    } else if (needsReauthentication && !isTripActivated) {
      unavailablePolicy = {
        allowed: false,
        reason: '다시 로그인한 뒤 사용할 수 있습니다',
      };
    }

    if (unavailablePolicy) {
      const blockedEntityPolicy: EntityPolicy = {
        create: unavailablePolicy,
        read: unavailablePolicy,
        update: unavailablePolicy,
        delete: unavailablePolicy,
      };

      return {
        schedule: blockedEntityPolicy,
        expense: blockedEntityPolicy,
        service: SERVICE_POLICIES[policyKey],
      };
    }

    return {
      schedule: selectEntityPolicy(SCHEDULE_POLICIES, policyKey),
      expense: selectEntityPolicy(EXPENSE_POLICIES, policyKey),
      service: SERVICE_POLICIES[policyKey],
    };
  }, [policyKey, authStatus, isTripActivated, tripId, activation, activationFailed]);
}

function selectEntityPolicy(policyTable: EntityPolicyTable, policyKey: PolicyKey): EntityPolicy {
  return {
    create: policyTable.create[policyKey],
    read: policyTable.read[policyKey],
    update: policyTable.update[policyKey],
    delete: policyTable.delete[policyKey],
  };
}
